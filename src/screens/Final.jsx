// src/screens/Final.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || 'https://ash-backend-production.up.railway.app';

// Предопределённые части финальной фразы (кроме имени)
const PHRASE_PARTS = [
  'the key is time',
  'thirteen',
  'ashen',
  'mirror',
  'broken chain',
  'hour',
  'mark',
  'gate',
];

export default function Final() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [createdMinute, setCreatedMinute] = useState(null);
  const [expectedPhrase, setExpectedPhrase] = useState('');
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
        const res = await fetch(`${BACKEND_URL}/api/player/${userId}`);
        if (!res.ok) throw new Error();
        const player = await res.json();

        // minute UTC создания профиля
        const createdAt = new Date(player.created_at);
        setCreatedMinute(createdAt.getUTCMinutes());

        // склеиваем предопределённые части + имя пользователя
        const phrase = [...PHRASE_PARTS, player.name]
          .join(' ')
          .toLowerCase();
        setExpectedPhrase(phrase);

        setStatus('⏳ Awaiting the appointed minute…');
      } catch {
        setStatus('⚠️ Could not load your data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleVerify = () => {
    const now = new Date();
    if (now.getUTCMinutes() !== createdMinute) {
      setStatus(
        `❌ Not the moment yet. Come back at minute ${String(createdMinute).padStart(2, '0')} UTC.`
      );
      return;
    }

    if (input.trim().toLowerCase() === expectedPhrase) {
      setSuccess(true);
      setStatus('✅ Correct. The Final Shape is yours.');
    } else {
      setStatus('❌ That’s not it. Try again.');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>

        {loading ? (
          <p style={styles.msg}>{status}</p>
        ) : success ? (
          <p style={styles.success}>{status}</p>
        ) : (
          <>
            <p style={styles.msg}>Enter the secret phrase assembled from your fragments.</p>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type the phrase..."
              style={styles.input}
            />
            <button onClick={handleVerify} style={styles.button}>
              Verify Phrase
            </button>
            <p style={styles.msg}>{status}</p>
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
  msg: {
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
    cursor: 'pointer',
  },
};
