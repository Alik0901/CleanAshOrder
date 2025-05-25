// src/screens/Profile.jsx
import React from 'react';

export default function Profile() {
  const fragmentCount = 3;
  const totalFragments = 7;
  const fragments = new Array(totalFragments).fill(null).map((_, i) => ({
    id: i + 1,
    name: `Fragment ${i + 1}`,
    image: `/fragments/fragment${i + 1}.webp`, // путь к изображениям
  }));

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.avatarWrapper}>
          <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        </div>
        <h2 style={styles.name}>Ash Seeker</h2>
        <p style={styles.subtext}>Fragments: {fragmentCount} / {totalFragments}</p>

        <div style={styles.fragmentGrid}>
          {fragments.map((frag, index) => (
            <div key={frag.id} style={styles.fragmentBox}>
              <img
                src={frag.image}
                alt={frag.name}
                style={styles.fragmentImage}
                onError={(e) => (e.target.style.opacity = 0.1)}
              />
              <span style={styles.fragmentLabel}>{frag.name}</span>
            </div>
          ))}
        </div>

        <button style={styles.burnButton}>🔥 Burn Again</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#111',
    color: '#d4af37',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'serif',
    padding: 20,
  },
  card: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
    textAlign: 'center',
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #d4af37',
  },
  name: {
    fontSize: 24,
    margin: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  fragmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(2, auto)',
    gap: 8,
    justifyItems: 'center',
    marginBottom: 20,
  },
  fragmentBox: {
    width: 70,
    height: 90,
    backgroundColor: '#111',
    border: '1px solid #d4af37',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  fragmentImage: {
    width: '100%',
    height: '75%',
    objectFit: 'cover',
    display: 'block',
  },
  fragmentLabel: {
    fontSize: 10,
    position: 'absolute',
    bottom: 4,
    width: '100%',
    textAlign: 'center',
    color: '#d4af37',
  },
  burnButton: {
    backgroundColor: '#d4af37',
    color: '#000',
    padding: '10px 24px',
    fontSize: 14,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
