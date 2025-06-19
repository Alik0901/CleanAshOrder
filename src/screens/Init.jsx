/*  src/screens/Init.jsx  ----------------------------------------------------
 *  Первый (одноразовый) экран регистрации.
 *  • Без «лишнего» GET /player – теперь нет 404 в консоли.
 *  • Авто-модалка с правилами игры показывается сразу (если игрок ещё не создан);
 *    пока пользователь не нажмёт «I understand», форма заблокирована.
 *  ----------------------------------------------------------------------- */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────── конфиг ─────────── */
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const RGX_NAME = /^[A-Za-z ]+$/;

/* ─────────── стили ─────────── */
const CSS = {
  page : {minHeight:'100vh',background:'url("/bg-init.webp") center/cover',
          display:'flex',justifyContent:'center',alignItems:'center',
          padding:16,fontFamily:'serif',color:'#f9d342'},
  card : {width:'100%',maxWidth:380,background:'rgba(0,0,0,.72)',
          padding:24,borderRadius:8,textAlign:'center'},
  h1   : {margin:'0 0 14px',fontSize:26,color:'#d4af37'},
  field: {width:'100%',padding:10,fontSize:16,borderRadius:4,
          border:'1px solid #555',background:'#222',color:'#fff'},
  btn  : {width:'100%',padding:12,fontSize:16,border:'none',
          borderRadius:4,background:'#d4af37',color:'#000',
          cursor:'pointer',marginTop:14,fontWeight:'bold'},
  note : {marginTop:12,fontSize:14},
  modalWrap:{position:'fixed',inset:0,background:'#000a',
             backdropFilter:'blur(5px)',display:'flex',
             justifyContent:'center',alignItems:'center',zIndex:50},
  modal:{background:'#181818',color:'#fff',maxWidth:330,
         padding:24,borderRadius:10,lineHeight:1.5,boxShadow:'0 0 18px #000'},
  mBtn : {marginTop:18,padding:'10px 16px',width:'100%',fontSize:15,
          border:'none',borderRadius:6,cursor:'pointer',
          background:'#d4af37',color:'#000'}
};

export default function Init() {
  const nav      = useNavigate();
  const nameRef  = useRef(null);

  /* telegram / jwt */
  const [tgId,setTgId]       = useState('');
  const [raw,setRaw]         = useState('');

  /* ui state */
  const [name,setName]       = useState('');
  const [status,setStatus]   = useState('Connecting …');
  const [busy,setBusy]       = useState(true);
  const [showInfo,setInfo]   = useState(false);

  const valid = RGX_NAME.test(name.trim());

  /* ── читаем Telegram initData ─────────────────── */
  useEffect(()=>{
    const wa = window.Telegram?.WebApp;
    const uid= wa?.initDataUnsafe?.user?.id;
    if(!wa||!uid){
      setStatus('Telegram Web App unavailable'); return;
    }
    setTgId(String(uid)); setRaw(wa.initData||'');
  },[]);

  /* ── один-единственный POST /init ---------------- */
  useEffect(()=>{
    if(!tgId) return;

    (async()=>{
      try{
        const r = await fetch(`${BACKEND}/api/init`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ tg_id:tgId, name:'', initData:raw })
        });
        const j = await r.json();

        if(r.ok && j.token){
          /* игрок уже существует – переходим в профиль */
          localStorage.setItem('token',j.token);
          nav('/profile'); return;
        }
        /* нового игрока нет → показываем rules-modal */
        setInfo(true);
        setStatus('Enter your name');
      }catch{ setStatus('Network error'); }
      setBusy(false);
    })();
  },[tgId,raw,nav]);

  /* ── submit -------------------------------------- */
  const onSubmit = async e=>{
    e.preventDefault();
    if(!valid || busy || showInfo) return;
    setBusy(true); setStatus('Submitting …');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tg_id:tgId, name:name.trim(), initData:raw })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'init error');
      localStorage.setItem('token',j.token);
      nav('/path');
    }catch(err){ setStatus(err.message||'Network error'); }
    setBusy(false);
  };

  /* ── accept info modal ─────────── */
  const acceptInfo = ()=>{
    setInfo(false);
    setTimeout(()=>nameRef.current?.focus(),80);
  };

  /* ── render ────────────────────── */
  return (
    <>
      {/* rules-modal (показывается один раз до ввода имени) */}
      {showInfo && (
        <div style={CSS.modalWrap}>
          <div style={CSS.modal}>
            <h3 style={{margin:'0 0 12px',color:'#d4af37'}}>Welcome, Seeker!</h3>
            <p style={{fontSize:14}}>
              • Burn <b>exactly&nbsp;0.5&nbsp;TON</b> each rite
              (<i>max 4 TON total</i>).<br/>
              • Gather all <b>8 fragments</b>; some burns give a
              <b> 24 h curse</b> instead.<br/>
              • Re-assemble the hidden phrase to forge a <b>unique final NFT</b>.<br/>
              • The first to submit the phrase becomes the sole Winner.<br/><br/>
              Any other amount sent is lost forever.
            </p>
            <button style={CSS.mBtn} onClick={acceptInfo}>I understand</button>
          </div>
        </div>
      )}

      {/* main form */}
      <div style={CSS.page}>
        <form style={CSS.card} onSubmit={onSubmit}>
          <h1 style={CSS.h1}>Enter the Ash</h1>

          <p style={{margin:'0 0 18px',fontSize:15}}>
            Telegram&nbsp;ID:&nbsp;<b>{tgId||'…'}</b>
          </p>

          <input ref={nameRef} style={CSS.field} disabled={busy||showInfo}
                 placeholder="Your name (A-Z only)"
                 value={name} onChange={e=>setName(e.target.value)} />

          <button style={{...CSS.btn,opacity:valid?1:.45}}
                  disabled={!valid||busy||showInfo}>Save and Continue</button>

          <p style={CSS.note}>{status}</p>
        </form>
      </div>
    </>
  );
}
