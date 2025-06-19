/* src/screens/Init.jsx – финальная версия */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL ??
                'https://ash-backend-production.up.railway.app';
const RGX = /^[A-Za-z ]+$/;

export default function Init() {
  const nav      = useNavigate();
  const inputRef = useRef(null);

  /* basic state */
  const [tgId, setTgId]   = useState('');
  const [raw,  setRaw]    = useState('');
  const [note, setNote]   = useState('Checking Telegram …');
  const [busy, setBusy]   = useState(true);

  /* form */
  const [name, setName]   = useState('');
  const okName            = RGX.test(name.trim()) && name.trim().length>0;

  /* info-modal */
  const [showInfo, setInfo] = useState(false);

  /* ── 1. Telegram bootstrap ─────────────────────────────────────────── */
  useEffect(()=>{
    const wa  = window.Telegram?.WebApp;
    const uid = wa?.initDataUnsafe?.user?.id;
    if(!wa){ setNote('Telegram WebApp unavailable'); return; }
    if(!uid){ setNote('Unable to read Telegram ID'); return; }
    setTgId(String(uid));            // триггерит следующий useEffect
    setRaw(wa.initData || '');
  },[]);

  /* ── 2. backend check / registration flow ──────────────────────────── */
  useEffect(()=>{
    if(!tgId) return;

    const INFO_KEY = `aoa_info_seen_${tgId}`;

    (async()=>{
      try{
        const get = await fetch(`${BACKEND}/api/player/${tgId}`);
        if(get.ok){                                     // игрок найден
          const tokenRes = await fetch(`${BACKEND}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body: JSON.stringify({tg_id:tgId,name:'',initData:raw})
          });
          const j = await tokenRes.json();
          if(j.token) localStorage.setItem('token', j.token);
          nav('/profile'); return;
        }
        /* 404 → новый пользователь */
        if(!sessionStorage.getItem(INFO_KEY)) setInfo(true);
        setBusy(false); setNote('Enter your name');
      }catch{
        setBusy(false); setNote('Network error – try again');
      }
    })();
  },[tgId,raw,nav]);

  /* ── 3. submit -------------------------------------------------------- */
  const submit = async e =>{
    e.preventDefault();
    if(busy||showInfo||!okName) return;
    setBusy(true); setNote('Submitting …');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({tg_id:tgId,name:name.trim(),initData:raw})
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'init error');
      localStorage.setItem('token', j.token);
      nav('/path');
    }catch(e){ setNote(e.message); }
    setBusy(false);
  };

  /* ── ui helpers ------------------------------------------------------- */
  const INFO_KEY = `aoa_info_seen_${tgId}`;
  const confirmInfo = ()=>{
    sessionStorage.setItem(INFO_KEY,'1');
    setInfo(false);
    setTimeout(()=>inputRef.current?.focus(),50);
  };

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div style={st.wrap}>
      {/* info-modal */}
      {showInfo && (
        <div style={st.mask}>
          <div style={st.modal}>
            <h3 style={st.h3}>Welcome, Seeker!</h3>
            <p style={st.p}>
              • Burn <b>exactly 0.5 TON</b> every time (max 4 TON in total).<br/>
              • Collect <b>8 Ash fragments</b> – expect <b>24 h curses</b>.<br/>
              • Five real pieces &amp; four curses are dealt at random.<br/>
              • Re-assemble the hidden phrase to forge a <b>unique final NFT</b>.<br/>
              • First who submits the phrase becomes the <b>sole Winner</b>.<br/><br/>
              Mis-payments are unrecoverable – double-check the amount.
            </p>
            <button style={st.ok} onClick={confirmInfo}>I understand</button>
          </div>
        </div>
      )}

      {/* registration card */}
      <form style={st.card} onSubmit={submit}>
        <h1 style={st.h1}>Enter&nbsp;the&nbsp;Ash</h1>
        <p style={st.sm}>Telegram&nbsp;ID: {tgId}</p>

        <input ref={inputRef}
          style={{...st.inp,opacity:showInfo?.5:1}}
          placeholder="Your name (A–Z only)"
          value={name}
          disabled={busy||showInfo}
          onChange={e=>setName(e.target.value)}
        />

        <button type="submit"
          style={{...st.btn,opacity:(okName&&!busy&&!showInfo)?1:.45}}
          disabled={!okName||busy||showInfo}>
          Save and Continue
        </button>

        {note && <p style={st.note}>{note}</p>}
      </form>
    </div>
  );
}

/* ── styles ───────────────────────────────────────────────────────────── */
const st={
  wrap:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
        background:'url("/bg-init.webp") center/cover',padding:16,color:'#f9d342',
        fontFamily:'serif'},
  card:{background:'rgba(0,0,0,.72)',padding:24,borderRadius:8,
        width:'100%',maxWidth:360,display:'flex',flexDirection:'column',gap:16,
        textAlign:'center'},
  h1:{margin:0,fontSize:26}, sm:{margin:0,fontSize:14,opacity:.85},
  inp:{padding:12,fontSize:16,borderRadius:4,border:'1px solid #555',
       background:'#222',color:'#fff',transition:'opacity .25s'},
  btn:{padding:12,fontSize:16,borderRadius:4,border:'none',
       background:'#f9d342',color:'#000',fontWeight:700,cursor:'pointer',
       transition:'opacity .25s'},
  note:{fontSize:13,marginTop:8},

  mask:{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',
        backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
        justifyContent:'center',zIndex:100},
  modal:{background:'#111',padding:24,borderRadius:8,maxWidth:330,lineHeight:1.42},
  h3:{margin:'0 0 8px'}, p:{fontSize:14}, ok:{marginTop:12,padding:'10px 18px',
      fontSize:15,border:'none',borderRadius:6,background:'#f9d342',color:'#000',
      cursor:'pointer'}
};
