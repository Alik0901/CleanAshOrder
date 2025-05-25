import { useState } from 'react';

export default function Path() {
  const [log, setLog] = useState([]);
  const [address, setAddress] = useState('');

  const addLog = (msg, type = 'debug') => {
    const icon = type === 'error' ? '🟥' : '🟩';
    setLog((prev) => [...prev, `${icon} ${msg}`]);
  };

  const handleBurn = () => {
    addLog('🔥 You chose to burn (not implemented yet)');
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>
        <p style={styles.subtitle}>You have taken the first step.</p>

        {address ? (
          <p style={styles.addr}>🜂 {address}</p>
        ) : (
          <p style={styles.subconnecting}>Wallet not connected</p>
        )}

        <button style={styles.button} onClick={handleBurn}>
          🔥 Burn Yourself
        </button>

        <div style={styles.logBox}>
          <p style={{ fontWeight: 'bold' }}>Logs:</p>
          {log.map((line, idx) => (
            <p key={idx} style={{ fontSize: 12, margin: 0 }}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    backgroundImage: 'url("/bg-path.webp")',
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
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '26px',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.85,
    marginBottom: 20,
  },
  addr: {
    fontSize: '15px',
    marginBottom: 12,
  },
  subconnecting: {
    fontSize: '15px',
    marginBottom: 12,
    opacity: 0.7,
  },
  button: {
    padding: '10px 24px',
    background: '#d4af37',
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  logBox: {
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
    textAlign: 'left',
  },
};
