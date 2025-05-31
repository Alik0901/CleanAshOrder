// src/screens/Final.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Final() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    if (!userId) {
      navigate('/init');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/init');
      return;
    }

    fetch(`${BACKEND_URL}/api/final/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
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

    const unsafe = window.Telegram.WebApp.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BACKEND_URL}/api/validate-final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        <p style={styles.checking}>Checking access...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>
        <p style={styles.status}>{status}</p>
        <form onSubmit={handleVerify} style={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
              cursor: allowed && !loading ? 'pointer' : 'not-allowed',
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

const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: 'url("/bg-final.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: 20,
    display: 'flex',               // делаем flex контейнер
    flexDirection: 'column',
    justifyContent: 'center',      // выравниваем по вертикали
    alignItems: 'center',          // выравниваем по горизонтали
    fontFamily: 'serif',
    color: '#d4af37',
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    display: 'flex',               // flex-контейнер внутри
    flexDirection: 'column',
    justifyContent: 'center',      // выровнять содержимое по вертикали
    alignItems: 'center',          // выровнять по горизонтали
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  checking: {
    fontSize: 16,
    color: '#d4af37',
    textAlign: 'center',
  },
  status: {
    marginBottom: 12,
    fontSize: 14,
    color: '#d4af37',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    width: '100%',
    padding: 10,
    fontSize: 16,
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
    width: '100%',
  },
};
