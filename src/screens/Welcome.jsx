// src/screens/Welcome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const [showScroll, setShowScroll] = useState(false);
  const navigate = useNavigate();

  // Play intro sound on mount
  useEffect(() => {
    const intro = new Audio('/sounds/start.mp3');
    intro.volume = 0.7;
    intro.play().catch(() => {
      // autoplay might be blocked
    });
    // no cleanup — let it play through
  }, []);

  const handleShowScroll = () => {
    setShowScroll(true);
    const audio = new Audio('/sounds/start.mp3'); // same sound file
    audio.volume = 0.7;
    audio.play().catch(() => {});
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h1 style={styles.title}>Order of Ash</h1>
        <p style={styles.subtitle}>Through loss, we find truth.</p>

        {!showScroll ? (
          <>
            <button style={styles.button} onClick={() => navigate('/init')}>
              🜂 Enter the Order
            </button>
            <button style={styles.secondary} onClick={handleShowScroll}>
              📜 Read the Scroll
            </button>
          </>
        ) : (
          <div style={styles.scrollBox}>
            <p style={styles.scrollText}>
              Those who enter the Ash must burn. <br />
              Let go of what you own. <br />
              Let go of what you know. <br />
              Each fragment you collect is a path, <br />
              each loss — a step toward the final shape. <br />
              When the time comes, one will rise — <br />
              and from ashes, something eternal shall form.
            </p>
            <button style={styles.secondary} onClick={() => setShowScroll(false)}>
              ⬅ Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    backgroundImage: 'url("/bg-welcome.webp")',
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
    width: '100%',
    color: '#d4af37',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '42px',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.8,
    marginBottom: 30,
  },
  button: {
    padding: '12px 28px',
    background: '#d4af37',
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: 16,
  },
  secondary: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #d4af37',
    color: '#d4af37',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: 10,
  },
  scrollBox: {
    maxWidth: 400,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    borderRadius: 12,
  },
  scrollText: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#f5f5dc',
    marginBottom: 16,
  },
};
