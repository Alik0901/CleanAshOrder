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
  const timerRef = useRef(null);

  // отладочный кулдаун: 2 минуты = 120 секунд
  const DEBUG_COOLDOWN_SECONDS = 2 * 60;

  // считаем, сколько осталось секунд
  const computeCooldown = (last) => {
    if (!last) return 0;
    const lastTime = new Date(last).getTime();
    const elapsedSeconds = (Date.now() - lastTime) / 1000;
    return Math.max(0, DEBUG_COOLDOWN_SECONDS - Math.floor(elapsedSeconds));
  };

  // тикер кулдауна
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  // загрузка профиля
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) {
      setError('Не удалось получить Telegram ID');
      setLoading(false);
      return;
    }
    setTgId(String(id));

    fetch(`${BACKEND_URL}/api/player/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(player => {
        setFragments(player.fragments || []);
        setLastBurn(player.last_burn);
        setIsCursed(player.is_cursed);
        setCooldown(computeCooldown(player.last_burn));
      })
      .catch(() => navigate('/init'))
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
      if (!res.ok) throw new Error(data.error || data.message);
      setNewFragment(data.newFragment);
      setFragments(data.fragments);
      const nowIso = new Date().toISOString();
      setLastBurn(nowIso);
      setCooldown(computeCooldown(nowIso));
    } catch (e) {
      setError(e.message);
    } finally {
      setBurning(false);
    }
  };

  if (loading) return <div style={styles.center}>Загрузка...</div>;

  const formatTime = sec => {
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2>The Path Begins</h2>
        {newFragment && <p>🔥 You received fragment #{newFragment}!</p>}
        <p>
          {isCursed
            ? 'You are cursed and cannot burn now.'
            : cooldown > 0
            ? `Next burn in ${formatTime(cooldown)}`
            : 'Ready to burn yourself.'}
        </p>

        <button
          onClick={handleBurn}
          disabled={burning || isCursed || cooldown > 0}
          style={styles.burnButton}
        >
          {burning ? 'Processing…' : '🔥 Burn Yourself for 1 TON'}
        </button>

        <button onClick={() => navigate('/profile')} style={styles.secondary}>
          📜 View Your Ashes
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  center: { display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff' },
  container: { position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover' },
  overlay: { position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)' },
  content: { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37' },
  burnButton: { padding:'10px 24px',margin:'16px',background:'#d4af37',border:'none',cursor:'pointer' },
  secondary: { background:'transparent',border:'1px solid #d4af37',padding:'8px 20px',cursor:'pointer',color:'#d4af37' },
  error: { color:'red',marginTop:12 }
};
