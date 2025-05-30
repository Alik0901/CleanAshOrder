import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// URL вашего бэкенда для запросов
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [collectedFragments, setCollectedFragments] = useState([]);
  const [selected, setSelected] = useState(null);

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
        setName(player.name);
        setCollectedFragments(player.fragments || []);
        const statsRes = await fetch(`${BACKEND_URL}/api/stats/total_users`);
        if (statsRes.ok) {
          const { value } = await statsRes.json();
          setTotalUsers(value);
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.loading}>Loading profile...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.page}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  const slugs = [
    'the_whisper',
    'the_number',
    'the_language',
    'the_mirror',
    'the_chain',
    'the_hour',
    'the_mark',
    'the_gate',
  ];
  const rows = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
  ];

  return (
    <div style={styles.page}>
      {/* User profile content */}
      <div style={styles.card}>
        <h2 style={styles.header}>{name}</h2>
        <p style={styles.subtitle}>
          Fragments: {collectedFragments.length} / 8
        </p>
        <div style={styles.grid}>
          {rows.map((row, ri) => (
            <div key={ri} style={styles.row}>
              {row.map((id) => {
                const owned = collectedFragments.includes(id);
                const src = owned
                  ? `/fragments/fragment_${id}_${slugs[id - 1]}.webp`
                  : null;
                return (
                  <div
                    key={id}
                    style={styles.slot}
                    onClick={() => owned && setSelected(id)}
                  >
                    {owned && (
                      <img
                        src={src}
                        alt={`Fragment ${id}`}
                        style={styles.fragmentImage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p style={styles.counter}>
          <em>Ash Seekers: {totalUsers.toLocaleString()}</em>
        </p>
        <button style={styles.burnButton} onClick={() => navigate('/path')}>
          🔥 Burn Again
        </button>
        {/* New final phrase button displayed only when all fragments collected */}
        {collectedFragments.length === 8 && (
          <button
            style={styles.finalButton}
            onClick={() => navigate('/final')}
          >
            🗝 Enter Final Phrase
          </button>
        )}
      </div>
      {/* Modal for enlarged fragment */}
      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <img
            src={`/fragments/fragment_${selected}_${slugs[selected - 1]}.webp`}
            alt="Enlarged fragment"
            style={styles.modalImage}
          />
        </div>
      )}
    </div>
  );
}

// Add finalButton styles in styles object
Object.assign(styles, {
  finalButton: {
    marginTop: 12,
    padding: '10px 24px',
    fontSize: 16,
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  }
});

    // Запросим данные игрока
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${userId}`);
        if (!res.ok) throw new Error();
        const player = await res.json();
        setName(player.name);
        setCollectedFragments(player.fragments || []);

        // Запросим глобальную статистику
        const statsRes = await fetch(`${BACKEND_URL}/api/stats/total_users`);
        if (statsRes.ok) {
          const { value } = await statsRes.json();
          setTotalUsers(value);
        }
      } catch {
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.loading}>Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  // Настройка всех фрагментов 1–7
  const fragmentImages = {
    1: '/frag1.webp', 2: '/frag2.webp', 3: '/frag3.webp',
    4: '/frag4.webp', 5: '/frag5.webp', 6: '/frag6.webp', 7: '/frag7.webp',
  };
  const allSlots = [1,2,3,4,5,6,7];
  const firstRow = allSlots.slice(0,4);
  const secondRow = allSlots.slice(4);
  const ownedSet = new Set(collectedFragments);

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        {/* Аватар и имя игрока */}
        <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        <h2 style={styles.title}>{name}</h2>
        <p style={styles.subtitle}>
          Fragments: {collectedFragments.length} / 7
        </p>

        {/* Сетка фрагментов */}
        <div style={styles.fragmentsWrapper}>
          <div style={styles.gridTop}>
            {firstRow.map(id => (
              <div key={id} style={styles.fragment}>
                {ownedSet.has(id) ? (
                  <img
                    src={fragmentImages[id]}
                    alt={`Fragment ${id}`}
                    style={styles.fragmentImage}
                  />
                ) : (
                  <div style={styles.placeholder} />
                )}
              </div>
            ))}
          </div>
          <div style={styles.gridBottomWrapper}>
            <div style={styles.gridBottom}>
              {secondRow.map(id => (
                <div key={id} style={styles.fragment}>
                  {ownedSet.has(id) ? (
                    <img
                      src={fragmentImages[id]}
                      alt={`Fragment ${id}`}
                      style={styles.fragmentImage}
                    />
                  ) : (
                    <div style={styles.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Счётчик всех пользователей */}
        <p style={styles.counter}>
          <em>Ash Seekers: {totalUsers.toLocaleString()}</em>
        </p>
        {/* Кнопка для «Burn Again» */}
        <button
          style={styles.burnButton}
          onClick={() => navigate('/path')}
        >
          🔥 Burn Again
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    backgroundImage: 'url("/bg-profile.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'serif',
    color: '#d4af37',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  card: {
    position: 'relative', zIndex: 2,
    maxWidth: 360, width: '100%', padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12,
    textAlign: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    marginBottom: 10, border: '2px solid #d4af37',
  },
  title: { fontSize: 24, margin: '10px 0 4px' },
  subtitle: { fontSize: 14, marginBottom: 20, opacity: 0.85 },
  fragmentsWrapper: { display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 16 },
  gridTop: { display: 'grid', gridTemplateColumns: 'repeat(4, 60px)', gap: 6 },
  gridBottomWrapper: { display: 'flex', justifyContent: 'center', width: '100%' },
  gridBottom: { display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: 6 },
  fragment: { width: 60, height: 60, backgroundColor: '#111', border: '1px solid #d4af37', borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  fragmentImage: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
  counter: { fontSize: 14, color: '#ccc', marginBottom: 16, fontStyle: 'italic' },
  burnButton: { backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '10px 20px', fontSize: 14, cursor: 'pointer', borderRadius: 4 }
};
