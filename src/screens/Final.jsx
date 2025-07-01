// src/screens/Final.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate }            from 'react-router-dom';
import TonProvider                from 'ton-inpage-provider';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
  ?? 'https://ash-backend-production.up.railway.app';

// TODO: подставьте реальные адрес и ABI вашего контракта
const CONTRACT_ADDRESS = 'EQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const CONTRACT_ABI     = {/* ... ваш ABI ... */};

export default function Final() {
  const navigate = useNavigate();
  const [input,    setInput]    = useState('');
  const [status,   setStatus]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [allowed,  setAllowed]  = useState(false);
  const [sending,  setSending]  = useState(false);

  // 1) Проверяем, можно ли сейчас вводить фразу
  useEffect(() => {
    const init = async () => {
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (!userId) return navigate('/init');

      const token = localStorage.getItem('token');
      if (!token)    return navigate('/init');

      try {
        const res = await fetch(`${BACKEND_URL}/api/final/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.canEnter) {
          setAllowed(true);
          setStatus('🗝 You may now enter your final phrase.');
        } else {
          setStatus('⏳ Not the time yet. Come back at your daily window.');
        }
      } catch {
        setStatus('⚠️ Error checking permission.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // 2) По сабмиту — сначала валидация на сервере, потом tx в контракт
  const handleVerify = async e => {
    e.preventDefault();
    if (!allowed) return;

    setSending(true);
    setStatus('');

    // 2.1 — проверка по API
    try {
      const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
      const token  = localStorage.getItem('token');
      const res    = await fetch(`${BACKEND_URL}/api/validate-final`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, inputPhrase: input.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus(data.error || '❌ Incorrect or expired phrase.');
        setSending(false);
        return;
      }
    } catch {
      setStatus('⚠️ Network error.');
      setSending(false);
      return;
    }

    // 2.2 — отправка в смарт-контракт
    try {
      // инициализируем провайдера (появит диалог в кошельке TON)
      const provider = new TonProvider();
      await provider.ensureInitialized(); // запросит у пользователя подключение

      // получаем ваш контракт как JS-объект
      const contract = provider.openContract({
        address: CONTRACT_ADDRESS,
        abi:     CONTRACT_ABI
      });

      // вызываем публичный метод контракта, например `submitPhrase`
      // Предположим, в ABI есть метод `submitPhrase(string phrase)`
      const tx = await contract.methods
        .submitPhrase(input.trim())
        .send({ from: (await provider.request({ method: 'ton_requestAccounts' }))[0] });

      setStatus('✅ Phrase submitted on-chain! Transaction: ' + tx.id);
      // по желанию: ждём подтверждения, или сразу уходим
      setTimeout(() => navigate('/congratulations'), 2000);

    } catch (err) {
      console.error(err);
      setStatus('⚠️ Failed to send on-chain: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.checking}>Checking access...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>The Final Shape</h1>
        <p style={styles.status}>{status}</p>
        <form onSubmit={handleVerify} style={styles.form}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter secret phrase..."
            style={styles.input}
            disabled={!allowed || sending}
            required
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: allowed && !sending ? 1 : 0.5,
              cursor: allowed && !sending ? 'pointer' : 'not-allowed',
            }}
            disabled={!allowed || sending}
          >
            {sending ? 'Sending…' : 'Verify & Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}


const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: 'url("/bg-final.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',       // центрируем всё по горизонтали
    fontFamily: 'serif',
    color: '#d4af37',
  },
  backBtn: {
    alignSelf: 'flex-start',     // кнопка слева
    marginBottom: 12,
    background: 'transparent',
    border: 'none',
    color: '#d4af37',
    fontSize: 16,
    cursor: 'pointer',
  },
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',       // центрируем всё внутри
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  checking: {
    fontSize: 16,
    color: '#d4af37',
    textAlign: 'center',
  },
  status: {
    marginBottom: 12,
    fontSize: 14,
    color: '#d4af37',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',       // центрируем поля в форме
    gap: 12,
    width: '100%',
  },
  input: {
    width: '80%',                // уже не 100%, а 80% контейнера
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #d4af37',
    backgroundColor: '#111',
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    width: '80%',                // та же ширина, что и у инпута
    padding: '10px 24px',
    fontSize: 16,
    backgroundColor: '#d4af37',
    color: '#000',
    border: 'none',
    borderRadius: 6,
  },
};
