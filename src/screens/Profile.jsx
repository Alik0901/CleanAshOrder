import { useState } from 'react';

export default function Profile() {
  const name = 'Ash Seeker';
  const totalUsers = 134587;

  // Пример: 3 полученных фрагмента
  const collectedFragments = [1, 2, 3]; // можно менять для теста

  const fragmentImages = {
    1: '/frag1.webp',
    2: '/frag2.webp',
    3: '/frag3.webp',
    4: '/frag4.webp',
    5: '/frag5.webp',
    6: '/frag6.webp',
    7: '/frag7.webp',
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        <h2 style={styles.title}>{name}</h2>
        <p style={styles.subtitle}>Fragments: {collectedFragments.length} / 7</p>

        <div style={styles.fragmentsWrapper}>
          <div style={styles.gridTop}>
            {[1, 2, 3, 4].map((id) => (
              <div key={id} style={styles.fragment}>
                {collectedFragments.includes(id) ? (
                  <img src={fragmentImages[id]} alt={`Fragment ${id}`} style={styles.fragmentImage} />
                ) : (
                  <div style={styles.placeholder} />
                )}
              </div>
            ))}
          </div>

          <div style={styles.gridBottomWrapper}>
            <div style={styles.gridBottom}>
              {[5, 6, 7].map((id) => (
                <div key={id} style={styles.fragment}>
                  {collectedFragments.includes(id) ? (
                    <img src={fragmentImages[id]} alt={`Fragment ${id}`} style={styles.fragmentImage} />
                  ) : (
                    <div style={styles.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={styles.counter}><em>Ash Seekers: {totalUsers.toLocaleString()}</em></p>
        <button style={styles.burnButton}>🔥 Burn Again</button>
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
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 360,
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
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
  fragmentsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  gridTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 60px)',
    gap: 6,
  },
  gridBottomWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  gridBottom: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 60px)',
    gap: 6,
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
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
