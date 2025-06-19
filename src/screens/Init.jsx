// src/screens/Init.jsx  –  полная версия
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL ??
                'https://ash-backend-production.up.railway.app';
const NAME_RGX = /^[A-Za-z ]+$/;

export default function Init() {
  const nav       = useNavigate();
  const inputRef  = useRef(null);

  /* ---------------- state ---------------- */
  const [tgId, setTgId]   = useState('');
  const [raw,  setRaw]    = useState('');
  const [msg,  setMsg]    = useState('Checking Telegram …');
  const [busy, setBusy]   = useState(true);

  const [name, setName]   = useState('');
  const okName            = NAME_RGX.test(name.trim()) && name.trim().length>0;

  const [showInfo, setInfo]   = useState(false);

  /* ---------- 1. Telegram bootstrap ---------- */
  useEffect(()=>{
    const wa  = window.Telegram?.WebApp;
    const uid = wa?.initDataUnsafe?.user?.id;
    if(!wa)        { setMsg('Telegram WebApp API missing'); return; }
    if(!uid)       { setMsg('Cannot read Telegram ID');     return; }
    setTgId(String(uid));
    setRaw(wa.initData || '');
  },[]);

  /* ---------- 2. check / init player ---------- */
  useEffect(()=>{
    if(!tgId) return;

    (async()=>{
      try{
        const r = await fetch(`${BACKEND}/api/player/${tgId}`);
        if(r.ok){                     // игрок есть → сразу берём JWT
          const j = await (await fetch(`${BACKEND}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ tg_id:tgId,name:'',initData:raw })
          })).json();
          localStorage.setItem('token', j.token);
          nav('/profile'); return;
        }
        /* 404 → новый игрок */
        if(!sessionStorage.getItem('aoa_info_seen')) setInfo(true);
        setMsg('Enter your name'); setBusy(false);
      }catch{ setMsg('Network error'); setBusy(false); }
    })();
  },[tgId,raw,nav]);

  /* ---------- submission ---------- */
  const submit=async e=>{
    e.preventDefault();
    if(!okName||busy||showInfo) return;
    setBusy(true); setMsg('Submitting …');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({tg_id:tgId,name:name.trim(),initData:raw})
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'init failed');
      localStorage.setItem('token', j.token);
      nav('/path');
    }catch(e){ setMsg(e.message); }
    setBusy(false);
  };

  /* ---------- UI ---------- */
  return (
    <div style={sty.wrap}>
      {/* ───────── Info modal ───────── */}
      {showInfo && (
        <div style={sty.mask} onClick={()=>{}}>
          <div style={sty.modal}>
            <h3>Welcome, Seeker!</h3>
            <p style={sty.p}>
              • Burn <b>exactly 0.5 TON</b> every time (max 4 TON in total).<br/>
              • Collect <b>8 Ash fragments</b> – expect <b>24 h curses</b>.<br/>
              • Five real pieces &amp; four curses are dealt at random.<br/>
              • Re-assemble the hidden phrase to forge a <b>unique final NFT</b>.<br/>
              • First who submits the phrase becomes the <b>sole Winner</b>.<br/><br/>
              Mis-payments are unrecoverable – double-check the amount.
            </p>
            <button style={sty.ok}
              onClick={()=>{ sessionStorage.setItem('aoa_info_seen','1');
                             setInfo(false); inputRef.current?.focus();}}>
              I understand
            </button>
          </div>
        </div>
      )}

      {/* ───────── card ───────── */}
      <form style={sty.card} onSubmit={submit}>
        <h1 style={sty.h}>Enter&nbsp;the Ash</h1>
        <p style={sty.sm}>Telegram ID: {tgId}</p>

        <input ref={inputRef}
          style={{...sty.inp,opacity:showInfo?0.35:1}}
          placeholder="Your name (A-Z only)"
          value={name}
          disabled={showInfo}
          onFocus={()=>showInfo&&setInfo(true)}
          onChange={e=>setName(e.target.value)}
        />

        <button type="submit"
          style={{...sty.btn,opacity:(okName&&!busy&&!showInfo)?1:0.45}}
          disabled={!okName||busy||showInfo}>
          Save and Continue
        </button>

        {!!msg && <p style={sty.msg}>{msg}</p>}
      </form>
    </div>
  );
}

/* ---------- styles ---------- */
const sty={
  wrap:{minHeight:'100vh',display:'flex',justifyContent:'center',alignItems:'center',
        background:'url("/bg-init.webp") center/cover',padding:16,color:'#f9d342',
        fontFamily:'serif'},
  card:{background:'rgba(0,0,0,.7)',padding:24,borderRadius:8,width:'100%',maxWidth:360,
        display:'flex',flexDirection:'column',gap:16,textAlign:'center'},
  h:{margin:0,fontSize:26},  sm:{margin:0,fontSize:14,opacity:.85},
  inp:{padding:12,fontSize:16,borderRadius:4,border:'1px solid #555',
       background:'#222',color:'#fff',transition:'opacity .25s'},
  btn:{padding:12,fontSize:16,borderRadius:4,border:'none',
       background:'#f9d342',color:'#000',fontWeight:700,cursor:'pointer',
       transition:'opacity .25s'},
  msg:{fontSize:13,marginTop:8},

  mask:{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',
        backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
        justifyContent:'center',zIndex:100},
  modal:{background:'#111',padding:24,borderRadius:8,maxWidth:330,lineHeight:1.45},
  p:{fontSize:14,margin:'8px 0 18px'},
  ok:{padding:'10px 18px',fontSize:15,border:'none',borderRadius:6,
      background:'#f9d342',color:'#000',cursor:'pointer'}
};
