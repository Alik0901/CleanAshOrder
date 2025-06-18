/*  Path.jsx ────────────────────────────────────────────────────────────────
    Burn 0.5 TON   |   Android → встроенный Wallet   |   fallback → Tonhub
----------------------------------------------------------------------------*/
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ------------ config ------------ */
const BACKEND = import.meta.env.VITE_BACKEND_URL
             ?? 'https://ash-backend-production.up.railway.app';

const TG         = window.Telegram?.WebApp;
const PLATFORM   = TG?.platform ?? 'unknown';          // android | ios | …
const DEV        = import.meta.env.DEV;
const COOLDOWN_S = 120;

/* ------------ styles ------------ */
const S = {
  page :{position:'relative',minHeight:'100vh',
         background:'url("/bg-path.webp") center/cover',
         display:'flex',justifyContent:'center',alignItems:'center',
         padding:'32px 12px'},
  card :{width:'100%',maxWidth:380,textAlign:'center',color:'#d4af37'},
  h2   :{margin:'0 0 8px',fontSize:28,fontWeight:700},
  sub  :{margin:'0 0 24px',fontSize:16},
  btn  :{display:'block',width:'100%',padding:'12px',fontSize:16,
         borderRadius:6,border:'none',margin:'12px 0',cursor:'pointer',
         transition:'opacity .2s'},
  prim :{background:'#d4af37',color:'#000'},
  sec  :{background:'transparent',border:'1px solid #d4af37',color:'#d4af37',
         width:'100%',padding:'12px'},
  stat :{fontSize:15,minHeight:22,margin:'12px 0'},
  ok   :{color:'#6BCB77'}, bad:{color:'#FF6B6B'},
  dbg  :{position:'fixed',insetInline:0,bottom:0,maxHeight:'40vh',
         background:'#000c',color:'#5cff5c',fontSize:11,
         overflowY:'auto',whiteSpace:'pre-line',padding:'4px 6px',zIndex:9999}
};

/* ------------ DEV overlay ------------ */
function Debug() {
  const [log,set]=useState([]);
  useEffect(()=>{
    const h=e=>set(l=>[...l,`[tg] ${e}`]);
    TG?.onEvent?.('viewport_changed',h);
    return()=>TG?.offEvent?.('viewport_changed',h);
  },[]);
  return <div style={S.dbg}>{log.join('\n')}</div>;
}

/* ======================================================================== */
export default function Path() {
  const nav = useNavigate();
  const poll = useRef(null);

  /* profile */
  const [tgId,setTg]      = useState('');
  const [last,setLast]    = useState(null);
  const [curse,setCurse]  = useState(null);
  const [cd ,setCd]       = useState(0);

  /* payment */
  const [busy,setBusy]    = useState(false);
  const [wait,setWait]    = useState(false);
  const [inv ,setInv]     = useState(null);
  const [hub ,setHub]     = useState('');
  const [ton ,setTon]     = useState('');
  const [msg ,setMsg]     = useState('');

  /* ---------- helpers ---------- */
  const left = t=>Math.max(0,
    COOLDOWN_S - Math.floor((Date.now()-new Date(t).getTime())/1e3));
  const fmt  = s=>`${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const openOnce = (id,url)=>{
    const key=`walletOpened-${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,'1');
    TG?.openLink?.(url,{try_instant_view:false}) || window.open(url,'_blank');
  };

  const openWallet = ()=> PLATFORM==='android' && ton
    ? openOnce(inv,ton) : openOnce(inv,hub);

  /* ---------- mount ---------- */
  useEffect(()=>{
    const u=TG?.initDataUnsafe?.user;
    if(!u?.id){ nav('/init'); return; }
    setTg(String(u.id));
    if(!localStorage.getItem('token')){ nav('/init'); return; }

    /* restore unfinished invoice */
    const rec = localStorage.getItem('invoiceId');
    if(rec){
      setInv(rec);
      setHub(localStorage.getItem('paymentUrl')||'');
      setTon(localStorage.getItem('tonspaceUrl')||'');
      setWait(true);
      poll.current=setInterval(()=>check(rec),5_000);
    }

    /* load profile */
    (async()=>{
      const r  = await fetch(`${BACKEND}/api/player/${u.id}`);
      const j  = await r.json();
      setLast(j.last_burn);
      if(j.curse_expires && Date.parse(j.curse_expires)>Date.now())
        setCurse(j.curse_expires);
      setCd(left(j.last_burn));
    })();

    const t=setInterval(()=>setCd(s=>s>0?s-1:0),1000);
    return()=>clearInterval(t);
  },[nav]);

  /* ---------- invoice ---------- */
  const burn = async()=>{
    setBusy(true); setMsg('');
    try{
      const r=await fetch(`${BACKEND}/api/burn-invoice`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body:JSON.stringify({tg_id: tgId})
      });
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Invoice error');

      setInv(j.invoiceId); setHub(j.paymentUrl); setTon(j.tonspaceUrl);
      localStorage.setItem('invoiceId',j.invoiceId);
      localStorage.setItem('paymentUrl', j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      openOnce(j.invoiceId, PLATFORM==='android'?j.tonspaceUrl:j.paymentUrl);
      setBusy(false); setWait(true);
      poll.current=setInterval(()=>check(j.invoiceId),5_000);
    }catch(e){ setMsg(e.message); setBusy(false);}
  };

  /* ---------- poll status ---------- */
  const check = async id=>{
    try{
      const r=await fetch(`${BACKEND}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
      });
      const j=await r.json();
      if(!r.ok) throw new Error(j.error);
      if(j.paid){
        clearInterval(poll.current); setWait(false);
        localStorage.removeItem('invoiceId');localStorage.removeItem('paymentUrl');localStorage.removeItem('tonspaceUrl');
        if(j.cursed){
          setCurse(j.curse_expires);
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`);
        }else{
          setMsg(`🔥 Fragment #${j.newFragment} received!`);
          setLast(j.lastBurn); setCd(COOLDOWN_S); setCurse(null);
        }
      }
    }catch(e){ setMsg(e.message); clearInterval(poll.current); setWait(false);}
  };

  /* ---------- UI ---------- */
  const disabled = busy||wait||cd>0||curse;
  const mainTxt  = busy ? 'Creating invoice…'
                 : wait ? 'Waiting for payment…'
                        : '🔥 Burn Yourself for 0.5 TON';

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h2}>The Path Begins</h2>
        <p style={S.sub}>Ready to burn yourself.</p>

        {msg&&<p style={{...S.stat,...(msg.startsWith('🔥')?S.ok:S.bad)}}>{msg}</p>}
        {curse&&!msg&&<p style={S.stat}>⛔ Cursed until {new Date(curse).toLocaleString()}</p>}
        {!curse&&cd>0&&!msg&&<p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>}

        <button style={{...S.btn,...S.prim,opacity:disabled?0.6:1}}
                disabled={disabled} onClick={burn}>{mainTxt}</button>

        {wait&&(
          <>
            {PLATFORM==='android'&&ton&&
              <button style={{...S.btn,...S.sec}} onClick={openWallet}>
                Continue in Telegram Wallet
              </button>}
            <button style={{...S.btn,...S.sec}} onClick={()=>openOnce(inv,hub)}>
              Open in Tonhub
            </button>
          </>
        )}

        <button style={{...S.btn,...S.sec}} onClick={()=>nav('/profile')}>
          Go to your personal account
        </button>
      </div>

      {DEV && location.search.includes('debug=1') && <Debug/>}
    </div>
  );
}
