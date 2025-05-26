// src/screens/Init.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const unsafe = tg?.initDataUnsafe;
    const user = unsafe?.user;

    const extractedId = user?.id?.toString();
    if (extractedId) {
      setTgId(extractedId);
    }

    setDebug({
      Telegram: !!window.Telegram,
      WebApp: !!tg,
      userId: extractedId || 'NOT FOUND',
      initData: tg?.initData || 'n/a',
      initDataUnsafe: unsafe || 'n/a',
    });

    console.log('Telegram:', window.Telegram);
    console.log('WebApp:', tg);
    console.log('initData:', tg?.initData);
    console.log('initDataUnsafe:', unsafe);
  }, []);

  const handleSubmit = async () => {
    if (!tgId || !name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId, name: name.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/path');
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <h1 style={styles.title}>Enter the Ash</h1>
        <p style={styles.debugText}>Telegram ID: {debug.userId}</p>
        <p style={styles.debugText}>WebApp: {debug.WebApp ? 'FOUND' : 'NOT FOUND'}</p>
        <p style={styles.debugText}>InitData: {debug.initData}</p>
        <p style={styles.debugText}>
          InitDataUnsafe:{' '}
          {typeof debug.initDataUnsafe === 'object'
            ? JSON.stringify(debug.initDataUnsafe)
            : debug.initDataUnsafe}
        </p>

        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          style={{
            ...styles.button,
            opacity: name.trim() ? 1 : 0.5,
            cursor: name.trim() ? 'pointer' : 'default',
          }}
        >
          {loading ? 'Entering...' : 'Enter the Ash'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    height: '100dvh',
    backgroundImage: 'url("/bg-init.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    textAlign: 'center',
    width: 320,
    color: '#d4af37',
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    margin: '16px 0',
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '10px',
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#d4af37',
    color: '#000',
  },
};
