/*  src/screens/Path.jsx – v4 (auto-refresh JWT + clear error message)
    ------------------------------------------------------------------ */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ---------- config -------------------------------------------------- */
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const TG        = window.Telegram?.WebApp;
const PLATFORM  = TG?.platform ?? 'unknown';
const DEV       = import.meta.env.DEV;

/* fragment id → filename */
const FRAG_IMG = {
  1:'fragment_1_the_whisper.webp',
  2:'fragment_2_the_number.webp',
  3:'fragment_3_the_language.webp',
  4:'fragment_4_the_mirror.webp',
  5:'fragment_5_the_chain.webp',
  6:'fragment_6_the_hour.webp',
  7:'fragment_7_the_mark.webp',
  8:'fragment_8_the_gate.webp',
};

/* ---------- styles / keyframes (без изменений) ---------------------- */
const S={ /* … стили прежней версии … */ };
const styleTag=(<style>{`@keyframes fly{0%{opacity:0;transform:translate(-50%,-50%) scale(.3);}15%{opacity:1;transform:translate(-50%,-50%) scale(1);}65%{opacity:1;transform:translate(-50%,-50%) scale(1);}100%{opacity:0;transform:translate(-50%,280%) scale(.3);}}`
}</style>);

/* ---------- DEV overlay -------------------------------------------- */
function Debug(){ /* … прежний код … */ }

/* =================================================================== */
export default function Path(){
  const nav      = useNavigate();
  const pollRef  = useRef(null);

  /* preload all fragment images once */
  useEffect(()=>{ Object.values(FRAG_IMG).forEach(f=>{
    const i=new Image(); i.src=`/fragments/${f}`;});},[]);

  /* profile */
  const [tgId,setTgId] = useState('');
  const [last,setLast] = useState(null);
  const [curse,setCur ] = useState(null);
  const [cd,setCd]     = useState(0);

  /* payment */
  const [busy,setBusy] = useState(false);
  const [wait,setWait] = useState(false);
  const [hub,setHub]   = useState('');
  const [ton,setTon]   = useState('');
  const [msg,setMsg]   = useState('');

  /* ui */
  const [frag,setFrag]=useState('');
  const [fragLoaded,setFragLoaded]=useState(false);
  const [showModal,setModal]=useState(false);
  const COOLDOWN = 120;

  /* helpers */
  const secLeft = t=>Math.max(0,
    COOLDOWN - Math.floor((Date.now()-new Date(t).getTime())/1000));
  const fmt = s=>`${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const open = url=>TG?.openLink?.(url,{try_instant_view:false})||window.open(url,'_blank');

  /* helper – сохранить новый JWT, если пришёл */
  const saveToken = res=>{
    const hdr = res.headers?.get('Authorization') || '';
    if(hdr.startsWith('Bearer ')){
      localStorage.setItem('token', hdr.slice(7));
    }
  };

  /* mount */
  useEffect(()=>{
    const u=TG?.initDataUnsafe?.user;
    if(!u?.id){ nav('/init'); return;}
    setTgId(String(u.id));
    if(!localStorage.getItem('token')){ nav('/init'); return;}

    /* unfinished invoice */
    const inv=localStorage.getItem('invoiceId');
    if(inv){
      setHub(localStorage.getItem('paymentUrl')||'');
      setTon(localStorage.getItem('tonspaceUrl')||'');
      setWait(true);
      pollRef.current=setInterval(()=>check(inv),5_000);
    }

    /* profile */
    (async()=>{
      try{
        const r=await fetch(`${BACKEND}/api/player/${u.id}`);
        const j=await r.json();
        setLast(j.last_burn);
        if(j.curse_expires && new Date(j.curse_expires)>new Date())
          setCur(j.curse_expires);
        setCd(secLeft(j.last_burn));
      }catch{/* ignore */}
    })();

    const it=setInterval(()=>setCd(s=>s>0?s-1:0),1000);
    return()=>clearInterval(it);
  },[nav]);

  /* burn → create invoice */
  const burn = async () =>{
    setModal(false); setBusy(true); setMsg('');
    try{
      const r = await fetch(`${BACKEND}/api/burn-invoice`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tg_id:tgId })
      });
      saveToken(r);                                  // ← обновляем JWT
      const j = await r.json();
      if(!r.ok) throw new Error(j.error||'invoice error');

      setHub(j.paymentUrl); setTon(j.tonspaceUrl);
      localStorage.setItem('invoiceId', j.invoiceId);
      localStorage.setItem('paymentUrl', j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      if(PLATFORM==='android'&&j.tonspaceUrl) open(j.tonspaceUrl);
      else open(j.paymentUrl);

      setBusy(false); setWait(true);
      pollRef.current=setInterval(()=>check(j.invoiceId),5_000);
    }catch(e){
      setMsg(e.message); setBusy(false); setWait(false);
    }
  };

  /* polling */
  const check = async id =>{
    try{
      const r=await fetch(`${BACKEND}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
      });
      saveToken(r);                     // ← обновляем JWT
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'status');

      if(j.paid){
        clearInterval(pollRef.current);
        setBusy(false); setWait(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if(j.cursed){
          setCur(j.curse_expires);
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`);
        }else{
          setCur(null); setLast(j.lastBurn); setCd(COOLDOWN);
          const url=`/fragments/${FRAG_IMG[j.newFragment]??FRAG_IMG[1]}`;
          setFrag(url); setFragLoaded(false);
          setMsg(`🔥 Fragment #${j.newFragment} received!`);
        }
      }
    }catch(e){
      setMsg(e.message); setBusy(false); setWait(false);
    }
  };

  /* fragment hide after animation */
  useEffect(()=>{
    if(fragLoaded){
      const tm=setTimeout(()=>{setFrag('');setFragLoaded(false);},2300);
      return()=>clearTimeout(tm);
    }
  },[fragLoaded]);

  /* render */
  const disabled = busy||wait||cd>0||curse;
  const mainTxt  = busy?'Creating invoice…'
               : wait?'Waiting for payment…'
               :'🔥 Burn Yourself for 0.5 TON';

  return(
    <>
      {styleTag}

      {/* modal */}
      {showModal&&(
        <div style={S.modalWrap} onClick={()=>setModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 10px'}}>⚠️ Important</h3>
            <p style={{fontSize:14,opacity:.9}}>
              Send <b>exactly 0.5&nbsp;TON</b>.<br/>
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

      {/* main card */}
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.h2}>The Path Begins</h2>
          <p style={S.sub}>Ready to burn yourself.</p>

          {msg && <p style={{...S.stat,...(msg.startsWith('🔥')?S.ok:S.bad)}}>{msg}</p>}
          {curse && !msg && <p style={S.stat}>⛔ Cursed until {new Date(curse).toLocaleString()}</p>}
          {!curse && cd>0 && !msg && <p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>}

          <button style={{...S.btn,...S.prim,opacity:disabled?0.6:1}}
                  disabled={disabled}
                  onClick={()=>setModal(true)}>
            {mainTxt}
          </button>

          {wait&&(
            <>
              {PLATFORM==='android'&&ton&&(
                <button style={{...S.btn,...S.sec}} onClick={()=>open(ton)}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={{...S.btn,...S.sec}} onClick={()=>open(hub)}>
                Open in Tonhub
              </button>
            </>
          )}

          <button style={{...S.btn,...S.sec}} onClick={()=>nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {/* fragment animation */}
      {frag && (
        <img src={frag} alt="fragment" style={S.frag}
             onLoad={()=>setFragLoaded(true)} />
      )}

      {DEV&&location.search.includes('debug=1')&&<Debug/>}
    </>
  );
}
