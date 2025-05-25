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
      <div style={styles.header}>
        <img src="/avatar.webp" alt="Avatar" style={styles.avatar} />
        <h1 style={styles.name}>Ash Seeker</h1>
        <p style={styles.title}>Fragments</p>
      </div>

      <div style={styles.grid}>
        {fragments.map((src, index) => (
          <div key={index} style={styles.fragmentWrapper}>
            <img src={src} alt={`Fragment ${index + 1}`} style={styles.fragment} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: 'url("/profile-bg.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '40px 20px',
    fontFamily: 'serif',
    color: '#d4af37',
    textAlign: 'center',
  },
  header: {
    marginBottom: '40px',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #d4af37',
    marginBottom: 16,
  },
  name: {
    fontSize: '28px',
    margin: 0,
  },
  title: {
    fontSize: '20px',
    marginTop: 4,
    marginBottom: 16,
    opacity: 0.8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    justifyItems: 'center',
    maxWidth: 360,
    margin: '0 auto',
  },
  fragmentWrapper: {
    width: 100,
    height: 140,
    border: '1px solid #d4af37',
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fragment: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
};
