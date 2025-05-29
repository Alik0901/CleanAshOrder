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

  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const userId = unsafe.user?.id;
    if (!userId) {
      navigate('/init');
      return;
    }

    (async () => {
      try {
        // load player
        const res = await fetch(`${BACKEND_URL}/api/player/${userId}`);
        if (!res.ok) throw new Error();
        const player = await res.json();
        setName(player.name);
        setCollectedFragments(player.fragments || []);

        // load global stats
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

  // slugs for each fragment image file name
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
  // layout in two rows of four
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
                  <div key={id} style={styles.slot}>
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
      </div>
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
  },
  loading: { fontSize: 18, color: '#fff' },
  error: { fontSize: 16, color: '#f00' },
  card: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 360,
    width: '100%',
    padding: 20,
    backgroundColor: 'transparent',
    border: '1px solid #d4af37',
    borderRadius: 12,
    textAlign: 'center',
  },
  header: { fontSize: 24, margin: '0 0 8px' },
  subtitle: { fontSize: 14, marginBottom: 16, opacity: 0.85 },
  grid: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', justifyContent: 'center', gap: 8 },
  slot: {
    width: 60,
    height: 60,
    backgroundColor: '#111',
    border: '1px solid #d4af37',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fragmentImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  counter: { fontSize: 14, color: '#ccc', marginTop: 16 },
  burnButton: {
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 4,
  },
};
