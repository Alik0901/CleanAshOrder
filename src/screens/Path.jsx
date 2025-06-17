// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Path() {
  const navigate = useNavigate();

  // ------- профиль -------
  const [tgId, setTgId]               = useState('');
  const [fragments, setFragments]     = useState([]);
  const [lastBurn, setLastBurn]       = useState(null);
  const [isCursed, setIsCursed]       = useState(false);
  const [curseExpires, setCurseExp]   = useState(null);
  const [cooldown, setCooldown]       = useState(0);

  // ------- платёж -------
  const [loading,   setLoading]       = useState(true);
  const [burning,   setBurning]       = useState(false);
  const [invoiceId, setInvoiceId]     = useState(null);
  const [paymentUrl,  setPaymentUrl]  = useState('');   // https:// для Tonhub
  const [tonspaceUrl, setTonspaceUrl] = useState('');   // ton:// для встроенного
  const [polling,   setPolling]       = useState(false);
  const [newFragment, setNewFrag]     = useState(null);
  const [error,     setError]         = useState('');

  const pollingRef        = useRef(null);
  const COOLDOWN_SECONDS  = 2 * 60;

  /* ---------- utils ---------- */
  const computeCooldown = last => {
    if (!last) return 0;
    const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  };

  /* ---------- таймер кулдауна ---------- */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* ---------- монтирование ---------- */
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) { navigate('/init'); return; }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) { navigate('/init'); return; }

    // восстанавливаем платёж (если был)
    const savedId  = localStorage.getItem('invoiceId');
    const savedHub = localStorage.getItem('paymentUrl');
    const savedTon = localStorage.getItem('tonspaceUrl');
    if (savedId && savedHub && savedTon) {
      setInvoiceId(savedId);
      setPaymentUrl(savedHub);
      setTonspaceUrl(savedTon);
      setPolling(true);
      pollingRef.current = setInterval(() => checkStatus(savedId), 5000);
    }

    // загружаем профиль
    const loadProfile = async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setFragments(d.fragments || []);
        setLastBurn(d.last_burn);
        if (d.curse_expires && new Date(d.curse_expires) > new Date()) {
          setIsCursed(true); setCurseExp(d.curse_expires);
        } else {
          setIsCursed(false); setCurseExp(null);
          setCooldown(computeCooldown(d.last_burn));
        }
      } catch { navigate('/init'); }
      finally { setLoading(false); }
    };

    loadProfile();
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [navigate]);

  /* ---------- создание инвойса ---------- */
  const handleBurn = async () => {
    setBurning(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tg_id: tgId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create invoice');

      // сохраняем
      setInvoiceId(data.invoiceId);
      setPaymentUrl(data.paymentUrl);
      setTonspaceUrl(data.tonspaceUrl);
      localStorage.setItem('invoiceId', data.invoiceId);
      localStorage.setItem('paymentUrl', data.paymentUrl);
      localStorage.setItem('tonspaceUrl', data.tonspaceUrl);

      /* --- главное изменение: открываем ton:// через openTelegramLink --- */
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(data.tonspaceUrl);
      } else {
        window.location.href = data.tonspaceUrl; // desktop-preview fallback
      }

      // старт опроса
      setPolling(true);
      pollingRef.current = setInterval(() => checkStatus(data.invoiceId), 5000);
    } catch (e) {
      setError(e.message); setBurning(false);
    }
  };

  /* ---------- опрос статуса ---------- */
  const checkStatus = async id => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/burn-status/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status check failed');

      if (data.paid) {
        clearInterval(pollingRef.current); setPolling(false); setBurning(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if (data.cursed) {
          setError(`⚠️ You are cursed until ${new Date(data.curse_expires).toLocaleString()}`);
          setIsCursed(true); setCurseExp(data.curse_expires);
        } else {
          setNewFrag(data.newFragment);
          setFragments(data.fragments);
          setLastBurn(data.lastBurn);
          setCooldown(computeCooldown(data.lastBurn));
        }
      }
    } catch (e) {
      clearInterval(pollingRef.current); setPolling(false); setBurning(false);
      setError(e.message);
    }
  };

  if (loading) return <div style={styles.center}>Loading…</div>;

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={styles.container}>
      <div style={styles.overlay}/>
      <div style={styles.content}>
        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && <p style={styles.message}>🔥 Fragment #{newFragment} obtained!</p>}

        {isCursed
          ? <p style={styles.status}>⚠️ Cursed until {new Date(curseExpires).toLocaleString()}</p>
          : cooldown>0
              ? <p style={styles.status}>⏳ Next burn in {fmt(cooldown)}</p>
              : <p style={styles.status}>Ready to burn yourself.</p>}

        <button
          onClick={handleBurn}
          disabled={burning||polling||isCursed||cooldown>0}
          style={{
            ...styles.burn,
            opacity:(burning||polling||isCursed||cooldown>0)?.6:1,
            cursor:(burning||polling||isCursed||cooldown>0)?'not-allowed':'pointer'
          }}>
          {burning ? 'Creating invoice…'
                   : polling ? 'Waiting for payment…'
                             : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling && paymentUrl &&
          <button
            onClick={() =>
              window.Telegram?.WebApp?.openLink
                ? window.Telegram.WebApp.openLink(paymentUrl)
                : window.open(paymentUrl,'_blank')}
            style={styles.secondary}>
            Open in Tonhub
          </button>}

        <button onClick={()=>navigate('/profile')} style={styles.secondary}>
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

/* ---- стили ---- */
const styles={
  center:{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18},
  container:{position:'relative',height:'100vh',background:'url("/bg-path.webp") center/cover'},
  overlay:{position:'absolute',inset:0,background:'rgba(0,0,0,.5)'},
  content:{position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:16,textAlign:'center'},
  title:{fontSize:28,marginBottom:16},
  message:{fontSize:16,color:'#7cfc00',marginBottom:12},
  status:{fontSize:16,marginBottom:12},
  burn:{padding:'10px 24px',background:'#d4af37',border:0,borderRadius:6,color:'#000',fontSize:16,marginBottom:12},
  secondary:{padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12},
  error:{color:'#ff6347',fontSize:14,marginTop:12}
};
