// src/screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Profile() {
  const navigate = useNavigate();
  const [tgId, setTgId] = useState('');
  const [fragments, setFragments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) Получаем Telegram ID и загружаем профиль
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) {
      navigate('/init');
      return;
    }
    setTgId(String(id));

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`);
        if (!res.ok) throw new Error();
        const player = await res.json();
        setFragments(player.fragments || []);
      } catch {
        navigate('/init');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Загрузка профиля...</p>
      </div>
    );
  }

  const ownedSet = new Set(fragments);
  const allSlots = [1, 2, 3, 4, 5, 6, 7];
  const firstRow = allSlots.slice(0, 4);
  const secondRow = allSlots.slice(4);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Your Fragments</h1>
      <p style={styles.count}>
        Collected {fragments.length} of {allSlots.length}
      </p>

      <div style={styles.row}>
        {firstRow.map((id) => {
          const owned = ownedSet.has(id);
          return (
            <div
              key={id}
              style={{
                ...styles.slot,
                backgroundColor: owned ? '#f9d342' : '#555',
                opacity: owned ? 1 : 0.3,
              }}
            >
              <span style={styles.slotText}>{id}</span>
            </div>
          );
        })}
      </div>

      <div style={{ ...styles.row, justifyContent: 'center' }}>
        {secondRow.map((id) => {
          const owned = ownedSet.has(id);
          return (
            <div
              key={id}
              style={{
                ...styles.slot,
                backgroundColor: owned ? '#f9d342' : '#555',
                opacity: owned ? 1 : 0.3,
              }}
            >
              <span style={styles.slotText}>{id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    fontFamily: 'Arial, sans-serif',
    color: '#fff',
    backgroundImage: 'url(/bg-profile.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: '40vh',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  count: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  slot: {
    width: 60,
    height: 60,
    margin: '0 8px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
};
