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
  const [curseExpires, setCurseExpires] = useState(null);
  const [loading, setLoading] = useState(true);
  const [burning, setBurning] = useState(false);
  const [error, setError] = useState('');
  const [newFragment, setNewFragment] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const COOLDOWN_SECONDS = 2 * 60;

  // Рассчитываем оставшийся кулдаун (2 минуты)
  const computeCooldown = (last) => {
    if (!last) return 0;
    const lastTime = new Date(last).getTime();
    const elapsed = (Date.now() - lastTime) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  };

  // Тикер для кулдауна в реальном времени
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

  // Загрузка профиля при монтировании
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) {
      navigate('/init');
      return;
    }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/init');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        // Обновляем токен, если сервер вернул новый
        const newAuth = res.headers.get('Authorization');
        if (newAuth?.startsWith('Bearer ')) {
          localStorage.setItem('token', newAuth.split(' ')[1]);
        }
        if (!res.ok) throw new Error();

        const player = await res.json();
        setFragments(player.fragments || []);
        setLastBurn(player.last_burn);

        // Проверяем проклятие
        if (player.curse_expires) {
          const expireDate = new Date(player.curse_expires);
          if (expireDate > new Date()) {
            setIsCursed(true);
            setCurseExpires(player.curse_expires);
          } else {
            setIsCursed(false);
            setCurseExpires(null);
          }
        }

        // Если не под проклятием, рассчитываем кулдаун
        if (!player.curse_expires) {
          setCooldown(computeCooldown(player.last_burn));
        }
      } catch {
        navigate('/init');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [navigate]);

  // Обработка клика «Burn Yourself»
  const handleBurn = async () => {
    setBurning(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BACKEND_URL}/api/burn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tg_id: tgId }),
      });

      // Обновляем токен, если сервер вернул новый
      const newAuth = res.headers.get('Authorization');
      if (newAuth?.startsWith('Bearer ')) {
        localStorage.setItem('token', newAuth.split(' ')[1]);
      }

      const data = await res.json();

      if (!res.ok) {
        // Если сервер вернул ошибку или сообщение «вы под проклятием»
        if (data.error && data.curse_expires) {
          const expireDate = new Date(data.curse_expires);
          setError(`⚠️ You are cursed until ${expireDate.toLocaleString()}`);
          setIsCursed(true);
          setCurseExpires(data.curse_expires);
        } else {
          setError(data.error || '⚠️ Unknown error');
        }
        setBurning(false);
        return;
      }

      // res.ok === true
      if (data.cursed) {
        // Игрок только что проклят на 24 часа
        const expireDate = new Date(data.curse_expires);
        setError(`⚠️ You have been cursed until ${expireDate.toLocaleString()}`);
        setIsCursed(true);
        setCurseExpires(data.curse_expires);
      } else {
        // Игрок получил новый фрагмент
        setNewFragment(data.newFragment);
        setFragments(data.fragments);
        setIsCursed(false);
        setCurseExpires(null);
        // Обновляем lastBurn и запускаем двухминутный кулдаун
        const nowIso = new Date().toISOString();
        setLastBurn(nowIso);
        setCooldown(computeCooldown(nowIso));
      }
    } catch (e) {
      setError(`⚠️ ${e.message}`);
    } finally {
      setBurning(false);
    }
  };

  if (loading) {
    return <div style={styles.center}>Loading...</div>;
  }

  // Преобразуем секунды в формат MM:SS
  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {/* Сообщение о новом фрагменте */}
        {newFragment && (
          <p style={styles.message}>
            🔥 You received fragment #{newFragment}!
          </p>
        )}

        {/* Статус: проклят, кулдаун или готов к сжиганию */}
        {isCursed ? (
          <p style={styles.status}>
            ⚠️ You are cursed until{' '}
            {new Date(curseExpires).toLocaleString()}
          </p>
        ) : cooldown > 0 ? (
          <p style={styles.status}>
            ⏳ Next burn in {formatTime(cooldown)}
          </p>
        ) : (
          <p style={styles.status}>Ready to burn yourself.</p>
        )}

        {/* Кнопка Burn */}
        <button
          onClick={handleBurn}
          disabled={
            burning ||
            (isCursed && new Date(curseExpires) > new Date()) ||
            cooldown > 0
          }
          style={{
            ...styles.burnButton,
            opacity:
              burning ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 0.6
                : 1,
            cursor:
              burning ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {burning ? 'Processing…' : '🔥 Burn Yourself for 1 TON'}
        </button>

        {/* Кнопка просмотра профиля */}
        <button onClick={() => navigate('/profile')} style={styles.secondary}>
          📜 View Your Ashes
        </button>

        {/* Ошибки и предупреждения */}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  center: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 18,
  },
  container: {
    position: 'relative',
    height: '100vh',
    backgroundImage: 'url("/bg-path.webp")',
    backgroundSize: 'cover',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#d4af37',
    padding: '0 16px',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#7CFC00',
    marginBottom: 12,
  },
  status: {
    fontSize: 16,
    marginBottom: 12,
  },
  burnButton: {
    padding: '10px 24px',
    backgroundColor: '#d4af37',
    border: 'none',
    borderRadius: 6,
    color: '#000',
    fontSize: 16,
    marginBottom: 12,
  },
  secondary: {
    background: 'transparent',
    border: '1px solid #d4af37',
    padding: '8px 20px',
    cursor: 'pointer',
    color: '#d4af37',
    fontSize: 14,
    marginBottom: 12,
  },
  error: {
    color: '#FF6347',
    fontSize: 14,
    marginTop: 12,
  },
};
