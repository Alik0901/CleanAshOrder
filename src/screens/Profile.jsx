import React from 'react';

export default function Profile() {
  const fragments = [1, 2, 3, 4, 5, 6, 7]; // Заглушка

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        <h2 style={styles.title}>Ash Seeker</h2>
        <p style={styles.subtitle}>Fragments: {fragments.length} / 7</p>

        <div style={styles.fragmentsGrid}>
          <div style={styles.row}>
            {fragments.slice(0, 4).map((id) => (
              <div key={id} style={styles.fragmentBox}>
                <img src={`/fragments/fragment${id}.webp`} alt={`Fragment ${id}`} style={styles.image} />
              </div>
            ))}
          </div>
          <div style={styles.rowCenter}>
            {fragments.slice(4, 7).map((id) => (
              <div key={id} style={styles.fragmentBox}>
                <img src={`/fragments/fragment${id}.webp`} alt={`Fragment ${id}`} style={styles.image} />
              </div>
            ))}
          </div>
        </div>

        <button style={styles.burnButton}>🔥 Burn Again</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundImage: 'url("/ledger_bg.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
    fontFamily: 'serif',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    color: '#d4af37',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    boxSizing: 'border-box',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 10,
    border: '2px solid #d4af37',
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  fragmentsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  row: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
  },
  rowCenter: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
  },
  fragmentBox: {
    width: 70,
    height: 100,
    border: '1px solid #d4af37',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  burnButton: {
    marginTop: 'auto',
    padding: '10px 20px',
    backgroundColor: '#d4af37',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    color: '#000',
  },
};
