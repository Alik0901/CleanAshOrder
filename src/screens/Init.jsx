// src/screens/Init.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const NAME_RE = /^[A-Za-z ]+$/;

export default function Init() {
  const nav = useNavigate();

  /* ───────────── modal “rules & risks” ───────────── */
  const [showRules, setShowRules] = useState(true);
  const [agree,     setAgree]     = useState(false);

  /* ───────────── telegram / auth state ───────────── */
  const [tgId,  setTgId]   = useState('');
  const [raw,   setRaw]    = useState('');
  const [busy,  setBusy]   = useState(false);
  const [stat,  setStat]   = useState('');   // статус/ошибка

  /* ───────────── reg-form state ───────────── */
  const [name, setName]    = useState('');
  const nameOK             = NAME_RE.test(name.trim());

  /* intro-sound (один раз) */
  useEffect(()=>{ new Audio('/sounds/start.mp3').play().catch(()=>{}); },[]);

  /* считываем initData после закрытия правил */
  useEffect(()=>{
    if (showRules) return;         // пока правила не приняты — ничего не делаем

    const wa   = window.Telegram?.WebApp;
    const raw0 = wa?.initData        || '';
    const id0  = wa?.initDataUnsafe?.user?.id;

    if (!wa)    return setStat('❌ Telegram.WebApp not found');
    if (!raw0)  return setStat('❌ initData missing');
    if (!id0)   return setStat('❌ User ID not found');

    setTgId(String(id0));
    setRaw(raw0);
    setStat('Checking existing profile…');
  },[showRules]);

  /* если tgId получен — проверяем/создаём профиль */
  useEffect(()=>{
    if (!tgId) return;

    (async ()=>{
      try{
        /* GET player */
        const r = await fetch(`${BACKEND}/api/player/${tgId}`);
        if (r.ok){
          /* существует — обычный init, токен, переход */
          const r2 = await fetch(`${BACKEND}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ tg_id:tgId, name:'', initData: raw })
          });
          const j2 = await r2.json();
          if (r2.ok && j2.token){
            localStorage.setItem('token', j2.token);
            return nav('/profile');
          }
        }
        setStat('');   // новый игрок → показываем форму
      }catch{
        setStat('⚠️ Network error');
      }
    })();
  },[tgId,raw,nav]);

  /* submit name */
  const submit = async e=>{
    e.preventDefault();
    if (!nameOK) return setStat('❗ Name — A-Z letters and spaces only');
    setBusy(true); setStat('⏳ Submitting…');
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tg_id:tgId, name:name.trim(), initData: raw })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'Error');
      j.token && localStorage.setItem('token', j.token);
      nav('/path');
    }catch(e){
      setStat(`⚠️ ${e.message}`); setBusy(false);
    }
  };

  /* ───────────── JSX ───────────── */
  return (
    <div style={ST.bg}>
      {/* ---------- RULES MODAL ---------- */}
      {showRules && (
        <div style={ST.back}>
          <div style={ST.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{margin:'0 0 10px'}}>Welcome, Seeker</h2>
            <p style={ST.text}>
              • Every <b>burn</b> costs <b>0.5 TON</b> and forges either a fragment or a <b>24-hour&nbsp;curse</b>.<br/>
              • You will <b>never spend more than 4 TON</b> in total — eight burns is all it takes.<br/>
              • Collect the <b>8 unique fragments</b> to reveal a hidden incantation.<br/>
              • Enter that incantation to forge a <b>final NFT</b>; its look depends on your own path.<br/>
              • The first to enter the phrase becomes the winner.<br/>
              • Payments are <b>irreversible</b> — send exactly <b>0.5 TON</b> each time.<br/><br/>
              <i>Tread carefully, and may the ashes guide you.</i>
            </p>

            <label style={ST.check}>
              <input type="checkbox" checked={agree}
                     onChange={e=>setAgree(e.target.checked)}/> I understand the rules
            </label>

            <button
              disabled={!agree}
              onClick={()=>setShowRules(false)}
              style={{...ST.mBtn,background:agree?'#d4af37':'#666'}}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ---------- REG-FORM ---------- */}
      {!showRules && (
        <form onSubmit={submit} style={ST.card}>
          <h1 style={{margin:0,color:'#d4af37'}}>Order of Ash</h1>
          <p style={{color:'#ccc',margin:'6px 0 24px'}}>Enter your name to begin</p>

          <input
            style={ST.input}
            placeholder="Your name (A–Z only)"
            value={name}
            onChange={e=>setName(e.target.value)}
            disabled={busy}
          />

          <button
            disabled={!nameOK||busy}
            style={{...ST.btn,opacity:nameOK&&!busy?1:.5}}>
            {busy?'Please wait…':'Save and Continue'}
          </button>

          {stat && <p style={ST.status}>{stat}</p>}
        </form>
      )}
    </div>
  );
}

/* ---------- styles ---------- */
const ST = {
  bg:{minHeight:'100vh',background:'url("/bg-init.webp") center/cover',
      display:'flex',justifyContent:'center',alignItems:'center',
      fontFamily:'Arial, sans-serif',color:'#f9d342'},
  card:{width:'90%',maxWidth:360,background:'rgba(0,0,0,.7)',
        padding:24,borderRadius:8,textAlign:'center'},
  input:{width:'100%',padding:10,fontSize:16,borderRadius:4,
         background:'#222',color:'#fff',border:'1px solid #555',marginBottom:16},
  btn  :{width:'100%',padding:12,fontSize:16,border:'none',
         borderRadius:4,background:'#f9d342',color:'#000',fontWeight:'bold',
         cursor:'pointer'},
  status:{marginTop:12,fontSize:14},

  /* modal */
  back :{position:'fixed',inset:0,background:'#000a',
         backdropFilter:'blur(4px)',display:'flex',
         justifyContent:'center',alignItems:'center',zIndex:100},
  modal:{width:'90%',maxWidth:360,background:'#181818',color:'#fff',
         padding:20,borderRadius:8,boxShadow:'0 0 16px #000'},
  text :{fontSize:14,lineHeight:1.4,textAlign:'left'},
  check:{display:'block',fontSize:14,margin:'12px 0'},
  mBtn :{width:'100%',padding:10,border:'none',borderRadius:6,color:'#000',cursor:'pointer'}
};
