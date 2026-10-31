import React, { useEffect, useState, useRef } from 'react';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Navigation views: 'sections' | 'categories' | 'quiz' | 'result'
  const [view, setView] = useState('sections');

  // Selected track & category
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Quota limits: { language: { used, limit }, dsa: { used, limit }, core: { used, limit } }
  const [limits, setLimits] = useState({
    language: { used: 0, limit: 100 },
    dsa: { used: 0, limit: 100 },
    core: { used: 0, limit: 100 },
  });
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Active practice session
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionCounter, setQuestionCounter] = useState(1);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [answerResult, setAnswerResult] = useState(null); // { isCorrect, correctOptionId, explanation }
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Prefetch cache for the next question
  const prefetchedNextRef = useRef(null);

  // Read-only Back review mode
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewPosition, setReviewPosition] = useState(null);
  const [reviewData, setReviewData] = useState(null);

  // Result summary after finishing session
  const [sessionResult, setSessionResult] = useState(null);
  const [limitNotice, setLimitNotice] = useState(null);

  // Check auth session
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch((err) => console.error('Auth error:', err))
      .finally(() => setLoadingUser(false));
  }, []);

  // Fetch quota limits for a given track
  const fetchLimits = async (track) => {
    setLoadingLimits(true);
    try {
      const res = await fetch(`${API_BASE}/limits?track=${encodeURIComponent(track)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setLimits({
        language: data.language || { used: 0, limit: 100 },
        dsa: data.dsa || { used: 0, limit: 100 },
        core: data.core || { used: 0, limit: 100 },
      });
    } catch (err) {
      console.error('Failed to load limits:', err);
    } finally {
      setLoadingLimits(false);
    }
  };

  // Select a track from the 5 section cards
  const handleSelectTrack = (track) => {
    setSelectedTrack(track);
    fetchLimits(track);
    setView('categories');
  };

  // Start a new practice session in a category
  const handleStartSession = async (category) => {
    setSelectedCategory(category);
    setLoadingQuestion(true);
    setLimitNotice(null);
    setReviewMode(false);
    setQuestionCounter(1);
    setSelectedOptionId(null);
    setAnswerResult(null);
    prefetchedNextRef.current = null;

    try {
      // 1. Create session via POST /api/sessions
      const sessionRes = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ track: selectedTrack, category }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.success && sessionData.error) {
        alert(sessionData.error);
        return;
      }

      const activeSession = sessionData.session || sessionData;
      setSession(activeSession);

      // 2. Fetch first question
      const qRes = await fetch(`${API_BASE}/mcq/next?sessionId=${activeSession.id}`, {
        credentials: 'include',
      });

      if (qRes.status === 403) {
        const errData = await qRes.json();
        if (errData.code === 'LIMIT_REACHED') {
          handleLimitReached(errData.message, activeSession.id);
          return;
        }
      }

      const qData = await qRes.json();
      if (qData.finished) {
        alert(qData.message || 'All questions completed in this category!');
        setView('categories');
        return;
      }

      setCurrentQuestion(qData.problem);
      setView('quiz');
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Submit answer for active question
  const handleSubmitAnswer = async () => {
    if (!selectedOptionId || !currentQuestion || !session) return;
    setSubmittingAnswer(true);

    try {
      const res = await fetch(`${API_BASE}/submissions/mcq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: session.id,
          problemId: currentQuestion.id,
          optionId: selectedOptionId,
        }),
      });

      if (res.status === 403) {
        const errData = await res.json();
        if (errData.code === 'LIMIT_REACHED') {
          handleLimitReached(errData.message, session.id);
          return;
        }
      }

      const data = await res.json();
      setAnswerResult(data);

      // Refresh limits in background
      fetchLimits(selectedTrack);

      // Prefetch the next question in the background while user reads explanation!
      prefetchNextQuestion(session.id);
    } catch (err) {
      console.error('Submit answer error:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Prefetch next question
  const prefetchNextQuestion = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/mcq/next?sessionId=${sessionId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.finished && data.problem) {
          prefetchedNextRef.current = data.problem;
        }
      }
    } catch {
      // Prefetch is silent optimization
    }
  };

  // Move to Next question
  const handleNextQuestion = async () => {
    if (reviewMode) {
      // If we are currently reviewing a past question, go forward
      const nextPos = reviewPosition + 1;
      if (nextPos < questionCounter) {
        handleViewPastAnswer(nextPos);
      } else {
        // Return to active quiz question
        setReviewMode(false);
        setReviewData(null);
      }
      return;
    }

    setLoadingQuestion(true);
    setSelectedOptionId(null);
    setAnswerResult(null);

    // If we have a prefetched question, use it instantly!
    if (prefetchedNextRef.current) {
      setCurrentQuestion(prefetchedNextRef.current);
      prefetchedNextRef.current = null;
      setQuestionCounter((prev) => prev + 1);
      setLoadingQuestion(false);
      return;
    }

    // Otherwise fetch normally
    try {
      const res = await fetch(`${API_BASE}/mcq/next?sessionId=${session.id}`, {
        credentials: 'include',
      });

      if (res.status === 403) {
        const errData = await res.json();
        if (errData.code === 'LIMIT_REACHED') {
          handleLimitReached(errData.message, session.id);
          return;
        }
      }

      const data = await res.json();
      if (data.finished) {
        handleEndSession();
        return;
      }

      setCurrentQuestion(data.problem);
      setQuestionCounter((prev) => prev + 1);
    } catch (err) {
      console.error('Next question fetch error:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // View past answer read-only (Back navigation)
  const handleViewPastAnswer = async (position) => {
    if (!session || position < 1) return;
    setLoadingQuestion(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${session.id}/answers/${position}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviewMode(true);
        setReviewPosition(position);
        setReviewData(data);
      }
    } catch (err) {
      console.error('Review answer fetch error:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Triggered when Back button is clicked in Quiz
  const handleBack = () => {
    if (reviewMode) {
      if (reviewPosition > 1) {
        handleViewPastAnswer(reviewPosition - 1);
      }
    } else {
      if (questionCounter > 1) {
        handleViewPastAnswer(questionCounter - 1);
      }
    }
  };

  // Finish practice session and go to Result screen
  const handleEndSession = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${session.id}/finish`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setSessionResult(data);
      setView('result');
    } catch (err) {
      console.error('Finish session error:', err);
    }
  };

  // Limit reached handler
  const handleLimitReached = async (message, sessionId) => {
    setLimitNotice(message || "You've used your 100 free questions in this part");
    try {
      const sId = sessionId || session?.id;
      if (sId) {
        const res = await fetch(`${API_BASE}/sessions/${sId}/finish`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await res.json();
        setSessionResult(data);
      }
    } catch {
      // Fallback
    }
    setView('result');
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setView('sections');
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  // -------------------------------------------------------------
  // RENDERING LOGIC
  // -------------------------------------------------------------

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px' }}>&lt;/&gt; CodePath</div>
          <div style={{ color: '#71717a', fontSize: '14px' }}>Loading session...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navigation Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid #27272a', backgroundColor: '#18181b', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span
            onClick={() => setView('sections')}
            style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', cursor: 'pointer', letterSpacing: '-0.5px' }}
          >
            &lt;/&gt; CodePath
          </span>
          {view !== 'sections' && (
            <button
              onClick={() => {
                if (view === 'quiz') {
                  if (confirm('Exit practice session and return to sections?')) {
                    setView('sections');
                  }
                } else {
                  setView('sections');
                }
              }}
              style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              ← Sections
            </button>
          )}
        </div>

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {user.isAdmin && (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#701a75', color: '#f0abfc', fontWeight: '700', border: '1px solid #a21caf', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin (Unlimited)
                </span>
              )}
              {user.avatar_url && (
                <img src={user.avatar_url} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #38bdf8' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
              <button
                onClick={handleLogout}
                style={{ padding: '6px 12px', backgroundColor: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1020px', margin: '36px auto', padding: '0 20px' }}>
        {!user ? (
          /* Unauthenticated Landing / Call to Action */
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', marginTop: '40px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px', color: '#f4f4f5', letterSpacing: '-0.5px' }}>
              Master Technical & Placement Assessments
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
              Targeted practice sets across Java, JavaScript, Python, C++, Core Computer Science Fundamentals, and Data Structures.
            </p>
            <button
              onClick={handleLogin}
              style={{ padding: '12px 30px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
            >
              Get Started with Google
            </button>
          </div>
        ) : view === 'sections' ? (
          /* 1. SECTIONS VIEW: 5 Active Section Cards + 1 Disabled Code Corner Card */
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                Practice Tracks & Sections
              </h1>
              <p style={{ color: '#a1a1aa', margin: '8px 0 0 0', fontSize: '14px' }}>
                Select a programming language or fundamental subject to start a focused practice session.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Java Section */}
              <div
                onClick={() => handleSelectTrack('Java')}
                style={{ padding: '24px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>☕</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Java</h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Core OOPs, Collections, JVM memory internals, GC, and Multithreading.
                </p>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Open Section →</span>
              </div>

              {/* JavaScript Section */}
              <div
                onClick={() => handleSelectTrack('JavaScript')}
                style={{ padding: '24px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>JavaScript</h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Event loop execution order, microtasks, closures, prototype chain & Web APIs.
                </p>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Open Section →</span>
              </div>

              {/* Python Section */}
              <div
                onClick={() => handleSelectTrack('Python')}
                style={{ padding: '24px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🐍</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Python</h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  CPython internals, GIL concurrency, generators, decorators & data structures.
                </p>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Open Section →</span>
              </div>

              {/* C++ Section */}
              <div
                onClick={() => handleSelectTrack('C++')}
                style={{ padding: '24px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚙️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>C++</h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Modern C++, STL containers, raw & smart pointers, memory management and move semantics.
                </p>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Open Section →</span>
              </div>

              {/* Core Fundamentals Section */}
              <div
                onClick={() => handleSelectTrack('Core Fundamentals')}
                style={{ padding: '24px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🌐</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Core Fundamentals</h3>
                <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Operating Systems, DBMS/SQL indexes, ACID transactions and Computer Networks.
                </p>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Open Section →</span>
              </div>

              {/* Disabled: Code Corner (coming soon) */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: '#121214',
                  borderRadius: '12px',
                  border: '1px dashed #27272a',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '28px' }}>💻</div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#27272a', color: '#a1a1aa', fontWeight: '600' }}>
                    Coming Soon
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#71717a' }}>Code Corner</h3>
                <p style={{ color: '#52525b', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Interactive in-browser code runner & algorithmic problem solving arena.
                </p>
              </div>
            </div>
          </div>
        ) : view === 'categories' ? (
          /* 2. CATEGORIES VIEW: Quotas & Language/DSA Options */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <button
                  onClick={() => setView('sections')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '6px' }}
                >
                  ← Back to Sections
                </button>
                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0 }}>
                  {selectedTrack} Practice Options
                </h1>
              </div>
            </div>

            {loadingLimits ? (
              <p style={{ color: '#71717a' }}>Loading remaining quotas...</p>
            ) : selectedTrack === 'Core Fundamentals' ? (
              /* Core Fundamentals: 1 Card */
              <div style={{ maxWidth: '480px' }}>
                <div
                  onClick={() => handleStartSession('core')}
                  style={{
                    padding: '24px',
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📚</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: user.isAdmin ? '#701a75' : '#14532d',
                        color: user.isAdmin ? '#f0abfc' : '#86efac',
                        fontWeight: '700',
                      }}
                    >
                      {user.isAdmin ? 'Unlimited' : `${Math.max(0, 100 - limits.core.used)} / 100 left`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    Core Fundamentals Questions
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    Operating systems, memory paging, scheduling, transactions, and networking.
                  </p>
                  <button
                    style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Start Session →
                  </button>
                </div>
              </div>
            ) : (
              /* Language Tracks: 2 Cards (<Language> Questions and DSA Questions) */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Language Questions Card */}
                <div
                  onClick={() => handleStartSession('language')}
                  style={{
                    padding: '24px',
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📝</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: user.isAdmin ? '#701a75' : '#14532d',
                        color: user.isAdmin ? '#f0abfc' : '#86efac',
                        fontWeight: '700',
                      }}
                    >
                      {user.isAdmin ? 'Unlimited' : `${Math.max(0, 100 - limits.language.used)} / 100 left`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    {selectedTrack} Questions
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    Language semantics, runtime memory, syntax features, and standard library depth.
                  </p>
                  <button
                    style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Start Practice →
                  </button>
                </div>

                {/* DSA Questions Card */}
                <div
                  onClick={() => handleStartSession('dsa')}
                  style={{
                    padding: '24px',
                    backgroundColor: '#18181b',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📊</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: user.isAdmin ? '#701a75' : '#14532d',
                        color: user.isAdmin ? '#f0abfc' : '#86efac',
                        fontWeight: '700',
                      }}
                    >
                      {user.isAdmin ? 'Unlimited' : `${Math.max(0, 100 - limits.dsa.used)} / 100 left`}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    DSA Questions
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    Data structures, algorithmic time complexities, dynamic programming, and search trees.
                  </p>
                  <button
                    style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Start Practice →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : view === 'quiz' ? (
          /* 3. QUIZ SCREEN: One Question at a Time, Options A-D, Instant Green/Red, Explanation, Prefetch, Back, End Session */
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            {/* Quiz Top Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleBack}
                  disabled={questionCounter <= 1 && (!reviewMode || reviewPosition <= 1)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    color: (questionCounter <= 1 && (!reviewMode || reviewPosition <= 1)) ? '#71717a' : '#f4f4f5',
                    borderRadius: '6px',
                    cursor: (questionCounter <= 1 && (!reviewMode || reviewPosition <= 1)) ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  ← Back
                </button>
                <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>
                  {reviewMode
                    ? `Reviewing Question #${reviewPosition}`
                    : `Question #${questionCounter}`}
                </span>
              </div>

              {/* End Session Button Always Visible */}
              <button
                onClick={handleEndSession}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#7f1d1d22',
                  border: '1px solid #ef444466',
                  color: '#f87171',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                End Session
              </button>
            </div>

            {reviewMode && (
              <div style={{ padding: '10px 16px', backgroundColor: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '8px', color: '#c7d2fe', fontSize: '13px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📖 Read-Only Review Mode (No quota used)</span>
                <button
                  onClick={() => { setReviewMode(false); setReviewData(null); }}
                  style={{ backgroundColor: '#4338ca', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  Resume Active Quiz →
                </button>
              </div>
            )}

            {/* Question Card */}
            {loadingQuestion ? (
              <div style={{ padding: '40px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', textAlign: 'center', color: '#71717a' }}>
                Loading question...
              </div>
            ) : (
              <div style={{ padding: '32px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}>
                {/* Header badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1e1b4b', color: '#a5b4fc', fontWeight: '600', textTransform: 'uppercase' }}>
                      {reviewMode ? reviewData?.track : currentQuestion?.track}
                    </span>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#042f2e', color: '#5eead4', fontWeight: '600', textTransform: 'uppercase' }}>
                      {reviewMode ? reviewData?.category : currentQuestion?.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#86efac', textTransform: 'capitalize' }}>
                    {reviewMode ? reviewData?.difficulty : currentQuestion?.difficulty}
                  </span>
                </div>

                {/* Question title & description */}
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '14px', lineHeight: '1.4' }}>
                  {reviewMode ? reviewData?.title : currentQuestion?.title}
                </h2>
                <div style={{ fontSize: '15px', color: '#d4d4d8', lineHeight: '1.6', marginBottom: '28px', whiteSpace: 'pre-wrap' }}>
                  {reviewMode ? reviewData?.description : currentQuestion?.description}
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {(reviewMode ? reviewData?.options : currentQuestion?.options)?.map((opt) => {
                    const isSelected = reviewMode
                      ? reviewData?.selectedOptionId === opt.id
                      : selectedOptionId === opt.id;

                    const isCorrectAnswer = reviewMode
                      ? reviewData?.correctOptionId === opt.id || reviewData?.correctOption === opt.option_key
                      : answerResult && (answerResult.correctOptionId === opt.id || answerResult.correctOption === opt.option_key);

                    const isUserWrong = (reviewMode && isSelected && !reviewData?.isCorrect) ||
                      (answerResult && isSelected && !answerResult.isCorrect);

                    let borderCol = '#27272a';
                    let bgCol = '#09090b';
                    let badgeBg = '#27272a';
                    let badgeColor = '#a1a1aa';

                    if (isCorrectAnswer) {
                      borderCol = '#22c55e';
                      bgCol = '#14532d33';
                      badgeBg = '#16a34a';
                      badgeColor = '#ffffff';
                    } else if (isUserWrong) {
                      borderCol = '#ef4444';
                      bgCol = '#7f1d1d33';
                      badgeBg = '#dc2626';
                      badgeColor = '#ffffff';
                    } else if (isSelected) {
                      borderCol = '#38bdf8';
                      bgCol = '#0284c722';
                      badgeBg = '#0284c7';
                      badgeColor = '#ffffff';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (!answerResult && !reviewMode) {
                            setSelectedOptionId(opt.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 20px',
                          borderRadius: '8px',
                          border: `2px solid ${borderCol}`,
                          backgroundColor: bgCol,
                          cursor: (answerResult || reviewMode) ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 'bold',
                            }}
                          >
                            {opt.option_key}
                          </div>
                          <span style={{ fontSize: '15px', color: '#f4f4f5' }}>{opt.option_text}</span>
                        </div>

                        {isCorrectAnswer && (
                          <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '13px' }}>
                            ✓ Correct
                          </span>
                        )}
                        {isUserWrong && (
                          <span style={{ color: '#f87171', fontWeight: '700', fontSize: '13px' }}>
                            ✗ Your Pick
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action / Instant Feedback / Explanation */}
                <div style={{ borderTop: '1px solid #27272a', paddingTop: '20px' }}>
                  {reviewMode ? (
                    <div>
                      <div style={{ backgroundColor: '#09090b', padding: '16px 20px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Explanation
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                          {reviewData?.explanation}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          onClick={handleNextQuestion}
                          style={{ padding: '10px 22px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                        >
                          Next Question →
                        </button>
                      </div>
                    </div>
                  ) : !answerResult ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOptionId || submittingAnswer}
                      style={{
                        padding: '11px 26px',
                        backgroundColor: !selectedOptionId ? '#3f3f46' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: !selectedOptionId ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      {submittingAnswer ? 'Checking Answer...' : 'Submit Answer'}
                    </button>
                  ) : (
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: '700', color: answerResult.isCorrect ? '#4ade80' : '#f87171', marginBottom: '12px' }}>
                        {answerResult.isCorrect ? '✓ Correct Answer! Well done.' : '✗ Incorrect Answer.'}
                      </div>

                      <div style={{ backgroundColor: '#09090b', padding: '16px 20px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Explanation
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                          {answerResult.explanation}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleNextQuestion}
                          style={{
                            padding: '10px 24px',
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Next Question →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : view === 'result' ? (
          /* 4. RESULT SCREEN: Questions Attempted, Correct, Incorrect, Accuracy %, List of Wrong Questions, Practice Again, Back to Sections */
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            {/* Friendly limit notice banner if limit was reached */}
            {limitNotice && (
              <div style={{ padding: '16px 22px', backgroundColor: '#713f1244', border: '1px solid #ca8a04', borderRadius: '10px', color: '#fef08a', marginBottom: '24px', fontSize: '15px', fontWeight: '500' }}>
                ⚠️ {limitNotice}
              </div>
            )}

            <div style={{ padding: '36px', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', marginBottom: '28px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎯</div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0' }}>Practice Session Completed</h1>
                <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
                  Here is the full breakdown of your performance in {selectedTrack} • {selectedCategory?.toUpperCase()}
                </p>
              </div>

              {/* 4 Metric Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '16px', backgroundColor: '#09090b', borderRadius: '10px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Attempted</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#f4f4f5' }}>{sessionResult?.attempted ?? 0}</div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#09090b', borderRadius: '10px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Correct</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80' }}>{sessionResult?.correct ?? 0}</div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#09090b', borderRadius: '10px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ color: '#f87171', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Incorrect</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#f87171' }}>{sessionResult?.incorrect ?? 0}</div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#09090b', borderRadius: '10px', border: '1px solid #27272a', textAlign: 'center' }}>
                  <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Accuracy</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>{sessionResult?.percentage ?? 0}%</div>
                </div>
              </div>

              {/* Wrong Questions Review Section */}
              {sessionResult?.wrongQuestions?.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✗ Wrong Questions Review</span>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#7f1d1d', color: '#fca5a5' }}>
                      {sessionResult.wrongQuestions.length}
                    </span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {sessionResult.wrongQuestions.map((wq, idx) => (
                      <div key={idx} style={{ padding: '18px 20px', backgroundColor: '#09090b', borderRadius: '10px', border: '1px solid #27272a' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '600', color: '#f4f4f5' }}>
                          {idx + 1}. {wq.title}
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ padding: '8px 12px', backgroundColor: '#7f1d1d22', border: '1px solid #ef444444', borderRadius: '6px', fontSize: '13px', color: '#f87171' }}>
                            <span style={{ fontWeight: 'bold' }}>Your Pick: </span>
                            <span>{wq.userOption}</span>
                          </div>

                          <div style={{ padding: '8px 12px', backgroundColor: '#14532d22', border: '1px solid #22c55e44', borderRadius: '6px', fontSize: '13px', color: '#4ade80' }}>
                            <span style={{ fontWeight: 'bold' }}>Correct Answer: </span>
                            <span>{wq.correctOption}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', backgroundColor: '#18181b', padding: '10px 14px', borderRadius: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#38bdf8' }}>Explanation: </span>
                          {wq.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#14532d22', border: '1px solid #22c55e44', borderRadius: '10px', color: '#86efac' }}>
                  🎉 Perfect Session! You answered all questions correctly without any errors.
                </div>
              )}

              {/* Action Buttons: Practice Again & Back to Sections */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '36px' }}>
                <button
                  onClick={() => handleStartSession(selectedCategory)}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  Practice Again
                </button>
                <button
                  onClick={() => setView('sections')}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    color: '#f4f4f5',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  Back to Sections
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
