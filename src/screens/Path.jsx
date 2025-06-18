/*  Path.jsx
 *  Экран «The Path Begins»
 *  — burn-кнопка на 0.5 TON
 *  — поддержка Telegram-Wallet (Android) и Tonhub (везде)
 *  — DEV-оверлей с логами (?debug=1)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------- env & helpers ---------- */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const IS_DEV   = import.meta.env.DEV;
const TG       = window.Telegram?.WebApp;
const PLATFORM = TG?.platform ?? 'unknown';       // android | ios | …

/* ---------- стили ---------- */

const styles = {
  /* фон + центрирование */
  page : {position:'relative',minHeight:'100vh',
          background:'url("/bg-path.webp") center / cover',
          display:'flex',justifyContent:'center',alignItems:'center',
          padding:'32px 12px'},
  /* “карточка” */
  card : {width:'100%',maxWidth:420,textAlign:'center',color:'#d4af37'},
  title: {fontSize:30,fontWeight:700,margin:'0 0 8px'},
  sub  : {fontSize:16,margin:'0 0 24px'},
  /* кнопки */
  btn  : {display:'block',width:'100%',padding:'12px',
          fontSize:16,borderRadius:6,border:'none',
          margin:'12px 0',cursor:'pointer',transition:'opacity .2s'},
  prim : {background:'#d4af37',color:'#000'},
  sec  : {background:'transparent',border:'1px solid #d4af37',color:'#d4af37'},
  /* статусы */
  status : {fontSize:15,minHeight:22,margin:'12px 0'},
  good   : {color:'#6BCB77'}, bad:{color:'#FF6B6B'},
  /* DEV-оверлей */
  debug  : {position:'fixed',insetInline:0,bottom:0,maxHeight:'45vh',
            overflowY:'auto',fontSize:11,background:'#000c',color:'#5CFF5C',
            padding:'4px 6px',whiteSpace:'pre-line',zIndex:9_999},
};

/* ---------- DEV-overlay ---------- */
function DebugConsole() {
  const [lines, set] = useState([]);
  useEffect(() => {
    if (!TG?.onEvent) return;
    const h = e => set(l => [...l, `[tg] ${e}`]);
    TG.onEvent('viewport_changed', h);
    TG.onEvent('safe_area_changed', h);
    return () => {
      TG.offEvent('viewport_changed', h);
      TG.offEvent('safe_area_changed', h);
    };
  }, []);
  return <div style={styles.debug}>{lines.join('\n')}</div>;
}

/* ---------- Component ---------- */
export default function Path() {
  const nav = useNavigate();

  /* profile state */
  const [tgId,setTgId]               = useState('');
  const [lastBurn,setLastBurn]       = useState(null);
  const [isCursed,setIsCursed]       = useState(false);
  const [curseUntil,setCurseUntil]   = useState(null);
  const [cooldown,setCooldown]       = useState(0);

  /* payment state */
  const [loading,setLoading]         = useState(true);
  const [burning,setBurning]         = useState(false);
  const [polling,setPolling]         = useState(false);
  const [paymentUrl,setPaymentUrl]   = useState('');
  const [tonUrl,setTonUrl]           = useState('');
  const [invoiceId,setInvoiceId]     = useState(null);
  const [newFrag,setNewFrag]         = useState(null);
  const [err,setErr]                 = useState('');

  const pollRef = useRef(null);
  const COOLDOWN = 120; // sec

  /* helpers */
  const secondsLeft = ts =>
    Math.max(0, COOLDOWN - Math.floor((Date.now()-new Date(ts).getTime())/1e3));
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* ---------- mount ---------- */
  useEffect(() => {
    const unsafe = TG?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) { nav('/init'); return; }
    setTgId(String(id));

    if (!localStorage.getItem('token')) { nav('/init'); return; }

    /* восстановление незакрытого инвойса */
    const inv = localStorage.getItem('invoiceId');
    if (inv) {
      setInvoiceId(inv);
      setPaymentUrl(localStorage.getItem('paymentUrl')||'');
      setTonUrl(localStorage.getItem('tonspaceUrl')||'');
      setPolling(true);
      pollRef.current = setInterval(()=>checkStatus(inv),5_000);
    }

    /* профиль */
    (async()=>{
      try{
        const r = await fetch(`${BACKEND_URL}/api/player/${id}`);
        const j = await r.json();
        setLastBurn(j.last_burn);
        if (j.curse_expires && new Date(j.curse_expires) > new Date()) {
          setIsCursed(true); setCurseUntil(j.curse_expires);
        }
        setCooldown(secondsLeft(j.last_burn));
      }finally{ setLoading(false); }
    })();

    const tick = setInterval(()=>setCooldown(c=>c>0?c-1:0),1000);
    return ()=>clearInterval(tick);
  },[nav]);

  /* ---------- actions ---------- */
  const openWallet = () =>{
    if (PLATFORM==='android' && tonUrl){
      TG.openLink(tonUrl,{try_instant_view:false});
    } else {
      TG.openLink(paymentUrl,{try_instant_view:false});
    }
  };

  const burn = async()=>{
    setBurning(true); setErr('');
    try{
      const tok = localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-invoice`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},
        body: JSON.stringify({tg_id: tgId})
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'Invoice error');

      setInvoiceId(j.invoiceId); setPaymentUrl(j.paymentUrl); setTonUrl(j.tonspaceUrl);
      localStorage.setItem('invoiceId',j.invoiceId);
      localStorage.setItem('paymentUrl',j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      openWallet();                         // сразу выводим кошелёк
      setPolling(true);
      pollRef.current = setInterval(()=>checkStatus(j.invoiceId),5_000);
    }catch(e){ setErr(e.message); setBurning(false);}
  };

  const checkStatus = async id =>{
    try{
      const tok=localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${tok}`}
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'status');
      if (j.paid){
        clearInterval(pollRef.current); setPolling(false); setBurning(false);
        localStorage.removeItem('invoiceId');localStorage.removeItem('paymentUrl');localStorage.removeItem('tonspaceUrl');
        if (j.cursed){
          setIsCursed(true); setCurseUntil(j.curse_expires);
        }else{
          setNewFrag(j.newFragment); setLastBurn(j.lastBurn);
          setCooldown(COOLDOWN); setIsCursed(false); setCurseUntil(null);
        }
      }
    }catch(e){ setErr(e.message); clearInterval(pollRef.current); setPolling(false); setBurning(false);}
  };

  /* ---------- UI ---------- */
  if (loading) return <div style={{...styles.page,color:'#fff'}}>Loading…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>The Path Begins</h2>
        <p style={styles.sub}>Ready to burn yourself.</p>

        {newFrag && <p style={{...styles.status,...styles.good}}>🔥 Fragment #{newFrag} received!</p>}
        {err     && <p style={{...styles.status,...styles.bad}}>{err}</p>}
        {isCursed && <p style={styles.status}>⛔ Cursed until {new Date(curseUntil).toLocaleString()}</p>}
        {!isCursed && cooldown>0 && <p style={styles.status}>⏳ Next burn in {fmt(cooldown)}</p>}

        {/* burn button */}
        <button
          style={{...styles.btn,...styles.prim,opacity:(burning||polling||cooldown>0||isCursed)?.6:1}}
          disabled={burning||polling||cooldown>0||isCursed}
          onClick={burn}
        >
          {burning? 'Creating invoice…'
          : polling? 'Waiting for payment…'
          : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {/* wallet buttons */}
        {polling && (
          <>
            {PLATFORM==='android' && tonUrl && (
              <button style={{...styles.btn,...styles.sec}} onClick={openWallet}>
                Continue in Telegram Wallet
              </button>
            )}
            {paymentUrl && (
              <button style={{...styles.btn,...styles.sec}} onClick={()=>TG.openLink(paymentUrl,{try_instant_view:false})}>
                Open in Tonhub
              </button>
            )}
          </>
        )}

        <button style={{...styles.btn,...styles.sec}} onClick={()=>nav('/profile')}>
          Go to your personal account
        </button>
      </div>

      {IS_DEV && location.search.includes('debug=1') && <DebugConsole/>}
    </div>
  );
}
