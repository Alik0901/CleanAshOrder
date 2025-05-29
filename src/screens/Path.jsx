// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Path() {
  const navigate = useNavigate();
  const [tgId, setTgId] = useState('');
  const [fragments, setFragments] = useState([]);
  const [lastBurn, setLastBurn] = useState(null);
  const [isCursed, setIsCursed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [burning, setBurning] = useState(false);
  const [error, setError] = useState('');
  const [newFragment, setNewFragment] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef();

  // Compute cooldown in seconds
  const computeCooldown = (last) => {
    if (!last) return 0;
    const elapsed = (Date.now() - new Date(last).getTime())/1000;
    return Math.max(0, 24*3600 - Math.floor(elapsed));
  };

  // Tick countdown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  // On mount, load Telegram ID and player data
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) {
      setError('Не удалось получить ваш Telegram ID');
      setLoading(false);
      return;
    }
    setTgId(String(id));

    // fetch player record
    fetch(`${BACKEND_URL}/api/player/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Player not found');
        return res.json();
      })
      .then((player) => {
        setFragments(player.fragments || []);
        setLastBurn(player.last_burn);
        setIsCursed(player.is_cursed);
        setCooldown(computeCooldown(player.last_burn));
      })
      .catch(() => {
        // if no player, redirect to init
        navigate('/init');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleBurn = async () => {
    setBurning(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Ошибка сжигания');
      }
      // update state
      setNewFragment(data.newFragment);
      setFragments(data.fragments);
      setLastBurn(new Date().toISOString());
      setCooldown(computeCooldown(new Date().toISOString()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBurning(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay} />
        <div style={styles.content}>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Helper: format seconds to hh:mm:ss
  const formatTime = (sec) => {
    const h = String(Math.floor(sec/3600)).padStart(2,'0');
    const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>
        {newFragment && (
          <p style={styles.notification}>
            🔥 You burned and received fragment #{newFragment}!
          </p>
        )}
        <p style={styles.subtitle}>
          {isCursed
            ? 'You are cursed and cannot burn right now.'
            : cooldown > 0
            ? `Next burn available in ${formatTime(cooldown)}`
            : 'You may burn yourself again.'}
        </p>

        <button
          style={styles.button}
          onClick={handleBurn}
          disabled={burning || isCursed || cooldown > 0}
        >
          {burning ? 'Processing…' : '🔥 Burn Yourself for 1 TON'}
        </button>

        <button
          style={styles.secondary}
          onClick={() => navigate('/profile')}
        >
          📜 View Your Ashes
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    backgroundImage: 'url("/bg-path.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'serif',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    width: '100%',
    color: '#d4af37',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '26px',
    marginBottom: 10,
  },
  notification: {
    fontSize: '18px',
    margin: '10px 0',
    color: '#f9d342',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.85,
    marginBottom: 20,
  },
  button: {
    padding: '10px 24px',
    background: '#d4af37',
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: 16,
    opacity: 1,
  },
  secondary: {
    padding: '8px 20px',
    background: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
    fontSize: '14px',
    cursor: 'pointer',
  },
  error: {
    marginTop: 12,
    color: '#f00',
    fontSize: '14px',
  },
};
