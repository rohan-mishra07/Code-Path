import React, { useEffect, useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' or 'coding'
  const [user, setUser] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);

  // Coding states
  const [userCode, setUserCode] = useState('');
  const [executing, setExecuting] = useState(false);
  const [runResult, setRunResult] = useState(null);

  // MCQ states
  const [selectedOption, setSelectedOption] = useState(null);
  const [mcqResult, setMcqResult] = useState(null);
  const [submittingMcq, setSubmittingMcq] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch((err) => console.error('Auth check error:', err));
  }, []);

  const loadProblems = () => {
    fetch('http://localhost:5000/api/problems')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProblems(data.problems);
      })
      .catch((err) => console.error('Problems error:', err));
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleOpenProblem = async (slug) => {
    setRunResult(null);
    setMcqResult(null);
    setSelectedOption(null);

    try {
      const res = await fetch(`http://localhost:5000/api/problems/${slug}`);
      const data = await res.json();
      if (data.success) {
        setActiveProblem(data.problem);
        if (data.problem.problem_type !== 'mcq') {
          setUserCode(`/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);
        }
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
    }
  };

  const handleSubmitMcq = async () => {
    if (!selectedOption || !activeProblem) return;
    setSubmittingMcq(true);
    try {
      const res = await fetch('http://localhost:5000/api/submissions/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          problemId: activeProblem.id,
          selectedOptionKey: selectedOption,
        }),
      });
      const data = await res.json();
      setMcqResult(data);
    } catch (err) {
      console.error('MCQ Submit error:', err);
    } finally {
      setSubmittingMcq(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeProblem) return;
    setExecuting(true);
    setRunResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/submissions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          problemId: activeProblem.id,
          code: userCode,
          language: 'javascript',
        }),
      });
      const data = await res.json();
      setRunResult(data);
    } catch (err) {
      setRunResult({ success: false, error: 'Execution failed' });
    } finally {
      setExecuting(false);
    }
  };

  const filteredProblems = problems.filter((p) =>
    activeTab === 'mcq' ? p.problem_type === 'mcq' : p.problem_type !== 'mcq'
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 28px', borderBottom: '1px solid #27272a', backgroundColor: '#18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span
            onClick={() => setActiveProblem(null)}
            style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', cursor: 'pointer' }}
          >
            &lt;/&gt; CodePath
          </span>

          {/* Back button visible whenever a problem is opened */}
          {activeProblem && (
            <button
              onClick={() => setActiveProblem(null)}
              style={{
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                color: '#f4f4f5',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              ← Back to Catalog
            </button>
          )}

          {/* Navigation Tabs */}
          {!activeProblem && (
            <nav style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('mcq')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  backgroundColor: activeTab === 'mcq' ? '#38bdf8' : 'transparent',
                  color: activeTab === 'mcq' ? '#09090b' : '#a1a1aa',
                }}
              >
                📝 Assessment MCQs ({problems.filter(p => p.problem_type === 'mcq').length})
              </button>
              <button
                onClick={() => setActiveTab('coding')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  backgroundColor: activeTab === 'coding' ? '#38bdf8' : 'transparent',
                  color: activeTab === 'coding' ? '#09090b' : '#a1a1aa',
                }}
              >
                💻 Code Corner ({problems.filter(p => p.problem_type !== 'mcq').length})
              </button>
            </nav>
          )}
        </div>

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user.avatar_url && (
                <img src={user.avatar_url} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #38bdf8' }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
            </div>
          ) : (
            <button
              onClick={() => { window.location.href = 'http://localhost:5000/api/auth/google'; }}
              style={{ padding: '7px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      {!activeProblem ? (
        <main style={{ maxWidth: '960px', margin: '36px auto', padding: '0 20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>
              {activeTab === 'mcq' ? 'Technical Assessment & Interview MCQs' : 'Algorithmic Coding Questions'}
            </h1>
            <p style={{ color: '#a1a1aa', margin: '6px 0 0 0', fontSize: '14px' }}>
              {activeTab === 'mcq'
                ? 'Core Java, OOPs, DBMS/SQL, OS, and DSA logic questions frequently asked in placement exams.'
                : 'Practice algorithmic problem solving with test cases.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredProblems.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: '#18181b',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: p.problem_type === 'mcq' ? '#1e1b4b' : '#042f2e',
                      color: p.problem_type === 'mcq' ? '#a5b4fc' : '#5eead4',
                      fontWeight: '600',
                    }}
                  >
                    {p.topic}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>{p.title}</h3>
                    <span style={{ fontSize: '12px', color: '#71717a' }}>Slug: {p.slug}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      textTransform: 'capitalize',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: p.difficulty === 'easy' ? '#14532d' : '#713f12',
                      color: p.difficulty === 'easy' ? '#86efac' : '#fde047',
                    }}
                  >
                    {p.difficulty}
                  </span>
                  <button
                    onClick={() => handleOpenProblem(p.slug)}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: p.problem_type === 'mcq' ? '#2563eb' : '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    {p.problem_type === 'mcq' ? 'Attempt MCQ' : 'Solve Code'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : activeProblem.problem_type === 'mcq' ? (
        /* MCQ Room with Explicit Green Correct Answers and Explanations */
        <main style={{ maxWidth: '780px', margin: '36px auto', padding: '32px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#1e1b4b', color: '#a5b4fc', fontWeight: '600' }}>
              {activeProblem.topic}
            </span>
            <span style={{ fontSize: '12px', color: '#86efac', textTransform: 'capitalize' }}>
              Difficulty: {activeProblem.difficulty}
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.4' }}>{activeProblem.title}</h2>
          <div style={{ fontSize: '15px', color: '#d4d4d8', lineHeight: '1.6', marginBottom: '28px', whiteSpace: 'pre-wrap' }}>
            {activeProblem.description}
          </div>

          {/* Options with Green/Red validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {activeProblem.options?.map((opt) => {
              const isSelected = selectedOption === opt.option_key;
              const isCorrectOption = mcqResult && opt.option_key === mcqResult.correctOption;
              const isIncorrectSelection = mcqResult && isSelected && !mcqResult.passed;

              let borderCol = '#27272a';
              let bgCol = '#09090b';
              let badgeBg = '#27272a';
              let badgeColor = '#a1a1aa';

              if (mcqResult) {
                if (isCorrectOption) {
                  borderCol = '#22c55e';
                  bgCol = '#14532d33';
                  badgeBg = '#16a34a';
                  badgeColor = '#ffffff';
                } else if (isIncorrectSelection) {
                  borderCol = '#ef4444';
                  bgCol = '#7f1d1d33';
                  badgeBg = '#dc2626';
                  badgeColor = '#ffffff';
                }
              } else if (isSelected) {
                borderCol = '#38bdf8';
                bgCol = '#0284c722';
                badgeBg = '#0284c7';
                badgeColor = '#ffffff';
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => !mcqResult && setSelectedOption(opt.option_key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    border: `2px solid ${borderCol}`,
                    backgroundColor: bgCol,
                    cursor: mcqResult ? 'default' : 'pointer',
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

                  {mcqResult && isCorrectOption && (
                    <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '13px' }}>
                      ✓ Correct Answer
                    </span>
                  )}
                  {mcqResult && isIncorrectSelection && (
                    <span style={{ color: '#f87171', fontWeight: '700', fontSize: '13px' }}>
                      ✗ Your Choice
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission / Explanation Footer */}
          <div style={{ borderTop: '1px solid #27272a', paddingTop: '20px' }}>
            {!mcqResult ? (
              <button
                onClick={handleSubmitMcq}
                disabled={!selectedOption || submittingMcq}
                style={{
                  padding: '11px 26px',
                  backgroundColor: !selectedOption ? '#3f3f46' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: !selectedOption ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {submittingMcq ? 'Checking...' : 'Submit Answer'}
              </button>
            ) : (
              <div>
                <div style={{ fontSize: '17px', fontWeight: '700', color: mcqResult.passed ? '#4ade80' : '#f87171', marginBottom: '14px' }}>
                  {mcqResult.message}
                </div>
                <div style={{ backgroundColor: '#09090b', padding: '16px 20px', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' }}>Explanation</span>
                    <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>• Correct Option: ({mcqResult.correctOption})</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {mcqResult.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Code Corner Split Screen */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', height: 'calc(100vh - 61px)' }}>
          <div style={{ padding: '24px 30px', borderRight: '1px solid #27272a', overflowY: 'auto' }}>
            <span style={{ fontSize: '12px', color: '#86efac', textTransform: 'capitalize' }}>
              {activeProblem.difficulty}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '14px 0 10px 0' }}>{activeProblem.title}</h2>
            <div style={{ lineHeight: '1.6', color: '#d4d4d8', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {activeProblem.description}
            </div>

            <h4 style={{ margin: '24px 0 10px 0', fontSize: '14px', color: '#a1a1aa' }}>Constraints</h4>
            <pre style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', color: '#cbd5e1', fontSize: '13px' }}>
              {activeProblem.constraints || 'Standard algorithm constraints apply.'}
            </pre>

            <h4 style={{ margin: '24px 0 10px 0', fontSize: '14px', color: '#a1a1aa' }}>Sample Test Cases</h4>
            {activeProblem.sample_test_cases?.map((tc, idx) => (
              <div key={tc.id} style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', marginBottom: '10px', fontSize: '13px', fontFamily: 'monospace' }}>
                <div style={{ color: '#71717a' }}>Case {idx + 1}:</div>
                <div style={{ marginTop: '4px' }}>Input: <span style={{ color: '#38bdf8' }}>{tc.input}</span></div>
                <div style={{ marginTop: '4px' }}>Expected: <span style={{ color: '#4ade80' }}>{tc.expected_output}</span></div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#121214' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>JavaScript (Node.js)</span>
              <button
                onClick={handleRunCode}
                disabled={executing}
                style={{ backgroundColor: executing ? '#475569' : '#16a34a', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '6px', cursor: executing ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                {executing ? 'Evaluating...' : 'Run Code ▶'}
              </button>
            </div>

            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              spellCheck="false"
              style={{
                flex: 1,
                backgroundColor: '#09090b',
                color: '#f4f4f5',
                border: 'none',
                padding: '16px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'none',
                outline: 'none',
              }}
            />

            <div style={{ height: '200px', borderTop: '1px solid #27272a', backgroundColor: '#18181b', padding: '16px 20px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', marginBottom: '8px' }}>Execution Results</div>
              {!runResult ? (
                <span style={{ fontSize: '13px', color: '#71717a' }}>Click "Run Code" to evaluate your solution.</span>
              ) : (
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: runResult.status === 'Accepted' ? '#4ade80' : '#f87171', marginBottom: '8px' }}>
                    {runResult.status}
                  </div>
                  {runResult.results?.map((res, i) => (
                    <div key={i} style={{ fontSize: '13px', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Test Case {i + 1}: <span style={{ color: res.passed ? '#4ade80' : '#f87171' }}>{res.passed ? 'PASSED ✓' : 'FAILED ✗'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}