import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const [showScroll, setShowScroll] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        {!showScroll ? (
          <button style={styles.button} onClick={() => setShowScroll(true)}>
            🜂 Enter the Order
          </button>
        ) : (
          <div style={styles.scroll}>
            <p style={styles.text}>
              In the ashes of your past self lies the path to the eternal flame. <br />
              Lose what you cling to. <br />
              Sacrifice what defines you. <br />
              Let go to uncover the truth. <br />
              Only then will the Order reveal its final secret. <br />
              <br />
              Will you walk into the fire?
            </p>
            <button style={styles.smallButton} onClick={() => navigate('/')}>⬅ Back</button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    width: '100%',
    color: '#d4af37',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    textAlign: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '14px 28px',
    fontSize: '18px',
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
  },
  scroll: {
    backgroundColor: 'rgba(255, 248, 220, 0.85)',
    padding: '20px',
    maxWidth: '480px',
    borderRadius: '12px',
    color: '#111',
    fontSize: '16px',
    lineHeight: '1.6',
  },
  text: {
    marginBottom: '16px',
  },
  smallButton: {
    fontSize: '14px',
    padding: '8px 16px',
    background: '#d4af37',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
  },
};
