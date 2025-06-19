import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------------- env ---------------- */

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const NAME_RE = /^[A-Za-z ]+$/;

/* ---------------- styles -------------- */

const S = {
  page : { position:'relative',minHeight:'100vh',
           background:'url("/bg-init.webp") center/cover',
           display:'flex',justifyContent:'center',alignItems:'center',
           fontFamily:'serif',padding:16,color:'#d4af37' },

  box  : { width:'100%',maxWidth:380,background:'#000a',padding:24,
           borderRadius:8,textAlign:'center',backdropFilter:'blur(4px)' },

  h1   : { margin:0,fontSize:26 },
  info : { fontSize:14,opacity:.85,margin:'8px 0 20px' },
  input: { width:'100%',padding:10,fontSize:16,borderRadius:4,
           border:'1px solid #555',background:'#222',color:'#fff',marginBottom:20 },

  btn  : { width:'100%',padding:12,fontSize:16,borderRadius:4,border:'none',
           background:'#d4af37',color:'#000',cursor:'pointer',transition:'opacity .2s' },

  status:{ marginTop:14,fontSize:14 },

  /* modal */
  wrap : { position:'fixed',inset:0,background:'#0009',backdropFilter:'blur(6px)',
           display:'flex',justifyContent:'center',alignItems:'center',zIndex:40 },

  modal: { background:'#181818',padding:24,borderRadius:10,maxWidth:340,
           color:'#fff',lineHeight:1.45,textAlign:'left',boxShadow:'0 0 18px #000' },

  mBtn : { display:'block',width:'100%',marginTop:18,padding:10,
           fontSize:15,border:'none',borderRadius:6,cursor:'pointer',
           background:'#d4af37',color:'#000' }
};

/* ---------------- component ----------- */

export default function Init() {
  const nav = useNavigate();

  /* Telegram & JWT -------------------------------- */
  const [tgId, setTgId]       = useState('');
  const [initRaw,setInitRaw]  = useState('');
  const [checking,setCheck]   = useState(true);
  const [status,setStatus]    = useState('Checking…');

  /* form ----------------------------------------- */
  const [name,setName]        = useState('');
  const validName             = NAME_RE.test(name.trim()) && name.trim().length>0;

  /* rules modal ---------------------------------- */
  const [rulesOpen,setRules]  = useState(false);
  const [rulesOk,setRulesOk]  = useState(false);

  /* ------------- mount: read TG data ------------ */
  useEffect(()=>{
    const wa = window.Telegram?.WebApp;
    const raw = wa?.initData || '';
    const uid = wa?.initDataUnsafe?.user?.id;
    if (!raw || !uid){ setStatus('❌ Telegram init error'); return; }

    setTgId(String(uid)); setInitRaw(raw);
  },[]);

  /* ------------- check existing player ---------- */
  useEffect(()=>{
    if (!tgId) return;

    (async()=>{
      try{
        const r = await fetch(`${BACKEND}/api/player/${tgId}`);
        if (r.ok){
          /* есть игрок → получаем JWT и уходим */
          const r2 = await fetch(`${BACKEND}/api/init`,{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({tg_id:tgId,name:'',initData:initRaw})
          });
          const j2 = await r2.json();
          if (r2.ok && j2.token){
            localStorage.setItem('token',j2.token);
            nav('/profile'); return;
          }
        }
        /* нет игрока  */
        setCheck(false); setStatus('');
      }catch{ setStatus('Network error'); setCheck(false);}
    })();
  },[tgId,initRaw,nav]);

  /* ------------- submit ------------------------- */
  const submit = async e =>{
    e.preventDefault();
    if (!validName || !rulesOk) return;
    try{
      const r = await fetch(`${BACKEND}/api/init`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tg_id:tgId,name:name.trim(),initData:initRaw})
      });
      const j = await r.json();
      if (!r.ok){ setStatus(j.error||'error'); return; }
      if (j.token) localStorage.setItem('token', j.token);
      nav('/path');
    }catch{ setStatus('Network error'); }
  };

  /* ------------- ui ---------------------------- */
  if (checking) return <div style={S.page}><p style={S.status}>{status}</p></div>;

  return (
    <div style={S.page}>
      <form style={S.box} onSubmit={submit}>
        <h1 style={S.h1}>Enter the Ash</h1>
        <p style={S.info}>Telegram&nbsp;ID:&nbsp;<b>{tgId}</b></p>

        <input style={S.input} placeholder="Your name (A-Z only)"
               value={name} onChange={e=>setName(e.target.value)}
               onFocus={()=>!rulesOk && setRules(true)} />

        <button style={{...S.btn,opacity:(validName&&rulesOk)?1:0.5}}
                disabled={!validName||!rulesOk}>Save and Continue</button>

        {status && <p style={S.status}>{status}</p>}
      </form>

      {/* ---------- rules modal ---------- */}
      {rulesOpen && (
        <div style={S.wrap}>
          <div style={S.modal}>
            <h3 style={{marginTop:0,marginBottom:12}}>Welcome, Seeker.</h3>
            <p>
              • Burn <b>exactly 0.5 TON</b> each time. Over 4 TON total will never be required.<br/>
              • With every burn you either gain a <b>Fragment</b> of the Ash
              or suffer a <b>24-hour curse</b>.<br/>
              •  Earn all eight Fragments and decipher the hidden sentence.<br/>
              •  The first to enter the sentence forges a unique, player-shaped&nbsp;NFT — and wins.<br/>
            </p>
            <button style={S.mBtn} onClick={()=>{setRules(false);setRulesOk(true);}}>
              I have read &amp; understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
