// src/screens/Path.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const COOLDOWN_SECONDS = 2 * 60;               // 2 мин

export default function Path() {
  const nav = useNavigate();

  /* ----------  state  ---------- */
  const [tgId,setTgId]           = useState('');
  const [fragments,setFragments] = useState([]);
  const [lastBurn,setLastBurn]   = useState(null);
  const [cooldown,setCooldown]   = useState(0);
  const [isCursed,setIsCursed]   = useState(false);
  const [curseTo,setCurseTo]     = useState(null);

  const [loading,setLoading]     = useState(true);
  const [burning,setBurning]     = useState(false);
  const [polling,setPolling]     = useState(false);

  const [invoiceId,setInvoiceId] = useState(null);
  const [hubUrl,setHubUrl]       = useState('');
  const [tonUrl,setTonUrl]       = useState('');
  const [newFrag,setNewFrag]     = useState(null);
  const [err,setErr]             = useState('');

  const pollRef = useRef(null);

  /* ----------  helpers  ---------- */
  const ms = d => new Date(d).getTime();
  const restCool = last =>
    Math.max(0, COOLDOWN_SECONDS - ~~((Date.now()-ms(last))/1000));

  /** безопасный переход в Ton Space / fallback */
  const openTonSpace = url => {
    try {
      if (window.Telegram?.WebApp?.openLink) {
        console.log('👣 openLink _self', url);
        window.Telegram.WebApp.openLink(url,{target:'_self'});
      } else {
        console.warn('🔎 openLink absent, href fallback');
        window.location.href = url;
      }
    } catch(e) {
      console.error('❌ openLink err', e);
      window.location.href = url;
    }
  };

  /* ----------  countdown ticker  ---------- */
  useEffect(()=>{
    if(cooldown<=0) return;
    const id = setInterval(()=> setCooldown(c=>c>1?c-1:0),1000);
    return ()=> clearInterval(id);
  },[cooldown]);

  /* ----------  first mount  ---------- */
  useEffect(()=>{
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if(!u?.id){ nav('/init'); return; }
    setTgId(String(u.id));

    const token = localStorage.getItem('token');
    if(!token){ nav('/init'); return; }

    /* восстановление незаконченного платежа */
    const inv  = localStorage.getItem('invoiceId');
    const hUrl = localStorage.getItem('hubUrl');
    const tUrl = localStorage.getItem('tonUrl');
    if(inv&&hUrl&&tUrl){
      setInvoiceId(inv); setHubUrl(hUrl); setTonUrl(tUrl);
      setPolling(true);
      pollRef.current = setInterval(()=> checkStatus(inv),5_000);
    }

    loadProfile();
    window.addEventListener('focus', loadProfile);
    return ()=> window.removeEventListener('focus', loadProfile);

    async function loadProfile(){
      setLoading(true); setErr('');
      try{
        const r = await fetch(`${BACKEND_URL}/api/player/${u.id}`);
        if(!r.ok) throw new Error();
        const d = await r.json();
        setFragments(d.fragments||[]);
        setLastBurn(d.last_burn);
        setCooldown(restCool(d.last_burn));
        if(d.curse_expires && ms(d.curse_expires) > Date.now()){
          setIsCursed(true); setCurseTo(d.curse_expires);
        } else {
          setIsCursed(false); setCurseTo(null);
        }
      }catch{ nav('/init'); }
      finally{ setLoading(false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  /* ----------  create invoice  ---------- */
  const handleBurn = async()=>{
    setBurning(true); setErr('');
    try{
      const token = localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-invoice`,{
        method:'POST',
        headers:{'Content-Type':'application/json',
                 Authorization:`Bearer ${token}`},
        body:JSON.stringify({tg_id:tgId})
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error);
      console.log('🧾 invoice', d);

      localStorage.setItem('invoiceId', d.invoiceId);
      localStorage.setItem('hubUrl',   d.paymentUrl);
      localStorage.setItem('tonUrl',   d.tonspaceUrl);

      setInvoiceId(d.invoiceId); setHubUrl(d.paymentUrl); setTonUrl(d.tonspaceUrl);

      openTonSpace(d.tonspaceUrl);          // ⇢ встроенный кошелёк
      setPolling(true);
      pollRef.current = setInterval(()=> checkStatus(d.invoiceId),5_000);
    }catch(e){ setErr(e.message); }
    finally{ setBurning(false); }
  };

  /* ----------  poll status  ---------- */
  const checkStatus = async id=>{
    try{
      const token = localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-status/${id}`,
                            {headers:{Authorization:`Bearer ${token}`}});
      const d = await r.json();
      if(!r.ok){ throw new Error(d.error); }
      if(d.paid){
        clearInterval(pollRef.current); setPolling(false);
        console.log('✅ paid', d);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('hubUrl');
        localStorage.removeItem('tonUrl');
        if(d.cursed){
          setErr(`⚠ Cursed till ${new Date(d.curse_expires).toLocaleString()}`);
          setIsCursed(true); setCurseTo(d.curse_expires);
        }else{
          setNewFrag(d.newFragment);
          setFragments(d.fragments);
          setLastBurn(d.lastBurn);
          setCooldown(restCool(d.lastBurn));
          setIsCursed(false); setCurseTo(null);
        }
      }
    }catch(e){
      clearInterval(pollRef.current); setPolling(false);
      setErr(e.message);
    }
  };

  /* ----------  ui  ---------- */
  if(loading) return <div style={s.center}>loading…</div>;
  const time = s=>`${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return(
    <div style={s.wrap}>
      <div style={s.ov}/>
      <div style={s.box}>
        <h2 style={s.title}>The Path Begins</h2>

        {newFrag && <p style={s.msg}>🔥 New fragment #{newFrag}</p>}

        {isCursed
          ? <p style={s.status}>⚠ Cursed till {new Date(curseTo).toLocaleString()}</p>
          : cooldown>0
            ? <p style={s.status}>⏳ Next burn in {time(cooldown)}</p>
            : <p style={s.status}>Ready to burn yourself.</p>}

        <button style={{...s.main,opacity:(burning||polling||isCursed||cooldown)?.6:1}}
                disabled={burning||polling||isCursed||cooldown}
                onClick={handleBurn}>
          {burning? 'Creating…' : polling? 'Waiting…' : '🔥 Burn Yourself for 0.5 TON'}
        </button>

        {polling &&
          <button style={s.sec} onClick={()=>openTonSpace(tonUrl)}>Open in Ton Wallet</button>}
        <button style={s.sec} onClick={()=> nav('/profile')}>Go to your personal account</button>
        {err && <p style={s.err}>{err}</p>}
      </div>
    </div>);
}

/* ----------  styles  ---------- */
const s = {
  center:{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff'},
  wrap  :{position:'relative',height:'100vh',background:'url(/bg-path.webp) center/cover'},
  ov    :{position:'absolute',inset:0,background:'rgba(0,0,0,.55)'},
  box   :{position:'relative',zIndex:1,height:'100%',display:'flex',flexDirection:'column',
          justifyContent:'center',alignItems:'center',textAlign:'center',color:'#d4af37',padding:16},
  title :{fontSize:28,marginBottom:16},
  msg   :{color:'#7CFC00',marginBottom:12},
  status:{marginBottom:12},
  main  :{padding:'10px 24px',borderRadius:6,border:'none',background:'#d4af37',color:'#000',marginBottom:12},
  sec   :{padding:'10px 24px',borderRadius:6,border:'1px solid #d4af37',background:'transparent',
          color:'#d4af37',marginBottom:12,cursor:'pointer'},
  err   :{color:'#f55',marginTop:12}
};