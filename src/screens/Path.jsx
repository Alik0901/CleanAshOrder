/*  Path.jsx
 *  Экран «The Path Begins» – кнопка “Burn 0.5 TON”,
 *  поддержка встроенного кошелька (Android) и Tonhub (все платформы),
 *  безопасный overlay-лог (виден только в DEV-режиме c ?debug=1).
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------- env & helpers ---------- */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const IS_DEV      = import.meta.env.DEV;
const TG          = window.Telegram?.WebApp;
const PLATFORM    = TG?.platform ?? 'unknown';   // 'android' | 'ios' | …

const styles = {
  /* базовые */
  page:      { position:'relative',minHeight:'100vh',
               background: 'url("/bg-path.webp") center/cover',
               display:'flex',justifyContent:'center',alignItems:'center',
               padding:'32px 12px' },
  card:      { width:'100%',maxWidth:420, textAlign:'center',color:'#d4af37' },
  title:     { fontSize:30, margin:'0 0 8px', fontWeight:700 },
  subtitle:  { margin:'0 0 24px', fontSize:16 },

  btn:       { display:'block',width:'100%',padding:'12px',
               fontSize:16,borderRadius:6,border:'none',
               margin:'0 0 12px',cursor:'pointer',transition:'opacity .2s' },
  primary:   { background:'#d4af37',color:'#000' },
  secondary: { background:'transparent',color:'#d4af37',
               border:'1px solid #d4af37' },

  status:    { fontSize:15, margin:'12px 0' ,minHeight:22},
  msgGood:   { color:'#6BCB77' },
  msgBad:    { color:'#FF6B6B' },

  /* tiny overlay-console */
  debug:     { position:'fixed',bottom:0,left:0,right:0,maxHeight:'45vh',
               overflowY:'auto',fontSize:11,background:'#000C',color:'#5CFF5C',
               padding:'4px 6px',whiteSpace:'pre-line',zIndex:9999 }
};

/* ---------- DEV-overlay ---------- */

function DebugConsole() {
  const [lines,setLines] = useState([]);
  useEffect(()=>{
    const h = (...args)=> setLines(l=>[...l, args.map(String).join(' ')]);
    TG?.onEvent   && TG.onEvent('viewport_changed', h);      // пару событий для примера
    return ()=> TG?.offEvent && TG.offEvent('viewport_changed', h);
  },[]);
  return <div style={styles.debug}>{lines.join('\n')}</div>;
}

/* ---------- Component ---------- */

export default function Path() {
  const navigate = useNavigate();

  /* --------  profile state  -------- */
  const [tgId,          setTgId]        = useState('');
  const [fragments,     setFragments]   = useState([]);
  const [lastBurn,      setLastBurn]    = useState(null);
  const [isCursed,      setIsCursed]    = useState(false);
  const [curseUntil,    setCurseUntil]  = useState(null);
  const [cooldown,      setCooldown]    = useState(0);

  /* --------  payment state  -------- */
  const [loading,       setLoading]     = useState(true);
  const [invoiceId,     setInvoiceId]   = useState(null);
  const [burning,       setBurning]     = useState(false);
  const [polling,       setPolling]     = useState(false);
  const [paymentUrl,    setPaymentUrl]  = useState('');
  const [tonspaceUrl,   setTonspaceUrl] = useState('');
  const [newFragment,   setNewFragment] = useState(null);
  const [error,         setError]       = useState('');

  const pollRef = useRef(null);
  const COOLDOWN = 120;                 // сек

  /* ---------- utils ---------- */

  const secLeft = last =>
    Math.max(0, COOLDOWN - Math.floor((Date.now()-new Date(last).getTime())/1e3));

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* ---------- mount ---------- */

  useEffect(()=>{
    const unsafe = TG?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) { navigate('/init'); return; }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) { navigate('/init'); return;}

    const recover = () => {
      const i  = localStorage.getItem('invoiceId');
      const hu = localStorage.getItem('paymentUrl');
      const tu = localStorage.getItem('tonspaceUrl');
      if (i && hu && tu) {
        setInvoiceId(i); setPaymentUrl(hu); setTonspaceUrl(tu);
        setPolling(true);
        pollRef.current = setInterval(()=>checkStatus(i), 5_000);
      }
    };

    const loadProfile = async() =>{
      try{
        const res = await fetch(`${BACKEND_URL}/api/player/${id}`);
        const p   = await res.json();
        setFragments(p.fragments||[]);
        setLastBurn(p.last_burn);
        if (p.curse_expires && new Date(p.curse_expires) > new Date()){
          setIsCursed(true); setCurseUntil(p.curse_expires);
        }
        setCooldown(secLeft(p.last_burn));
      }catch{ navigate('/init'); }
      setLoading(false);
    };

    recover();  loadProfile();
    const idInt = setInterval(()=> setCooldown(c=>c>0?c-1:0),1000);
    return ()=> clearInterval(idInt);
  },[navigate]);

  /* ---------- actions ---------- */

  const createInvoice = async()=>{
    setBurning(true); setError('');
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/burn-invoice`,{
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ tg_id: tgId })
      });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Unable to create invoice');

      setInvoiceId(j.invoiceId); setPaymentUrl(j.paymentUrl); setTonspaceUrl(j.tonspaceUrl);
      localStorage.setItem('invoiceId',j.invoiceId);
      localStorage.setItem('paymentUrl', j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      openWallet(j.tonspaceUrl, j.paymentUrl);
      setPolling(true);
      pollRef.current = setInterval(()=>checkStatus(j.invoiceId),5_000);
    }catch(e){ setError(e.message); setBurning(false);}
  };

  const openWallet = (tonUrl, hubUrl) =>{
    if (PLATFORM==='android' && tonUrl){
      TG.openLink(tonUrl,{try_instant_view:false});
    } else if (hubUrl){
      TG.openLink(hubUrl,{try_instant_view:false});
    }
  };

  const checkStatus = async(id)=>{
    try{
      const token=localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${token}`}
      });
      const j = await res.json();
      if (!res.ok) { throw new Error(j.error||'status err'); }
      if (j.paid){
        clearInterval(pollRef.current);
        setPolling(false); setBurning(false);
        localStorage.removeItem('invoiceId');localStorage.removeItem('paymentUrl');localStorage.removeItem('tonspaceUrl');
        if (j.cursed){
          setIsCursed(true); setCurseUntil(j.curse_expires);
        }else{
          setNewFragment(j.newFragment); setFragments(j.fragments);
          setLastBurn(j.lastBurn); setCooldown(COOLDOWN); setIsCursed(false); setCurseUntil(null);
        }
      }
    }catch(e){ setError(e.message); clearInterval(pollRef.current); setPolling(false); setBurning(false);}
  };

  /* ---------- render ---------- */

  if (loading) return <div style={{...styles.page,justifyContent:'center',color:'#fff'}}>Loading…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>The Path Begins</h2>
        <p style={styles.subtitle}>Ready to burn yourself.</p>

        {newFragment && <p style={{...styles.status,...styles.msgGood}}>🔥 Fragment #{newFragment} received!</p>}
        {error       && <p style={{...styles.status,...styles.msgBad}}>{error}</p>}
        {isCursed    && <p style={styles.status}>⛔ Cursed until {new Date(curseUntil).toLocaleString()}</p>}
        {!isCursed && cooldown>0 && <p style={styles.status}>⏳ Next burn in {fmt(cooldown)}</p>}

        <button
          style={{...styles.btn,...styles.primary,opacity:(burning||polling||cooldown>0||isCursed)?.6:1}}
          disabled={burning||polling||cooldown>0||isCursed}
          onClick={createInvoice}
        >
          {burning?'Creating invoice…':polling?'Waiting for payment…':'🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling && (
          <>
            {PLATFORM==='android' && tonspaceUrl && (
              <button style={styles.secondary} onClick={()=>openWallet(tonspaceUrl,paymentUrl)} className="btn" >
                Continue in Telegram Wallet
              </button>
            )}
            {paymentUrl && (
              <button style={styles.secondary} onClick={()=>openWallet(null,paymentUrl)} className="btn">
                Open in Tonhub
              </button>
            )}
          </>
        )}

        <button style={{...styles.btn,...styles.secondary}} onClick={()=>navigate('/profile')}>
          Go to your personal account
        </button>
      </div>

      {/* dev overlay */}
      {IS_DEV && location.search.includes('debug=1') && <DebugConsole/>}
    </div>
  );
}
