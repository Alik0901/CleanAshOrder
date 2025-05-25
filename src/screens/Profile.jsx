import React from 'react';

export default function Profile() {
  const fragments = [
    '/fragments/fragment1.webp',
    '/fragments/fragment2.webp',
    '/fragments/fragment3.webp',
    '/fragments/fragment4.webp',
    '/fragments/fragment5.webp',
    '/fragments/fragment6.webp',
    '/fragments/fragment7.webp'
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        <h2 style={styles.name}>Ash Seeker</h2>
        <p style={styles.progress}>Fragments: 3 / 7</p>

        <div style={styles.grid}>
          {fragments.map((src, index) => (
            <div key={index} style={styles.fragmentWrapper}>
              <img src={src} alt={`Fragment ${index + 1}`} style={styles.fragment} />
            </div>
          ))}
        </div>

        <button style={styles.button}>🔥 Burn Again</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: 'url("/public/profile-bg.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    fontFamily: 'serif',
    color: '#d4af37',
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    borderRadius: 16,
    maxWidth: 360,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.7)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '3px solid #d4af37',
    marginBottom: 10,
    objectFit: 'cover',
  },
  name: {
    margin: 0,
    fontSize: 24,
  },
  progress: {
    margin: '8px 0 16px',
    fontSize: 14,
    opacity: 0.8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  fragmentWrapper: {
    width: '100%',
    aspectRatio: '3/4',
    border: '1px solid #d4af37',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 2,
  },
  fragment: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    borderRadius: 4,
  },
};
