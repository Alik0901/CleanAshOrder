import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Init() {
  const [name, setName] = useState('');
  const [tgId, setTgId] = useState('');
  const [debug, setDebug] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const log = (label, value) => {
      console.log(label, value);
      setDebug((prev) => [...prev, `${label}: ${JSON.stringify(value)}`]);
    };

    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const initData = wa?.initData || '';
    const unsafe = wa?.initDataUnsafe || {};

    log('window.Telegram', tg);
    log('WebApp', wa);
    log('initData', initData);
    log('initDataUnsafe', unsafe);

    if (!initData) {
      setDebug((prev) => [...prev, '⚠️ "No initData found — stopping"']);
      return;
    }

    fetch(`${API_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then((res) => res.json())
      .then((data) => {
        log('validate response', data);
        if (data.ok && data.user) {
          setTgId(data.user.id.toString());
        } else {
          setDebug((prev) => [...prev, `❌ ${data.error || 'validation failed'}`]);
        }
      })
      .catch((err) => {
        console.error('validate error', err);
        setDebug((prev) => [...prev, `❌ Network error: ${err.message}`]);
      });
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
        <p style={styles.debugText}>TG ID: {tgId || '—'}</p>
        <div style={styles.debugBox}>
          {debug.map((line, idx) => (
            <div key={idx} style={styles.debugLine}>{line}</div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading || !tgId}
          style={{
            ...styles.button,
            opacity: name.trim() && tgId ? 1 : 0.5,
            cursor: name.trim() && tgId ? 'pointer' : 'default',
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
    marginBottom: 4,
  },
  debugBox: {
    backgroundColor: '#111',
    color: '#ccc',
    padding: '10px',
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 10,
    maxHeight: 100,
    overflowY: 'auto',
    textAlign: 'left',
  },
  debugLine: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
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
