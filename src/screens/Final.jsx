// src/screens/Final.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || 'https://ash-backend-production.up.railway.app';

export default function Final() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    if (!userId) {
      navigate('/init');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/final/${userId}`);
        if (!res.ok) throw new Error();
        const { canEnter } = await res.json();
        setAllowed(canEnter);
        setStatus(
          canEnter
            ? '🗝 You may now enter your final phrase.'
            : '🕓 Not the time yet.'
        );
      } catch (err) {
        console.error(err);
        setStatus('⚠️ Error checking permission.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleVerify = async () => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    setStatus('⏳ Verifying...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: userId, phrase: input.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setSuccess(true);
        setStatus('✅ Phrase accepted. The Final Shape is yours.');
      } else {
        setStatus(data.error || '❌ Incorrect phrase or not allowed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('⚠️ Network error.');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.message}>Checking access...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>

        {success ? (
          <p style={styles.success}>{status}</p>
        ) : (
          <>
            <p style={styles.message}>{status}</p>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter secret phrase..."
              style={styles.input}
              disabled={!allowed}
            />
            <button
              onClick={handleVerify}
              style={{
                ...styles.button,
                opacity: allowed ? 1 : 0.5,
                cursor: allowed ? 'pointer' : 'not-allowed'
              }}
              disabled={!allowed}
            >
              Verify Phrase
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: 'url("/bg-final.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'serif',
    color: '#d4af37',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    margin: '12px 0',
  },
  success: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7CFC00',
  },
  input: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    borderRadius: 6,
    border: '1px solid #d4af37',
    backgroundColor: '#111',
    color: '#fff',
  },
  button: {
    padding: '10px 24px',
    fontSize: 16,
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    borderRadius: 6,
  },
};
