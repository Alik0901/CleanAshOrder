// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Path() {
  const nav = useNavigate();

  /* ---------- профиль ---------- */
  const [tgId,        setTgId]        = useState('');
  const [fragments,   setFragments]   = useState([]);
  const [lastBurn,    setLastBurn]    = useState(null);
  const [isCursed,    setIsCursed]    = useState(false);
  const [curseTill,   setCurseTill]   = useState(null);
  const [cooldown,    setCooldown]    = useState(0);

  /* ---------- платёж ---------- */
  const [loading,     setLoading]     = useState(true);
  const [burning,     setBurning]     = useState(false);
  const [invoiceId,   setInvoiceId]   = useState(null);
  const [tonUrl,      setTonUrl]      = useState('');   // ton://…
  const [hubUrl,      setHubUrl]      = useState('');   // https://tonhub…
  const [polling,     setPolling]     = useState(false);
  const [newFrag,     setNewFrag]     = useState(null);
  const [err,         setErr]         = useState('');

  const pollRef = useRef(null);
  const CD_SEC  = 120;                                // 2 мин

  /* utils ------------------------------------------------------------------ */
  const restCooldown = last =>
    !last ? 0
          : Math.max(0, CD_SEC - Math.floor((Date.now() - new Date(last)) / 1000));

  const openTonSpace = url => {                       // встроенный Wallet
    console.log('👣 ton:// href', url);
    window.location.href = url;
  };

  /* тикер кулдауна --------------------------------------------------------- */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(()=> setCooldown(t => t>1? t-1 : 0), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* инициализация ---------------------------------------------------------- */
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id     = unsafe.user?.id;
    if (!id) { nav('/init'); return; }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) { nav('/init'); return; }

    /* восстановление незавершённого платежа */
    const inv  = localStorage.getItem('invoiceId');
    const ton  = localStorage.getItem('tonspaceUrl');
    const hub  = localStorage.getItem('paymentUrl');
    if (inv && ton && hub) {
      setInvoiceId(inv); setTonUrl(ton); setHubUrl(hub);
      setPolling(true);
      pollRef.current = setInterval(()=> checkStatus(inv), 5_000);
    }

    /* загрузка профиля ----------------------------------------------------- */
    const load = async () => {
      setLoading(true); setErr('');
      try {
        const r  = await fetch(`${BACKEND_URL}/api/player/${id}`);
        if (!r.ok) throw new Error();
        const d  = await r.json();
        setFragments(d.fragments||[]);
        setLastBurn(d.last_burn);
        if (d.curse_expires && new Date(d.curse_expires) > new Date()) {
          setIsCursed(true); setCurseTill(d.curse_expires);
        } else {
          setIsCursed(false); setCurseTill(null);
          setCooldown(restCooldown(d.last_burn));
        }
      } catch { nav('/init'); }
      finally   { setLoading(false); }
    };
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [nav]);

  /* создание счёта --------------------------------------------------------- */
  const handleBurn = async () => {
    setBurning(true); setErr('');
    try {
      const token = localStorage.getItem('token');
      const r  = await fetch(`${BACKEND_URL}/api/burn-invoice`,{
        method:'POST',
        headers:{'Content-Type':'application/json',
                 'Authorization':`Bearer ${token}`},
        body:JSON.stringify({ tg_id: tgId })
      });
      const d  = await r.json();
      if (!r.ok) throw new Error(d.error || 'Can’t create invoice');

      /* сохраняем deeplink’и */
      setInvoiceId(d.invoiceId); setTonUrl(d.tonspaceUrl); setHubUrl(d.paymentUrl);
      localStorage.setItem('invoiceId', d.invoiceId);
      localStorage.setItem('tonspaceUrl', d.tonspaceUrl);
      localStorage.setItem('paymentUrl', d.paymentUrl);

      openTonSpace(d.tonspaceUrl);                    // ← мгновенный переход
      setPolling(true);
      pollRef.current = setInterval(()=> checkStatus(d.invoiceId), 5_000);
    } catch(e){ setErr(e.message); setBurning(false); }
  };

  /* опрос статуса ---------------------------------------------------------- */
  const checkStatus = async id => {
    try{
      const token = localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-status/${id}`,
                            {headers:{Authorization:`Bearer ${token}`}});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'status error');

      if (d.paid){
        clearInterval(pollRef.current); setPolling(false); setBurning(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('tonspaceUrl');
        localStorage.removeItem('paymentUrl');

        if (d.cursed){
          setErr(`⚠️ Cursed till ${new Date(d.curse_expires).toLocaleString()}`);
          setIsCursed(true); setCurseTill(d.curse_expires);
        } else {
          setNewFrag(d.newFragment); setFragments(d.fragments);
          setLastBurn(d.lastBurn); setCooldown(restCooldown(d.lastBurn));
          setIsCursed(false); setCurseTill(null);
        }
      }
    }catch(e){
      clearInterval(pollRef.current); setPolling(false); setBurning(false);
      setErr(e.message);
    }
  };

  /* ---------- UI ---------- */
  if (loading) return <div style={st.center}>Loading…</div>;

  const fmt = s => `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={st.wrap}>
      <div style={st.overlay}/>
      <div style={st.card}>
        <h2 style={st.title}>The Path Begins</h2>

        {newFrag && <p style={st.got}>🔥 You received fragment #{newFrag}!</p>}

        { isCursed
          ? <p style={st.status}>⚠️ Cursed till {new Date(curseTill).toLocaleString()}</p>
          : cooldown>0
            ? <p style={st.status}>⏳ Next burn in {fmt(cooldown)}</p>
            : <p style={st.status}>Ready to burn yourself.</p> }

        <button style={{...st.main,opacity: burning||polling||isCursed||cooldown>0?0.6:1}}
                disabled={burning||polling||isCursed||cooldown>0}
                onClick={handleBurn}>
          {burning ? 'Creating invoice…'
                   : polling ? 'Waiting for payment…'
                             : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling && hubUrl &&
          <button style={st.sec} onClick={()=>window.open(hubUrl,'_blank')}>
            Open in Tonhub
          </button>
        }

        <button style={st.sec} onClick={()=> nav('/profile')}>
          Go to your personal account
        </button>

        {err && <p style={st.err}>{err}</p>}
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const st = {
  center:{display:'flex',height:'100vh',alignItems:'center',
          justifyContent:'center',color:'#fff',fontSize:18},
  wrap:  {position:'relative',height:'100vh',
          background:`url("/bg-path.webp") center/cover no-repeat`},
  overlay:{position:'absolute',inset:0,background:'rgba(0,0,0,.55)'},
  card:  {position:'relative',zIndex:2,maxWidth:380,margin:'0 auto',
          height:'100%',display:'flex',flexDirection:'column',
          justifyContent:'center',alignItems:'center',
          padding:'0 16px',textAlign:'center',color:'#d4af37'},
  title:{fontSize:28,marginBottom:16},
  got:  {fontSize:16,color:'#7cfc00',marginBottom:12},
  status:{fontSize:16,marginBottom:12},
  main:{padding:'12px 24px',fontSize:16,marginBottom:14,
        background:'#d4af37',border:'none',borderRadius:6,color:'#000'},
  sec: {padding:'10px 24px',fontSize:14,marginBottom:12,
        background:'transparent',border:'1px solid #d4af37',
        borderRadius:6,color:'#d4af37',cursor:'pointer'},
  err: {color:'#ff6347',fontSize:14,marginTop:12,maxWidth:320}
};
