import { useNavigate } from 'react-router-dom';

export default function Init() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h1 style={styles.title}>The First Flame</h1>
        <p style={styles.subtitle}>Only ash remains after you step forward.</p>

        <button style={styles.button} onClick={() => navigate('/path')}>
          Begin the Path
        </button>

        <button style={styles.backButton} onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    backgroundImage: 'url("/bg-init.webp")',
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
    color: '#ffcc66',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 20px',
  },
  title: {
    fontSize: '28px',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.85,
    marginBottom: 20,
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#ffcc66',
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #ffcc66',
    color: '#ffcc66',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
