import React from 'react';

export default function Profile() {
  const avatarUrl = '/avatar.webp'; // временное изображение аватара
  const fragmentImages = [
    '/frag1.webp',
    '/frag2.webp',
    '/frag3.webp',
    '/frag4.webp',
    '/frag5.webp',
    '/frag6.webp',
    '/frag7.webp',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.card}>
        <img src={avatarUrl} alt="Avatar" style={styles.avatar} />
        <h2 style={styles.title}>Ash Seeker</h2>
        <p style={styles.subtitle}>Fragments: 3 / 7</p>

        <div style={styles.gridTop}>
          {fragmentImages.slice(0, 4).map((src, i) => (
            <div key={i} style={styles.fragment}>
              <img src={src} alt={`Fragment ${i + 1}`} style={styles.fragmentImage} />
            </div>
          ))}
        </div>

        <div style={styles.gridBottom}>
          {fragmentImages.slice(4, 7).map((src, i) => (
            <div key={i + 4} style={styles.fragment}>
              <img src={src} alt={`Fragment ${i + 5}`} style={styles.fragmentImage} />
            </div>
          ))}
        </div>

        <p style={styles.counter}>Ash Seekers: 134587</p>
        <button style={styles.burnButton}>🔥 Burn Again</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    backgroundImage: 'url("/bg-profile.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: 'serif',
    color: '#d4af37',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 360,
    margin: '0 auto',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    textAlign: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    marginBottom: 10,
    border: '2px solid #d4af37',
  },
  title: {
    fontSize: 24,
    margin: '10px 0 4px',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.85,
  },
  gridTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    marginBottom: 8,
  },
  gridBottom: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  fragment: {
    width: 60,
    height: 60,
    backgroundColor: '#111',
    border: '1px solid #d4af37',
    borderRadius: 4,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fragmentImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  counter: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
    fontStyle: 'italic',
  },
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
