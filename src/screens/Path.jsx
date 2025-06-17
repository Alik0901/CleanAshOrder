// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/** бек по-умолчанию при разработке */
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

/** константы */
const AMOUNT_TON_LABEL = '0.5 TON';   // выводим на кнопке
const COOLDOWN_SECONDS = 120;         // 2 мин

export default function Path() {
  const navigate = useNavigate();

  // ──────────────────────────── профиль ────────────────────────────
  const [tgId, setTgId]                 = useState('');
  const [fragments, setFragments]       = useState([]);
  const [lastBurn, setLastBurn]         = useState(null);
  const [isCursed, setIsCursed]         = useState(false);
  const [curseExpires, setCurseExpires] = useState(null);
  const [cooldown, setCooldown]         = useState(0);

  // ──────────────────────────── платёж ─────────────────────────────
  const [loading, setLoading]         = useState(true);
  const [burning, setBurning]         = useState(false);
  const [invoiceId, setInvoiceId]     = useState(null);
  const [paymentUrl, setPaymentUrl]   = useState('');  // tonhub https://
  const [tonspaceUrl, setTonspaceUrl] = useState('');  // ton://
  const [polling, setPolling]         = useState(false);
  const [newFragment, setNewFragment] = useState(null);
  const [error, setError]             = useState('');

  const pollingRef = useRef(null);

  // ───────── helpers ─────────
  const computeCooldown = last => {
    if (!last) return 0;
    const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  };

  /** безопасно открыть ton:// во встроенном кошельке  */
  const openTonWallet = url => {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);      // внутри Telegram
    } else {
      window.open(url, '_blank');                // обычный браузер
    }
  };

  // ───────── тикер кулдауна ─────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ───────── инициализация ─────────
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) { navigate('/init'); return; }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) { navigate('/init'); return; }

    // восстановим незавершённый платёж
    const savedId  = localStorage.getItem('invoiceId');
    const savedHub = localStorage.getItem('paymentUrl');
    const savedTon = localStorage.getItem('tonspaceUrl');
    if (savedId && savedHub && savedTon) {
      setInvoiceId(savedId); setPaymentUrl(savedHub); setTonspaceUrl(savedTon);
      setPolling(true);
      pollingRef.current = setInterval(() => checkPaymentStatus(savedId), 5000);
    }

    // загрузка профиля
    const loadProfile = async () => {
      setLoading(true); setError('');
      try {
        const res  = await fetch(`${BACKEND_URL}/api/player/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFragments(data.fragments || []);
        setLastBurn(data.last_burn);
        if (data.curse_expires && new Date(data.curse_expires) > new Date()) {
          setIsCursed(true);  setCurseExpires(data.curse_expires);
        } else {
          setIsCursed(false); setCurseExpires(null);
          setCooldown(computeCooldown(data.last_burn));
        }
      } catch { navigate('/init'); }
      finally { setLoading(false); }
    };

    loadProfile();
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [navigate]);

  // ───────── шаг 1: создаём инвойс (с фикс. 0,5 TON) ─────────
  const handleBurn = async () => {
    setBurning(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body   : JSON.stringify({ tg_id: tgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create invoice');

      // сохраняем
      setInvoiceId(data.invoiceId);
      setPaymentUrl(data.paymentUrl);
      setTonspaceUrl(data.tonspaceUrl);
      localStorage.setItem('invoiceId',  data.invoiceId);
      localStorage.setItem('paymentUrl', data.paymentUrl);
      localStorage.setItem('tonspaceUrl',data.tonspaceUrl);

      // открываем встроенный кошелёк
      openTonWallet(data.tonspaceUrl);

      // начинаем polling
      setPolling(true);
      pollingRef.current = setInterval(() => checkPaymentStatus(data.invoiceId), 5000);

    } catch (e) { setError(e.message); setBurning(false); }
  };

  // ───────── шаг 2: polling статуса ─────────
  async function checkPaymentStatus(id) {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${BACKEND_URL}/api/burn-status/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.error || 'status error');

      if (data.paid) {
        clearInterval(pollingRef.current); setPolling(false); setBurning(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if (data.cursed) {
          setError(`⚠️ You are cursed until ${new Date(data.curse_expires).toLocaleString()}`);
          setIsCursed(true); setCurseExpires(data.curse_expires);
        } else {
          setNewFragment(data.newFragment);
          setFragments(data.fragments);
          setLastBurn(data.lastBurn);
          setCooldown(computeCooldown(data.lastBurn));
          setIsCursed(false); setCurseExpires(null);
        }
      }
    } catch (e) {
      clearInterval(pollingRef.current); setPolling(false); setBurning(false);
      setError(e.message);
    }
  }

  // ───────── UI ─────────
  if (loading) return <div style={styles.center}>Loading…</div>;
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={styles.container}>
      <div style={styles.overlay}/>
      <div style={styles.content}>

        <h2 style={styles.title}>The Path Begins</h2>

        {newFragment && <p style={styles.message}>🔥 You received fragment #{newFragment}!</p>}

        {isCursed
          ? <p style={styles.status}>⚠️ You are cursed until {new Date(curseExpires).toLocaleString()}</p>
          : cooldown>0
            ? <p style={styles.status}>⏳ Next burn in {fmt(cooldown)}</p>
            : <p style={styles.status}>Ready to burn yourself.</p>
        }

        <button
          onClick={handleBurn}
          disabled={burning || polling || isCursed || cooldown>0}
          style={{
            ...styles.burnButton,
            opacity: burning||polling||isCursed||cooldown>0 ? .6 : 1,
            cursor : burning||polling||isCursed||cooldown>0 ? 'not-allowed' : 'pointer'
          }}
        >
          {burning ? 'Creating invoice…'
            : polling ? 'Waiting for payment…'
            : `🔥 Burn Yourself for ${AMOUNT_TON_LABEL}`}
        </button>

        {/* fallback на Tonhub */}
        {polling && paymentUrl && (
          <button style={styles.secondary} onClick={()=>window.open(paymentUrl,'_blank')}>
            Open in Tonhub
          </button>
        )}

        <button style={styles.secondary} onClick={()=>navigate('/profile')}>
          Go to your personal account
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

// ───────── стили (без изменений) ─────────
const styles = {
  center:    { display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18 },
  container: { position:'relative',height:'100vh',backgroundImage:'url("/bg-path.webp")',backgroundSize:'cover' },
  overlay:   { position:'absolute',inset:0,backgroundColor:'rgba(0,0,0,0.5)' },
  content:   { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#d4af37',padding:'0 16px',textAlign:'center' },
  title:     { fontSize:28,marginBottom:16 },
  message:   { fontSize:16,color:'#7CFC00',marginBottom:12 },
  status:    { fontSize:16,marginBottom:12 },
  burnButton:{ padding:'10px 24px',backgroundColor:'#d4af37',border:'none',borderRadius:6,color:'#000',fontSize:16,marginBottom:12 },
  secondary: { padding:'10px 24px',background:'transparent',border:'1px solid #d4af37',borderRadius:6,color:'#d4af37',fontSize:14,marginBottom:12,cursor:'pointer' },
  error:     { color:'#FF6347',fontSize:14,marginTop:12 }
};
