// src/screens/Final.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || 'https://ash-backend-production.up.railway.app';

export default function Final() {
  const navigate = useNavigate();
  const [input, setInput]       = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    if (!userId) {
      setStatus('⚠️ Не могу определить пользователя. Пожалуйста, перезапустите WebApp.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/validate-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inputPhrase: input.trim()
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus('✅ Фраза принята! The Final Shape is yours.');
        // Перейти на экран поздравления
        navigate('/congratulations');
      } else {
        setStatus(data.error || '❌ Неверная или просроченная фраза.');
      }
    } catch (err) {
      console.error(err);
      setStatus('⚠️ Сетевая ошибка.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>
        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter secret phrase..."
            style={styles.input}
            disabled={loading}
            required
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Phrase'}
          </button>
        </form>
        {status && <p style={styles.status}>{status}</p>}
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
    width: '100%',
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: '#d4af37',
  },
};
