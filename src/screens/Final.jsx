// src/screens/Final.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || 'https://ash-backend-production.up.railway.app';

export default function Final() {
  const navigate = useNavigate();
  const [input, setInput]       = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [allowed, setAllowed]   = useState(false);

  // Проверяем, можно ли вводить фразу
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    if (!userId) {
      navigate('/init');
      return;
    }
    fetch(`${BACKEND_URL}/api/final/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.canEnter) {
          setAllowed(true);
          setStatus('🗝 You may now enter your final phrase.');
        } else {
          setStatus('🕓 Not the time yet.');
        }
      })
      .catch(() => setStatus('⚠️ Error checking permission.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!allowed) return;
    setLoading(true);
    setStatus('');

    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;

    try {
      const res = await fetch(`${BACKEND_URL}/api/validate-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, inputPhrase: input.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus('✅ Phrase accepted! The Final Shape is yours.');
        navigate('/congratulations');
      } else {
        setStatus(data.error || '❌ Incorrect or expired phrase.');
      }
    } catch {
      setStatus('⚠️ Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.status}>Checking access...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>
        <p style={styles.status}>{status}</p>
        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter secret phrase..."
            style={styles.input}
            disabled={!allowed || loading}
            required
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: allowed && !loading ? 1 : 0.5,
              cursor: allowed && !loading ? 'pointer' : 'not-allowed'
            }}
            disabled={!allowed || loading}
          >
            {loading ? 'Verifying...' : 'Verify Phrase'}
          </button>
        </form>
      </div>
    </div>
  );
}

// (стили без изменений)
