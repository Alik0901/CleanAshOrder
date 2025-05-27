import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Init() {
  const [name, setName] = useState('');
  const [tgId, setTgId] = useState('');
  const [debugLines, setDebugLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const log = (label, value) => {
    setDebugLines(prev => [...prev, `${label}: ${JSON.stringify(value)}`]);
    console.log(label, value);
  };

  useEffect(() => {
    const tg = window.Telegram;
    log('window.Telegram', tg);

    const wa = tg?.WebApp;
    log('WebApp', wa);

    const initData = wa?.initData || '';
    log('initData', initData);

    const initDataUnsafe = wa?.initDataUnsafe || {};
    log('initDataUnsafe', initDataUnsafe);

    if (!initData) {
      log('⚠️', 'No initData found — stopping');
      return;
    }

    fetch(`${API_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then(res => res.json())
      .then(data => {
        log('validate response', data);
        if (data.ok && data.user) {
          setTgId(data.user.id.toString());
          log('✅ Validated user', data.user.username || data.user.id);
        } else {
          log('❌ Validate error', data.error);
        }
      })
      .catch(err => {
        log('❌ Network/validate error', err.message);
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
        log('❌ Init error', data.error);
      }
    } catch (err) {
      log('❌ Network/init error', err.message);
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
          {debugLines.map((line, i) => (
            <div key={i} style={styles.debugLine}>{line}</div>
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
    fontSize: 10,
    color: '#aaa',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    margin: '10px 0',
    borderRadius: 6,
    maxHeight: 150,
    overflowY: 'auto',
    textAlign: 'left',
  },
  debugLine: {
    marginBottom: 4,
    wordBreak: 'break-all',
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
