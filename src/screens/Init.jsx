// src/screens/Init.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const NAME_RGX = /^[A-Za-z ]+$/;

export default function Init() {
  const nav       = useNavigate();
  const nameRef   = useRef(null);

  /* state ---------------------------------------------------------------- */
  const [tgId,  setTgId] = useState('');
  const [raw,   setRaw ] = useState('');
  const [msg,   setMsg ] = useState('Checking…');  // <-- ПРАВИЛЬНОЕ имя
  const [busy,  setBusy] = useState(true);

  const [name,  setName] = useState('');
  const validName        = NAME_RGX.test(name.trim()) && name.trim().length>0;

  /* info-modal */
  const [showInfo, setShowInfo] = useState(false);
  const [infoSeen, setInfoSeen] = useState(false);

  /* ─── 1. Telegram boot ─── */
  useEffect(()=>{
    const wa  = window.Telegram?.WebApp;
    const uid = wa?.initDataUnsafe?.user?.id;
    if(!wa)   { setMsg('Telegram WebApp API missing'); return; }
    if(!uid)  { setMsg('User ID not found'); return; }

    setTgId(String(uid));
    setRaw(wa.initData || '');
  },[]);

  /* ─── 2. check existing player ─── */
  useEffect(()=>{
    if(!tgId) return;

    (async()=>{
      try{
        const r = await fetch(`${BACKEND}/api/player/${tgId}`);
        if(r.ok){
          const init = await fetch(`${BACKEND}/api/init`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ tg_id:tgId,name:'',initData:raw })
          });
          const j = await init.json();
          localStorage.setItem('token', j.token);
          nav('/profile'); return;
        }
        /* новый игрок */
        setShowInfo(true);
        setMsg('Enter your name');
      }catch{ setMsg('Network error'); }
      setBusy(false);
    })();
  },[tgId,raw,nav]);

  /* если новичок кликнул в инпут раньше времени */
  const handleFocus = ()=>{ if(!infoSeen) setShowInfo(true); };

  /* ─── submit ─── */
  const submit = async e =>{
    e.preventDefault();
    if(!validName || busy) return;
    setBusy(true); setMsg('Submitting…');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tg_id:tgId,name:name.trim(),initData:raw })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'init failed');
      localStorage.setItem('token', j.token);
      nav('/path');
    }catch(e){ setMsg(e.message); }
    setBusy(false);
  };

  /* ─── UI ─── */
  return (
    <div style={st.wrap}>
      {showInfo && (
        <div style={st.modalBG}>
          <div style={st.modal}>
            <h3>Welcome, Seeker!</h3>
            <p style={st.p}>
              • Burn exactly <b>0.5&nbsp;TON</b> each time
              (max&nbsp;4&nbsp;TON total).<br/>
              • Gather all <b>8 fragments</b>; beware of 24 h curses.<br/>
              • Re-assemble the secret phrase to mint a unique final NFT.<br/>
              • First to submit the phrase becomes the sole Winner.<br/><br/>
              Mis-payments are lost forever.
            </p>
            <button style={st.ok}
              onClick={()=>{ setInfoSeen(true); setShowInfo(false); nameRef.current?.focus(); }}>
              I understand
            </button>
          </div>
        </div>
      )}

      <form style={st.card} onSubmit={submit}>
        <h1 style={st.h}>Enter&nbsp;the&nbsp;Ash</h1>
        <p style={st.sm}>Telegram&nbsp;ID: {tgId}</p>

        <input
          ref={nameRef}
          placeholder="Your name (A-Z only)"
          value={name}
          onChange={e=>setName(e.target.value)}
          onFocus={handleFocus}
          disabled={!infoSeen}
          style={{...st.inp,opacity:infoSeen?1:0.4}}
        />

        <button type="submit"
          disabled={!validName || busy || !infoSeen}
          style={{...st.btn,opacity:(!validName||busy||!infoSeen)?0.5:1}}>
          Save and Continue
        </button>

        {!!msg && <p style={st.msg}>{msg}</p>}
      </form>
    </div>
  );
}

/* ─ styles ─ */
const st={
  wrap:{minHeight:'100vh',display:'flex',justifyContent:'center',alignItems:'center',
        background:'url("/bg-init.webp") center/cover',padding:16,color:'#f9d342',
        fontFamily:'serif'},
  card:{background:'rgba(0,0,0,.7)',padding:24,borderRadius:8,width:'100%',maxWidth:360,
        display:'flex',flexDirection:'column',gap:16,textAlign:'center'},
  h:{margin:0,fontSize:26}, sm:{margin:0,fontSize:14,opacity:.85},
  inp:{padding:12,fontSize:16,borderRadius:4,border:'1px solid #555',
       background:'#222',color:'#fff'},
  btn:{padding:12,fontSize:16,borderRadius:4,border:'none',
       background:'#f9d342',color:'#000',fontWeight:700,cursor:'pointer'},
  msg:{fontSize:13,marginTop:8},
  modalBG:{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',
           backdropFilter:'blur(6px)',display:'flex',alignItems:'center',
           justifyContent:'center',zIndex:100},
  modal:{background:'#181818',padding:24,borderRadius:8,maxWidth:320},
  p:{fontSize:14,lineHeight:1.45,margin:'8px 0 16px'}, ok:{...this?.btn}
};
