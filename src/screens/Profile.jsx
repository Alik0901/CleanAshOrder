// src/screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/init');
      return;
    }

    (async () => {
      setLoading(true);
      setError('');
      try {
        // 1) GET /api/player/:tg_id
        const playerRes = await fetch(`${BACKEND_URL}/api/player/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!playerRes.ok) throw new Error();
        const player = await playerRes.json();
        setName(player.name);
        setCollectedFragments(player.fragments || []);

        // 2) GET /api/stats/total_users
        const statsRes = await fetch(`${BACKEND_URL}/api/stats/total_users`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (statsRes.ok) {
          const { value } = await statsRes.json();
          setTotalUsers(value);
        } else {
          setTotalUsers(0);
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();

    // Refresh profile when window gains focus
    const handleFocus = () => {
      setLoading(true);
      setError('');
      // re-run the same load logic
      (async () => {
        try {
          const playerRes = await fetch(`${BACKEND_URL}/api/player/${userId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (playerRes.ok) {
            const player = await playerRes.json();
            setName(player.name);
            setCollectedFragments(player.fragments || []);
          }
          const statsRes = await fetch(`${BACKEND_URL}/api/stats/total_users`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (statsRes.ok) {
            const { value } = await statsRes.json();
            setTotalUsers(value);
          }
        } catch {
          setError('Failed to refresh data');
        } finally {
          setLoading(false);
        }
      })();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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

        {collectedFragments.length === 8 && (
          <button
            style={styles.finalButton}
            onClick={() => navigate('/final')}
          >
            🗝 Enter Final Phrase
          </button>
        )}
      </div>

      {selected !== null && (
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

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    backgroundImage: 'url("/profile-bg.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'serif',
    color: '#d4af37',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
  },
  loading: { fontSize: 18, color: '#fff' },
  error: { fontSize: 16, color: '#f00' },
  card: {
    width: '100%',
    maxWidth: '95vw',
    padding: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  header: { fontSize: 24, margin: '0 0 8px' },
  subtitle: { fontSize: 14, marginBottom: 16, opacity: 0.85 },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 4,
  },
  slot: {
    flex: '1 1 0',
    aspectRatio: '1 / 1',
    maxWidth: '22%',
    backgroundColor: '#111',
    border: '1px solid #d4af37',
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  fragmentImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  counter: { fontSize: 14, color: '#ccc', marginBottom: 16 },
  burnButton: {
    display: 'block',
    width: '100%',
    marginTop: 8,
    padding: '10px',
    fontSize: 14,
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  finalButton: {
    display: 'block',
    width: '100%',
    marginTop: 8,
    padding: '10px',
    fontSize: 16,
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  },
  modalImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
  },
};
