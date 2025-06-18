/*  Path.jsx – “The Path Begins”  ------------------------------------------- */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------- config & helpers --------------------------------------------- */

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const DEV       = import.meta.env.DEV;
const TG        = window.Telegram?.WebApp;
const PLATFORM  = TG?.platform ?? 'unknown';               // android | ios …

/* номер → файл; добавляйте новые по мере необходимости */
const FRAG_IMG = {
  1: 'fragment_1_the_whisper.webp',
  2: 'fragment_2_the_number.webp',
  3: 'fragment_3_the_language.webp',
  4: 'fragment_4_the_mirror.webp',
  5: 'fragment_5_the_chain.webp',
  6: 'fragment_6_the_hour.webp',
  7: 'fragment_7_the_mark.webp',
  8: 'fragment_8_the_gate.webp',
};

/* ---------- inline styles ------------------------------------------------- */

const S = {
  page : { position:'relative',minHeight:'100vh',
           background:'url("/bg-path.webp") center/cover',
           display:'flex',justifyContent:'center',alignItems:'center',
           padding:'32px 12px' },
  card : { width:'100%',maxWidth:380,textAlign:'center',color:'#d4af37' },
  h2   : { margin:'0 0 8px',fontSize:28,fontWeight:700 },
  sub  : { margin:'0 0 24px',fontSize:16 },

  btn  : { display:'block',width:'100%',padding:'12px',fontSize:16,
           borderRadius:6,border:'none',margin:'12px 0',cursor:'pointer',
           transition:'opacity .2s' },
  prim : { background:'#d4af37',color:'#000' },
  sec  : { background:'transparent',border:'1px solid #d4af37',color:'#d4af37' },

  stat : { fontSize:15,minHeight:22,margin:'12px 0' },
  ok   : { color:'#6BCB77' },       bad:{ color:'#FF6B6B' },

  /* modal */
  modalWrap : { position:'fixed',inset:0,background:'#0008',
                backdropFilter:'blur(6px)',display:'flex',
                alignItems:'center',justifyContent:'center',zIndex:50 },
  modal     : { maxWidth:320,background:'#181818',color:'#fff',
                padding:'20px',borderRadius:8,textAlign:'center',
                lineHeight:1.4,boxShadow:'0 0 16px #000' },
  mBtn      : { marginTop:18,padding:'10px 16px',width:'100%',fontSize:15,
                border:'none',borderRadius:6,cursor:'pointer' },

  /* fragment animation */
  frag : { position:'fixed',left:'50%',top:'50%',width:260,height:260,
           transform:'translate(-50%,-50%)',zIndex:30,
           animation:'showHide 1.3s forwards' },

  /* dev overlay */
  dbg  : { position:'fixed',left:0,right:0,bottom:0,maxHeight:'40vh',
           background:'#000c',color:'#5CFF5C',fontSize:11,
           overflowY:'auto',whiteSpace:'pre-wrap',padding:'4px 6px',
           zIndex:9999 }
};

/* keyframes через «intrinsic CSS» */
const styleTag = (
  <style>{`
    @keyframes showHide{
      0%   {opacity:0;transform:translate(-50%,-50%) scale(.3);}
      15%  {opacity:1;transform:translate(-50%,-50%) scale(1);}
      60%  {opacity:1;transform:translate(-50%,-50%) scale(1);}
      100% {opacity:0;transform:translate(-50%,300%) scale(.3);}
    }
  `}</style>
);

/* ---------- DEV overlay component --------------------------------------- */

function Debug() {
  const [log,setLog] = useState([]);
  useEffect(()=>{
    const h = (...a)=> setLog(l=>[...l,a.join(' ')]);
    TG?.onEvent?.('viewport_changed',h);
    return()=> TG?.offEvent?.('viewport_changed',h);
  },[]);
  return <div style={S.dbg}>{log.join('\n')}</div>;
}

/* ---------- main component ---------------------------------------------- */

export default function Path() {
  const nav = useNavigate();

  /* profile */
  const [tgId,setTgId]       = useState('');
  const [last,setLast]       = useState(null);
  const [curse,setCurse]     = useState(null);
  const [cd,setCd]           = useState(0);

  /* payment */
  const [busy,setBusy]       = useState(false);
  const [wait,setWait]       = useState(false);
  const [inv,setInv]         = useState(null);
  const [hub,setHub]         = useState('');
  const [ton,setTon]         = useState('');
  const [msg,setMsg]         = useState('');

  /* visual */
  const [fragImg,setFragImg] = useState('');
  const [showModal,setModal] = useState(false);

  const pollRef   = useRef(null);
  const COOLDOWN  = 120;

  /* ---------- utils ---------- */

  const leftSec = t => Math.max(0,
    COOLDOWN - Math.floor((Date.now()-new Date(t).getTime())/1000));
  const fmt = s => `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const openExternal = url =>
    TG?.openLink?.(url,{try_instant_view:false}) || window.open(url,'_blank');

  const openWallet = () =>{
    if (PLATFORM==='android' && ton) openExternal(ton);
    else if (hub)                    openExternal(hub);
  };

  /* ---------- mount ------------------------------------------------------ */

  useEffect(()=>{
    const u = TG?.initDataUnsafe?.user;
    if (!u?.id){ nav('/init'); return; }
    setTgId(String(u.id));
    if (!localStorage.getItem('token')){ nav('/init'); return; }

    /* unfinished invoice */
    const rec = localStorage.getItem('invoiceId');
    if (rec){
      setInv(rec);
      setHub(localStorage.getItem('paymentUrl')||'');
      setTon(localStorage.getItem('tonspaceUrl')||'');
      setWait(true);
      pollRef.current = setInterval(()=>check(rec),5_000);
    }

    /* load player */
    (async()=>{
      const r = await fetch(`${BACKEND}/api/player/${u.id}`);
      const j = await r.json();
      setLast(j.last_burn);
      if (j.curse_expires && new Date(j.curse_expires)>new Date())
        setCurse(j.curse_expires);
      setCd(leftSec(j.last_burn));
    })();

    const t = setInterval(()=>setCd(s=>s>0?s-1:0),1000);
    return()=> clearInterval(t);
  },[nav]);

  /* ---------- invoice flow ---------------------------------------------- */

  const confirmBurn = ()=> setModal(true);

  const burn = async()=> {
    setModal(false); setBusy(true); setMsg('');
    try{
      const r = await fetch(`${BACKEND}/api/burn-invoice`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({tg_id: tgId})
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

      setInv(j.invoiceId); setHub(j.paymentUrl); setTon(j.tonspaceUrl);
      localStorage.setItem('invoiceId',j.invoiceId);
      localStorage.setItem('paymentUrl', j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      openWallet();                   // сразу
      setBusy(false); setWait(true);
      pollRef.current = setInterval(()=>check(j.invoiceId),5_000);
    }catch(e){ setMsg(e.message); setBusy(false);}
  };

  const check = async id =>{
    try{
      const r = await fetch(`${BACKEND}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'status err');
      if (j.paid){
        clearInterval(pollRef.current);
        setWait(false); setBusy(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if (j.cursed){
          setCurse(j.curse_expires);
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`);
        }else{
          setCurse(null); setLast(j.lastBurn); setCd(COOLDOWN);
          const img = `/fragments/${FRAG_IMG[j.newFragment] ?? FRAG_IMG[1]}`;
          setFragImg(img);          // запускаем анимацию
          setTimeout(()=> setFragImg(''),1300);
          setMsg(`🔥 Fragment #${j.newFragment} received!`);
        }
      }
    }catch(e){ setMsg(e.message); clearInterval(pollRef.current); setWait(false);}
  };

  /* ---------- render ----------------------------------------------------- */

  const disabled = busy||wait||cd>0||Boolean(curse);
  const mainTxt  = busy ? 'Creating invoice…'
                 : wait ? 'Waiting for payment…'
                        : '🔥 Burn Yourself for 0.5 TON';

  return (
    <>
      {styleTag}

      {/* modal warning ---------------------------------------------------- */}
      {showModal && (
        <div style={S.modalWrap} onClick={()=>setModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 10px'}}>⚠️ Important</h3>
            <p style={{fontSize:14,opacity:.9}}>
              Send <b>exactly&nbsp;0.5&nbsp;TON</b>.<br/>
              Any other amount will <b>not be recognised</b><br/>
              and <b>will be lost</b>.
            </p>
            <button style={{...S.mBtn,background:'#d4af37',color:'#000'}}
                    onClick={burn}>I understand, continue</button>
            <button style={{...S.mBtn,background:'#333',color:'#fff'}}
                    onClick={()=>setModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* main page -------------------------------------------------------- */}
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.h2}>The Path Begins</h2>
          <p style={S.sub}>Ready to burn yourself.</p>

          {msg && <p style={{...S.stat, ...(msg.startsWith('🔥')?S.ok:S.bad)}}>{msg}</p>}
          {curse && !msg && (
            <p style={S.stat}>⛔ Cursed until {new Date(curse).toLocaleString()}</p>
          )}
          {!curse && cd>0 && !msg && (
            <p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>
          )}

          <button style={{...S.btn,...S.prim,opacity:disabled?0.6:1}}
                  disabled={disabled} onClick={confirmBurn}>
            {mainTxt}
          </button>

          {wait && (
            <>
              {PLATFORM==='android' && ton && (
                <button style={{...S.btn,...S.sec}} onClick={openWallet}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={{...S.btn,...S.sec}} onClick={()=>openExternal(hub)}>
                Open in Tonhub
              </button>
            </>
          )}

          <button style={{...S.btn,...S.sec}} onClick={()=>nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {/* fragment animation image */}
      {fragImg && <img src={fragImg} alt="fragment" style={S.frag}/>}

      {DEV && location.search.includes('debug=1') && <Debug/>}
    </>
  );
}
