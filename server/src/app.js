import React, { useEffect, useState } from 'react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Check active session via HTTP-only cookie
  useEffect(() => {
    fetch('http://localhost:5000/api/auth/me', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error('Auth error:', err))
      .finally(() => setLoadingUser(false));
  }, []);

  // Fetch problems list from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/problems')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProblems(data.problems);
        }
      })
      .catch((err) => console.error('Problems fetch error:', err))
      .finally(() => setLoadingProblems(false));
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', fontFamily: 'sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #27272a', backgroundColor: '#18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>&lt;/&gt; CodePath</span>
        </div>

        <div>
          {loadingUser ? (
            <span style={{ color: '#71717a', fontSize: '14px' }}>Checking session...</span>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #38bdf8' }}
                />
              )}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
              <button
                onClick={handleLogout}
                style={{ padding: '6px 14px', backgroundColor: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Problem Catalog</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '28px', fontSize: '15px' }}>
          Practice DSA algorithmic questions and prepare for technical interviews.
        </p>

        {loadingProblems ? (
          <p style={{ color: '#71717a' }}>Loading problems...</p>
        ) : problems.length === 0 ? (
          <p style={{ color: '#71717a' }}>No problems available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {problems.map((problem) => (
              <div
                key={problem.id}
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
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>{problem.title}</h3>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>Slug: {problem.slug}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      textTransform: 'capitalize',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor:
                        problem.difficulty === 'easy'
                          ? '#14532d'
                          : problem.difficulty === 'medium'
                            ? '#713f12'
                            : '#7f1d1d',
                      color:
                        problem.difficulty === 'easy'
                          ? '#86efac'
                          : problem.difficulty === 'medium'
                            ? '#fde047'
                            : '#fca5a5',
                    }}
                  >
                    {problem.difficulty}
                  </span>

                  <button
                    onClick={() => alert(`Problem solving interface for: ${problem.title}`)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    Solve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}