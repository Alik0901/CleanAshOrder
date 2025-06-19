/*  src/screens/Init.jsx  ----------------------------------------------------
 *  Регистрация нового игрока.
 *  • Если игрок в БД есть – мгновенно получаем JWT и прыгаем к /profile.
 *  • Если игрока нет – показываем информ-модалку ► после «I understand»
 *    открывается поле имени ► POST /init ► /path.
 *  • Нет «саморегистрации» до подтверждения правил.
 *  ----------------------------------------------------------------------- */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------- конфигурация ----------------------------------------------- */
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const NAME_RE = /^[A-Za-z ]+$/;

/* ---------- css-in-js --------------------------------------------------- */
const C = {
  page : {minHeight:'100vh',background:'url("/bg-init.webp") center/cover',
          display:'flex',justifyContent:'center',alignItems:'center',
          padding:16,color:'#f9d342',fontFamily:'serif'},
  card : {width:'100%',maxWidth:380,background:'rgba(0,0,0,.72)',
          padding:24,borderRadius:8,textAlign:'center'},
  h1   : {margin:'0 0 14px',fontSize:26,color:'#d4af37'},
  field: {width:'100%',padding:10,fontSize:16,borderRadius:4,
          border:'1px solid #555',background:'#222',color:'#fff'},
  btn  : {width:'100%',padding:12,fontSize:16,border:'none',borderRadius:4,
          background:'#d4af37',color:'#000',cursor:'pointer',marginTop:14,
          fontWeight:'bold',transition:'opacity .2s'},
  note : {marginTop:12,fontSize:14,minHeight:20},

  modalWrap:{position:'fixed',inset:0,background:'#000a',backdropFilter:'blur(5px)',
             display:'flex',justifyContent:'center',alignItems:'center',zIndex:50},
  modal:{background:'#181818',color:'#fff',maxWidth:330,padding:24,
         borderRadius:10,lineHeight:1.5,boxShadow:'0 0 18px #000'},
  mBtn : {...this?.btn, width:'100%',marginTop:18}
};

/* ---------- компонент --------------------------------------------------- */
export default function Init() {
  const nav = useNavigate();
  const nameRef = useRef(null);

  /* telegram-данные */
  const [tgId,setTgId]   = useState('');
  const [raw,setRaw]     = useState('');

  /* ui-состояния */
  const [status,setStatus] = useState('Connecting …');
  const [infoOpen,setInfo] = useState(false);      // информационная модалка
  const [busy,setBusy]     = useState(true);       // сетевые ожидания
  const [name,setName]     = useState('');

  const nameValid = NAME_RE.test(name.trim());

  /* ── 1. читаем initData / userId ─────────────────────────── */
  useEffect(()=>{
    const wa = window.Telegram?.WebApp;
    const u  = wa?.initDataUnsafe?.user;
    if(!u?.id){ setStatus('Telegram WebApp unavailable'); return; }
    setTgId(String(u.id)); setRaw(wa.initData||'');
  },[]);

  /* ── 2. проверяем, существует ли игрок ───────────────────── */
  useEffect(()=>{
    if(!tgId) return;
    (async()=>{
      try{
        const r = await fetch(`${BACKEND}/api/player/${tgId}`);
        if(r.ok){
          /* игрок есть → берём JWT через /init (name пустой) */
          const j = await fetch(`${BACKEND}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ tg_id:tgId, name:'', initData:raw })
          }).then(x=>x.json());
          if(j.token) localStorage.setItem('token',j.token);
          nav('/profile'); return;
        }
        /* 404 → новый пользователь: показываем правила */
        setInfo(true);
        setStatus('Enter your name');
      }catch{ setStatus('Network error'); }
      setBusy(false);
    })();
  },[tgId,raw,nav]);

  /* ── 3. submit регистрации ──────────────────────────────── */
  const submit = async e=>{
    e.preventDefault();
    if(!nameValid||busy||infoOpen) return;
    setBusy(true); setStatus('Submitting …');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tg_id:tgId, name:name.trim(), initData:raw })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'Init error');
      localStorage.setItem('token',j.token);
      nav('/path');
    }catch(err){ setStatus(err.message||'Network error'); }
    setBusy(false);
  };

  /* ── инфо-модалка закрылся ──────────────────────────────── */
  const closeInfo = ()=>{
    setInfo(false);
    setTimeout(()=>nameRef.current?.focus(),100);
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <>
      {/* modal with rules */}
      {infoOpen && (
        <div style={C.modalWrap}>
          <div style={C.modal}>
            <h3 style={{margin:'0 0 12px',color:'#d4af37'}}>Welcome, Seeker!</h3>
            <p style={{fontSize:14}}>
              • Burn <b>exactly&nbsp;0.5&nbsp;TON</b> each rite
              (max 4&nbsp;TON total).<br/>
              • Collect all <b>8&nbsp;fragments</b>; some burns give a
              <b> 24&nbsp;h curse</b> instead.<br/>
              • Re-assemble the hidden phrase to forge a
              <b> unique final&nbsp;NFT</b>.<br/>
              • The first to submit the phrase becomes the sole&nbsp;Winner.<br/><br/>
              Any other amount sent is lost forever.
            </p>
            <button style={C.mBtn} onClick={closeInfo}>I understand</button>
          </div>
        </div>
      )}

      {/* form */}
      <div style={C.page}>
        <form style={C.card} onSubmit={submit}>
          <h1 style={C.h1}>Enter&nbsp;the&nbsp;Ash</h1>

          <p style={{margin:'0 0 18px',fontSize:15}}>
            Telegram&nbsp;ID:&nbsp;<b>{tgId||'…'}</b>
          </p>

          <input ref={nameRef} style={C.field}
                 disabled={busy||infoOpen}
                 value={name}
                 onChange={e=>setName(e.target.value)}
                 placeholder="Your name (A-Z only)"/>

          <button style={{...C.btn,opacity:nameValid?1:.45}}
                  disabled={!nameValid||busy||infoOpen}>
            Save and Continue
          </button>

          <p style={C.note}>{status}</p>
        </form>
      </div>
    </>
  );
}
