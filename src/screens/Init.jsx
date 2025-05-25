import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Получение Telegram ID
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user?.id) {
      setTgId(user.id.toString());
    } else {
      console.warn('Telegram ID not found');
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
        // Перейти на следующий экран (например, /path)
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
    width: 300,
  },
  title: {
    color: '#d4af37',
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 16,
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
