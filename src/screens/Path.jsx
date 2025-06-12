import React, { useEffect, useState, useRef } from 'react';
import { useNavigate }           from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Path() {
  const navigate = useNavigate();

  // профиль
  const [tgId, setTgId]               = useState('');
  const [fragments, setFragments]     = useState([]);
  const [lastBurn, setLastBurn]       = useState(null);
  const [isCursed, setIsCursed]       = useState(false);
  const [curseExpires, setCurseExpires] = useState(null);
  const [cooldown, setCooldown]       = useState(0);

  // оплата
  const [loading, setLoading]         = useState(true);
  const [burning, setBurning]         = useState(false);
  const [invoiceId, setInvoiceId]     = useState(null);
  const [paymentUrl, setPaymentUrl]   = useState('');   // tonhub
  const [tonspaceUrl, setTonspaceUrl] = useState('');   // ton://
  const [polling, setPolling]         = useState(false);
  const [error, setError]             = useState('');
  const [newFragment, setNewFragment] = useState(null);

  const pollingRef = useRef(null);
  const COOLDOWN_SECONDS = 2 * 60;

  // рассчитать кулдаун
  const computeCooldown = last => {
    if (!last) return 0;
    const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  };

  // тикер кулдауна
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c>1?c-1:0), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // монтирование
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id     = unsafe.user?.id;
    if (!id) return navigate('/init');
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) return navigate('/init');

    // восстановить незавершённый платёж
    const sid = localStorage.getItem('invoiceId');
    const sh  = localStorage.getItem('paymentUrl');
    const st  = localStorage.getItem('tonspaceUrl');
    if (sid && sh && st) {
      setInvoiceId(sid);
      setPaymentUrl(sh);
      setTonspaceUrl(st);
      setPolling(true);
      pollingRef.current = setInterval(() => checkPaymentStatus(sid), 5000);
    }

    // загрузить профиль
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const r = await fetch(`${BACKEND_URL}/api/player/${id}`, {
          headers: { 'Content-Type':'application/json' }
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        setFragments(d.fragments || []);
        setLastBurn(d.last_burn);
        if (d.curse_expires && new Date(d.curse_expires) > new Date()) {
          setIsCursed(true);
          setCurseExpires(d.curse_expires);
        } else {
          setIsCursed(false);
          setCurseExpires(null);
          setCooldown(computeCooldown(d.last_burn));
        }
      } catch {
        navigate('/init');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [navigate]);

  // Шаг 1: создать инвойс
  const handleBurn = async () => {
    setBurning(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const r = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${token}`
        },
        body: JSON.stringify({ tg_id })
      });
      const auth = r.headers.get('Authorization');
      if (auth?.startsWith('Bearer ')) {
        localStorage.setItem('token', auth.split(' ')[1]);
      }
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || '⚠️ Could not create invoice');
        return setBurning(false);
      }

      setInvoiceId(data.invoiceId);
      setPaymentUrl(data.paymentUrl);
      setTonspaceUrl(data.tonspaceUrl);
      localStorage.setItem('invoiceId', data.invoiceId);
      localStorage.setItem('paymentUrl', data.paymentUrl);
      localStorage.setItem('tonspaceUrl', data.tonspaceUrl);

      // открываем встроенный кошелёк Telegram
      window.location.href = data.tonspaceUrl;

      // запускаем polling
      setPolling(true);
      pollingRef.current = setInterval(() => checkPaymentStatus(data.invoiceId), 5000);
    } catch(e) {
      setError(`⚠️ ${e.message}`);
      setBurning(false);
    }
  };

  // Шаг 2: poll-статуса
  const checkPaymentStatus = async id => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${BACKEND_URL}/api/burn-status/${id}`, {
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${token}`
        }
      });
      const auth = r.headers.get('Authorization');
      if (auth?.startsWith('Bearer ')) {
        localStorage.setItem('token', auth.split(' ')[1]);
      }
      const d = await r.json();
      if (!r.ok) {
        clearInterval(pollingRef.current);
        setPolling(false);
        setBurning(false);
        return setError(d.error || '⚠️ Error checking payment');
      }
      if (d.paid) {
        clearInterval(pollingRef.current);
        setPolling(false);
        setBurning(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if (d.cursed) {
          setError(`⚠️ You are cursed until ${new Date(d.curse_expires).toLocaleString()}`);
          setIsCursed(true);
          setCurseExpires(d.curse_expires);
        } else {
          setNewFragment(d.newFragment);
          setFragments(d.fragments);
          setIsCursed(false);
          setCurseExpires(null);
          setLastBurn(d.lastBurn);
          setCooldown(computeCooldown(d.lastBurn));
        }
      }
    } catch(e) {
      clearInterval(pollingRef.current);
      setPolling(false);
      setBurning(false);
      setError(`⚠️ ${e.message}`);
    }
  };

  if (loading) {
    return <div style={styles.center}>Loading...</div>;
  }

  const formatTime = sec => {
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}/>
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && <p style={styles.message}>🔥 You received fragment #{newFragment}!</p>}

        {isCursed ? (
          <p style={styles.status}>
            ⚠️ You are cursed until {new Date(curseExpires).toLocaleString()}
          </p>
        ) : cooldown > 0 ? (
          <p style={styles.status}>⏳ Next burn in {formatTime(cooldown)}</p>
        ) : (
          <p style={styles.status}>Ready to burn yourself.</p>
        )}

        <button
          onClick={handleBurn}
          disabled={
            burning ||
            polling ||
            (isCursed && new Date(curseExpires) > new Date()) ||
            cooldown > 0
          }
          style={{
            ...styles.burnButton,
            opacity:
              burning ||
              polling ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 0.6 : 1,
            cursor:
              burning ||
              polling ||
              (isCursed && new Date(curseExpires) > new Date()) ||
              cooldown > 0
                ? 'not-allowed' : 'pointer'
          }}
        >
          {burning
            ? 'Creating invoice…'
            : polling
              ? 'Waiting for payment…'
              : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling && tonspaceUrl && (
          <button
            onClick={() => window.location.href = tonspaceUrl}
            style={styles.secondary}
          >
            Continue in Telegram Wallet
          </button>
        )}
        {polling && paymentUrl && (
          <button
            onClick={() => window.open(paymentUrl, '_blank')}
            style={styles.secondary}
          >
            Open in Tonhub
          </button>
        )}

        <button
          onClick={() => navigate('/profile')}
          style={styles.secondary}
        >
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  center:    { display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18 },
  container: { position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover' },
  overlay:   { position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)' },
  content:   { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:'0 16px',textAlign:'center' },
  title:     { fontSize:28,marginBottom:16 },
  message:   { fontSize:16,color:'#7CFC00',marginBottom:12 },
  status:    { fontSize:16,marginBottom:12 },
  burnButton:{ padding:'10px 24px',backgroundColor:'#d4af37',border:'none',borderRadius:6,color:'#000',fontSize:16,marginBottom:12 },
  secondary:{ padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12,cursor:'pointer' },
  error:     { color:'#FF6347',fontSize:14,marginTop:12 }
};
