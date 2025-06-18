/*  Path.jsx  ────────────────────────────────────────────────────────────────
 *  The Path Begins – with confirm-modal & fragment animation
 * ------------------------------------------------------------------------ */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL
             ?? 'https://ash-backend-production.up.railway.app';

const TG        = window.Telegram?.WebApp;
const DEV       = import.meta.env.DEV;
const PLATFORM  = TG?.platform ?? 'unknown';
const COOLDOWN  = 120;                                // sec

/* ---------- styles ---------- */
const S = {
  /* base */
  page:{position:'relative',minHeight:'100vh',
        background:'url("/bg-path.webp") center/cover',
        display:'flex',justifyContent:'center',alignItems:'center',
        padding:'32px 12px'},
  card:{width:'100%',maxWidth:380,textAlign:'center',color:'#d4af37'},
  h2  :{margin:'0 0 8px',fontSize:28,fontWeight:700},
  sub :{margin:'0 0 24px',fontSize:16},
  btn :{display:'block',width:'100%',padding:'12px',fontSize:16,
        borderRadius:6,border:'none',margin:'12px 0',cursor:'pointer'},
  prim:{background:'#d4af37',color:'#000'},
  sec :{background:'transparent',border:'1px solid #d4af37',color:'#d4af37',
        width:'100%',padding:'12px'},
  stat:{fontSize:15,minHeight:22,margin:'12px 0'},
  ok  :{color:'#6bcb77'}, bad:{color:'#ff6b6b'},

  /* confirm modal */
  ovl :{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',
        backdropFilter:'blur(4px)',display:'flex',justifyContent:'center',
        alignItems:'center',zIndex:5},
  modal:{background:'#1b1b1b',border:'1px solid #555',borderRadius:8,
         padding:24,maxWidth:320,color:'#fff',textAlign:'center'},
  mBtn :{width:'100%',padding:'10px',marginTop:12,fontSize:15,borderRadius:6,
         cursor:'pointer'},

  /* fragment animation */
  frag:{position:'fixed',left:'50%',top:'50%',
        width:120,height:120,marginLeft:-60,marginTop:-60,
        borderRadius:60,background:'#d4af37',color:'#000',
        display:'flex',justifyContent:'center',alignItems:'center',
        fontSize:34,fontWeight:700,zIndex:4,
        animation:'showFly 2.2s ease forwards'},
  /* dev overlay */
  dbg :{position:'fixed',insetInline:0,bottom:0,maxHeight:'40vh',
        background:'#000c',color:'#5cff5c',fontSize:11,
        overflowY:'auto',whiteSpace:'pre-line',padding:'4px 6px',zIndex:9999}
};

/* keyframes via <style> tag once */
const style = document.createElement('style');
style.textContent = `
@keyframes showFly{
  0%   {transform:scale(.2);opacity:0;}
  20%  {transform:scale(1.05);opacity:1;}
  35%  {transform:scale(1);}
  75%  {transform:translateY(160px) scale(.4);opacity:.8;}
  100% {transform:translateY(220px) scale(.15);opacity:0;}
}`;
document.head.append(style);

/* ---------- DEV overlay ---------- */
function Debug(){const[log,set]=useState([]);
  useEffect(()=>{const h=e=>set(l=>[...l,e]);
    TG?.onEvent?.('viewport_changed',h);
    return()=>TG?.offEvent?.('viewport_changed',h);},[]);
  return <div style={S.dbg}>{log.join('\n')}</div>;
}

/* ======================================================================= */
export default function Path() {
  const nav = useNavigate();
  const poll = useRef(null);
  const accBtn = useRef(null);             // куда «улетает» фрагмент

  /* state */
  const [tgId,setTg]  = useState('');
  const [last,setLast]= useState(null);
  const [curse,setCur]= useState(null);
  const [cd ,setCd]   = useState(0);

  const [busy,setBusy]= useState(false);
  const [wait,setWait]= useState(false);
  const [inv ,setInv] = useState(null);
  const [hub ,setHub] = useState('');
  const [ton ,setTon] = useState('');
  const [msg ,setMsg] = useState('');

  const [ask,setAsk]  = useState(false);   // show confirm modal?
  const [frag,setFrag]= useState(null);    // fragment number for animation

  /* helpers */
  const left = t=>Math.max(0,COOLDOWN - ((Date.now()-new Date(t))/1e3|0));
  const fmt  = s=>`${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const openExt = url => TG?.openLink?.(url,{try_instant_view:false})||window.open(url,'_blank');
  const openOnce=(id,url)=>{const k=`wOpened-${id}`;if(sessionStorage[k])return;
    sessionStorage[k]=1;openExt(url);};

  /* mount */
  useEffect(()=>{
    const u=TG?.initDataUnsafe?.user;
    if(!u?.id){nav('/init');return;} setTg(String(u.id));

    const rec=localStorage.getItem('invoiceId');
    if(rec){
      setInv(rec);setHub(localStorage.getItem('paymentUrl')||'');
      setTon(localStorage.getItem('tonspaceUrl')||'');
      setWait(true);poll.current=setInterval(()=>check(rec),5_000);
    }

    (async()=>{
      const r=await fetch(`${BACKEND}/api/player/${u.id}`);
      const j=await r.json();
      setLast(j.last_burn);
      if(j.curse_expires && Date.parse(j.curse_expires)>Date.now())
        setCur(j.curse_expires);
      setCd(left(j.last_burn));
    })();

    const t=setInterval(()=>setCd(s=>s>0?s-1:0),1000);
    return()=>clearInterval(t);
  },[nav]);

  /* invoice */
  const confirmThenBurn =()=> setAsk(true);
  const burn = async()=>{
    setAsk(false);setBusy(true);setMsg('');
    try{
      const r=await fetch(`${BACKEND}/api/burn-invoice`,{
        method:'POST',headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${localStorage.getItem('token')}`
        },body:JSON.stringify({tg_id:tgId})
      });
      const j=await r.json(); if(!r.ok)throw new Error(j.error);

      setInv(j.invoiceId);setHub(j.paymentUrl);setTon(j.tonspaceUrl);
      localStorage.setItem('invoiceId',j.invoiceId);
      localStorage.setItem('paymentUrl',j.paymentUrl);
      localStorage.setItem('tonspaceUrl',j.tonspaceUrl);

      openOnce(j.invoiceId, PLATFORM==='android'?j.tonspaceUrl:j.paymentUrl);
      setBusy(false);setWait(true);
      poll.current=setInterval(()=>check(j.invoiceId),5_000);
    }catch(e){setMsg(e.message);setBusy(false);}
  };

  /* poll */
  const check = async id =>{
    try{
      const r=await fetch(`${BACKEND}/api/burn-status/${id}`,{
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}
      });
      const j=await r.json(); if(!r.ok)throw new Error(j.error);
      if(j.paid){
        clearInterval(poll.current);setWait(false);
        localStorage.removeItem('invoiceId');localStorage.removeItem('paymentUrl');localStorage.removeItem('tonspaceUrl');
        if(j.cursed){
          setCur(j.curse_expires);
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`);
        }else{
          setFrag(j.newFragment);               // trigger animation
          setTimeout(()=>setFrag(null),2200);   // remove after anim
          setMsg('');
          setLast(j.lastBurn);setCd(COOLDOWN);setCur(null);
        }
      }
    }catch(e){ setMsg(e.message);clearInterval(poll.current);setWait(false);}
  };

  /* UI flags */
  const disable = busy||wait||cd>0||curse;
  const mainTxt = busy? 'Creating invoice…'
               : wait? 'Waiting for payment…'
               : '🔥 Burn Yourself for 0.5 TON';

  return (
    <div style={S.page}>
      {/* fragment animation */}
      {frag && <div style={S.frag}>#{frag}</div>}

      {/* confirm modal */}
      {ask && (
        <div style={S.ovl} onClick={()=>setAsk(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:15,marginBottom:20,lineHeight:1.4}}>
              Send <b>exactly 0.5&nbsp;TON</b>.<br/>
              Any other amount won’t be recognised<br/>
              and <b>the funds will be lost.</b>
            </p>
            <button style={{...S.mBtn,background:'#d4af37',color:'#000'}}
                    onClick={burn}>I understand</button>
            <button style={{...S.mBtn,background:'transparent',color:'#d4af37',
                    border:'1px solid #d4af37'}}
                    onClick={()=>setAsk(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* main card */}
      <div style={S.card}>
        <h2 style={S.h2}>The Path Begins</h2>
        <p style={S.sub}>Ready to burn yourself.</p>

        {msg && <p style={{...S.stat,...(msg.startsWith('🔥')?S.ok:S.bad)}}>{msg}</p>}
        {curse && !msg && <p style={S.stat}>⛔ Cursed until {new Date(curse).toLocaleString()}</p>}
        {!curse && cd>0 && !msg && <p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>}

        <button style={{...S.btn,...S.prim,opacity:disable?0.6:1}}
                disabled={disable} onClick={confirmThenBurn}>{mainTxt}</button>

        {wait && (
          <>
            {PLATFORM==='android'&&ton&&(
              <button style={{...S.btn,...S.sec}} onClick={openWallet}>
                Continue in Telegram Wallet
              </button>
            )}
            <button style={{...S.btn,...S.sec}} onClick={()=>openOnce(inv,hub)}>
              Open in Tonhub
            </button>
          </>
        )}

        <button ref={accBtn} style={{...S.btn,...S.sec}}
                onClick={()=>nav('/profile')}>
          Go to your personal account
        </button>
      </div>

      {DEV && location.search.includes('debug=1') && <Debug/>}
    </div>
  );
}
