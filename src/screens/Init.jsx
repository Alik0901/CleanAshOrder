// src/screens/Init.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const NAME_REGEX = /^[A-Za-z ]+$/;

export default function Init() {
  const navigate = useNavigate();

  // Telegram/WebApp data
  const [tgId, setTgId] = useState('');
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState({});
  const [status, setStatus] = useState('Checking Telegram...');
  const [checking, setChecking] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const validName = name.trim().length > 0 && NAME_REGEX.test(name);

  // 1) Read Telegram initData once
  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const raw = wa?.initData || '';
    const unsafe = wa?.initDataUnsafe || {};

    setInitDataRaw(raw);
    setInitDataUnsafe(unsafe);

    if (!tg) {
      setStatus('❌ Telegram not found');
      return;
    }
    if (!wa) {
      setStatus('❌ Telegram.WebApp not found');
      return;
    }
    if (!raw) {
      setStatus('❌ initData missing');
      return;
    }
    if (!unsafe.user?.id) {
      setStatus('❌ User ID not found');
      return;
    }

    setTgId(String(unsafe.user.id));
    setStatus('Checking existing user...');
  }, []);

  // 2) Check in database — once tgId is set
  useEffect(() => {
    if (!tgId) return;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${tgId}`);
        if (res.ok) {
          navigate('/profile');
          return;
        }
      } catch {
        // network error, treat as new
      }
      setStatus('✅ Ready to register');
      setChecking(false);
    })();
  }, [tgId, navigate]);

  // 3) Handle form submit
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validName) {
      setStatus('❗ Name must be English letters and spaces only');
      return;
    }
    setStatus('⏳ Submitting...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: tgId,
          name: name.trim(),
          initData: initDataRaw,
          initDataUnsafe
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`⚠️ ${data.error || 'Unknown error'}`);
      } else {
        navigate('/path');
      }
    } catch {
      setStatus('⚠️ Network error');
    }
  };

  // 4) While checking, show status
  if (checking) {
    return (
      <div style={styles.container}>
        <p style={styles.status}>{status}</p>
      </div>
    );
  }

  // 5) Registration form
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Enter the Ash</h1>
        <p style={styles.info}>
          Your Telegram ID: <strong>{tgId}</strong>
        </p>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (A–Z only)"
          style={styles.input}
        />

        <button
          type="submit"
          disabled={!validName}
          style={{ ...styles.button, opacity: validName ? 1 : 0.5 }}
        >
          Save and Continue
        </button>

        {status && <p style={styles.status}>{status}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundImage: 'url("/bg-init.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif',
    color: '#f9d342',
  },
  form: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: { margin: 0, fontSize: 24, textAlign: 'center' },
  info: { fontSize: 14, textAlign: 'center', margin: '4px 0 12px' },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #555',
    backgroundColor: '#222',
    color: '#fff',
  },
  button: {
    padding: 12,
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#f9d342',
    color: '#000',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  status: { marginTop: 12, fontSize: 14, textAlign: 'center' },
};
