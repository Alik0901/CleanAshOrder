import { useEffect, useState } from 'react';
import { TonConnectUIProvider, TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

export default function Path() {
  const [log, setLog] = useState([]);
  const [address, setAddress] = useState('');
  const [tonConnectUi] = useTonConnectUI();

  const addLog = (msg, type = 'debug') => {
    const icon = type === 'error' ? '🟥' : '🟩';
    setLog((prev) => [...prev, `${icon} ${msg}`]);
  };

  const sendBurnTx = async () => {
    try {
      addLog('Preparing transaction...');
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: 'EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // TODO: заменить на адрес твоего смарт-контракта
            amount: (1 * 10 ** 9).toString(), // 1 TON в нанотонах
          },
        ],
      };

      await tonConnectUi.sendTransaction(tx);
      addLog('🔥 Transaction sent!');
    } catch (err) {
      addLog(`Transaction error: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      Telegram.WebApp.expand();
      addLog('✅ Telegram WebApp detected');
    } else {
      addLog('❌ Not inside Telegram WebApp', 'error');
    }

    tonConnectUi.setConnectRequestParameters({ state: 'path' });

    tonConnectUi.onStatusChange((walletInfo) => {
      if (walletInfo?.account?.address) {
        setAddress(walletInfo.account.address);
        addLog(`🔗 Connected: ${walletInfo.account.address}`);
      }
    });
  }, []);

  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <div style={styles.container}>
        <div style={styles.overlay} />
        <div style={styles.content}>
          <h2 style={styles.title}>The Path Begins</h2>
          <p style={styles.subtitle}>You have taken the first step.</p>

          {address && <p style={styles.addr}>🜂 {address}</p>}

          <TonConnectButton />

          <button style={styles.button} onClick={sendBurnTx}>
            🔥 Burn Yourself for 1 TON
          </button>

          <div style={styles.logBox}>
            <p style={{ fontWeight: 'bold' }}>Logs:</p>
            {log.map((line, idx) => (
              <p key={idx} style={{ fontSize: 12, margin: 0 }}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </TonConnectUIProvider>
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
    padding: '0 20px',
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
