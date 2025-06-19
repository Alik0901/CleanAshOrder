// src/screens/Init.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const NAME_REGEX  = /^[A-Za-z ]+$/;
const RULES_KEY   = 'oa_rules_v1';               // смените версию, чтобы показать снова

export default function Init() {
  const nav = useNavigate();

  /* ---------- telegram / auth state ---------- */
  const [tgId, setTgId]         = useState('');
  const [initDataRaw, setRaw]   = useState('');
  const [status, setStatus]     = useState('Checking Telegram…');
  const [checking, setChecking] = useState(true);

  /* ---------- form state ---------- */
  const [name, setName] = useState('');
  const validName       = name.trim().length>0 && NAME_REGEX.test(name);

  /* ---------- rules modal ---------- */
  const [showRules, setShowRules] = useState(false);
  const [agree,     setAgree]     = useState(false);

  /* play intro & decide whether to show rules */
  useEffect(()=>{
    new Audio('/sounds/start.mp3').play().catch(()=>{});
    if(!localStorage.getItem(RULES_KEY)) setShowRules(true);
  },[]);

  /* read Telegram initData once */
  useEffect(()=>{
    const wa   = window.Telegram?.WebApp;
    const raw  = wa?.initData || '';
    const id   = wa?.initDataUnsafe?.user?.id;

    setRaw(raw);
    if(!wa)         return setStatus('❌ Telegram.WebApp not found');
    if(!raw)        return setStatus('❌ initData missing');
    if(!id)         return setStatus('❌ User ID not found');

    setTgId(String(id));
  },[]);

  /* if tgId exists — check player */
  useEffect(()=>{
    if(!tgId||showRules) return;    // пока правила открыты — ничего не проверяем

    (async()=>{
      setStatus('Checking existing user…');
      try{
        const res = await fetch(`${BACKEND_URL}/api/player/${tgId}`);
        if(res.ok){
          /* user exists: POST /init (получить токен) */
          const r2 = await fetch(`${BACKEND_URL}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ tg_id: tgId, name:'', initData: initDataRaw })
          });
          const j2 = await r2.json();
          if(r2.ok && j2.token){
            localStorage.setItem('token',j2.token);
            return nav('/profile');
          }
        }
        setStatus('✅ Ready to register');
        setChecking(false);
      }catch{
        setStatus('⚠️ Network error, please register');
        setChecking(false);
      }
    })();
  },[tgId,initDataRaw,nav,showRules]);

  /* submit name */
  const handleSubmit = async e=>{
    e.preventDefault();
    if(!validName) return setStatus('❗ Name must contain A–Z letters only');
    setStatus('⏳ Submitting…');
    try{
      const res = await fetch(`${BACKEND_URL}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tg_id:tgId, name:name.trim(), initData: initDataRaw })
      });
      const data = await res.json();
      if(!res.ok)  return setStatus(`⚠️ ${data.error||'Unknown error'}`);
      data.token && localStorage.setItem('token',data.token);
      nav('/path');
    }catch{ setStatus('⚠️ Network error'); }
  };

  /* ---------- JSX ---------- */
  return (
    <div style={ST.bg}>
      {/* ===== RULES MODAL (поверх всего) ===== */}
      {showRules && (
        <div style={ST.back}>
          <div style={ST.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{margin:'0 0 10px'}}>Welcome, Seeker</h2>
            <p style={ST.text}>
              • Every <b>burn</b> costs <b>0.5&nbsp;TON</b> and forges either a fragment or a <b>24-hour curse</b>.<br/>
              • You will <b>never spend more than 4&nbsp;TON</b> in total — eight burns is all it takes.<br/>
              • Gather the <b>8 unique fragments</b> to reveal a hidden incantation.<br/>
              • Enter that incantation to forge a <b>final NFT</b>; its look depends on your own path.<br/>
              • The first to enter the phrase becomes the winner.<br/>
              • Payments are <b>irreversible</b> — send exactly <b>0.5&nbsp;TON</b> each time.<br/><br/>
              <i>Tread carefully, and may the ashes guide you.</i>
            </p>

            <label style={ST.check}>
              <input type="checkbox" checked={agree}
                     onChange={e=>setAgree(e.target.checked)}/>&nbsp;
              I understand the rules and risks
            </label>

            <button
              disabled={!agree}
              onClick={()=>{localStorage.setItem(RULES_KEY,'1');setShowRules(false);}}
              style={{...ST.modalBtn,background:agree?'#d4af37':'#666'}}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ===== FORM / STATUS ===== */}
      {!showRules && (
        checking ? (
          <p style={ST.status}>{status}</p>
        ) : (
          <form onSubmit={handleSubmit} style={ST.card}>
            <h1 style={{margin:0,color:'#d4af37'}}>Order of Ash</h1>
            <p style={{color:'#ccc',margin:'6px 0 24px'}}>Enter your name to begin</p>

            <input
              style={ST.input}
              placeholder="Your name (A–Z only)"
              value={name}
              onChange={e=>setName(e.target.value)}
            />

            <button
              type="submit"
              disabled={!validName}
              style={{...ST.btn,opacity:validName?1:.5}}>
              Save and Continue
            </button>

            {status && <p style={ST.status}>{status}</p>}
          </form>
        )
      )}
    </div>
  );
}

/* ---------- styles ---------- */
const ST = {
  bg   :{minHeight:'100vh',background:'url("/bg-init.webp") center/cover',
         display:'flex',justifyContent:'center',alignItems:'center',
         fontFamily:'Arial, sans-serif',color:'#f9d342'},
  card :{width:'90%',maxWidth:360,background:'rgba(0,0,0,.7)',
         padding:24,borderRadius:8,textAlign:'center'},
  input:{width:'100%',padding:10,fontSize:16,borderRadius:4,
         border:'1px solid #555',background:'#222',color:'#fff',marginBottom:16},
  btn  :{width:'100%',padding:12,fontSize:16,borderRadius:4,border:'none',
         background:'#f9d342',color:'#000',fontWeight:'bold',cursor:'pointer'},
  status:{textAlign:'center',fontSize:14,marginTop:12},

  /* modal */
  back :{position:'fixed',inset:0,background:'#000a',
         backdropFilter:'blur(4px)',display:'flex',
         justifyContent:'center',alignItems:'center',zIndex:100},
  modal:{width:'90%',maxWidth:360,background:'#181818',color:'#fff',
         padding:20,borderRadius:8,boxShadow:'0 0 16px #000'},
  text :{textAlign:'left',lineHeight:1.4,fontSize:14},
  check:{display:'block',fontSize:14,margin:'12px 0'},
  modalBtn:{width:'100%',padding:10,border:'none',borderRadius:6,color:'#000'}
};
