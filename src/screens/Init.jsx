import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [webAppStatus, setWebAppStatus] = useState('UNKNOWN');
  const [initData, setInitData] = useState('n/a');
  const [initDataUnsafe, setInitDataUnsafe] = useState('n/a');

  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      setWebAppStatus('FOUND');
      setInitData(tg.initData || 'empty');
      setInitDataUnsafe(JSON.stringify(tg.initDataUnsafe || 'empty'));

      if (tg.initDataUnsafe?.user?.id) {
        setTgId(tg.initDataUnsafe.user.id.toString());
      } else {
        setTgId('NOT FOUND');
      }
    } else {
      setWebAppStatus('NOT FOUND');
      setTgId('NOT FOUND');
    }
  }, []);

  const handleSubmit = async () => {
    if (!tgId || !name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/init', {
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
        <p style={styles.debug}>Telegram ID: {tgId}</p>
        <p style={styles.debug}>WebApp: {webAppStatus}</p>
        <p style={styles.debug}>InitData: {initData}</p>
        <p style={styles.debug}>InitDataUnsafe: {initDataUnsafe}</p>

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
    marginBottom: 12,
  },
  debug: {
    fontSize: 12,
    color: '#aaa',
    margin: '2px 0',
    wordBreak: 'break-word',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    margin: '12px 0',
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
