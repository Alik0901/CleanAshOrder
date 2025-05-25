import { useNavigate } from 'react-router-dom';

export default function Path() {
  const navigate = useNavigate();

  const handlePayment = () => {
    const tonLink = `https://app.tonkeeper.com/transfer/UQAXEa2djA28bnSbhgid_2j7rtzdPcAcCZ8kDPFF9Lf1noZV?amount=1000000000&text=Burn%20yourself%20in%20Ash`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tonLink);
    } else {
      window.open(tonLink, '_blank');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>
        <p style={styles.subtitle}>You have taken the first step.</p>

        <button style={styles.button} onClick={handlePayment}>
          🔥 Burn Yourself for 1 TON
        </button>

        <button style={styles.secondary} onClick={() => navigate('/me')}>
          📜 View Your Ashes
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
  button: {
    padding: '10px 24px',
    background: '#d4af37',
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: 16,
  },
  secondary: {
    padding: '8px 20px',
    background: 'transparent',
    color: '#d4af37',
    border: '1px solid #d4af37',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
