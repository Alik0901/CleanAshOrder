// src/screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Profile() {
  const nav = useNavigate();

  /* ------------ ui / data state ------------ */
  const [loading,setLoading]   = useState(true);
  const [err,    setErr]       = useState('');
  const [name,   setName]      = useState('');
  const [frags,  setFrags]     = useState([]);
  const [total,  setTotal]     = useState(0);
  const [zoom,   setZoom]      = useState(null);    // enlarge fragment

  /* delete modal */
  const [askDel, setAskDel]    = useState(false);
  const [busy,   setBusy]      = useState(false);
  const [delErr, setDelErr]    = useState('');

  /* ------------ load profile ------------ */
  useEffect(()=>{
    const id  = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const tok = localStorage.getItem('token');
    if(!id||!tok) return nav('/init');

    const fetchAll = async()=>{
      try{
        /* player */
        const p = await fetch(`${BACKEND}/api/player/${id}`,{
          headers:{Authorization:`Bearer ${tok}`}})
          .then(r=>r.json());
        setName(p.name); setFrags(p.fragments||[]);

        /* stats */
        const s = await fetch(`${BACKEND}/api/stats/total_users`,{
          headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
          .then(r=>r.json());
        setTotal(s.value||0);
      }catch(e){ setErr('Failed to load profile'); }
      setLoading(false);
    };
    fetchAll();

    /* refresh on focus */
    const h = ()=> fetchAll();
    window.addEventListener('focus',h);
    return ()=> window.removeEventListener('focus',h);
  },[nav]);

  /* ------------ delete profile ------------ */
  const delProfile = async()=>{
    setBusy(true); setDelErr('');
    try{
      const id  = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const r = await fetch(`${BACKEND}/api/player/${id}`,{
        method:'DELETE',
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});
      if(!r.ok){
        const j = await r.json();
        throw new Error(j.error||'Error');
      }
      localStorage.clear();
      nav('/');
    }catch(e){
      setDelErr(e.message); setBusy(false);
    }
  };

  /* ------------ ui ------------ */
  if(loading) return <div style={ST.page}><p style={{color:'#fff'}}>Loading…</p></div>;
  if(err)     return <div style={ST.page}><p style={{color:'#f55'}}>{err}</p></div>;

  const slugs=['the_whisper','the_number','the_language','the_mirror',
               'the_chain','the_hour','the_mark','the_gate'];

  return (
    <div style={ST.page}>
      <div style={ST.card}>
        <h2 style={ST.h2}>{name}</h2>
        <p style={ST.sub}>Fragments {frags.length}/8</p>

        <div style={ST.grid}>
          {[1,2,3,4,5,6,7,8].map(id=>{
            const own = frags.includes(id);
            return (
              <div key={id} style={ST.slot}
                   onClick={()=> own && setZoom(id)}>
                {own && (
                  <img src={`/fragments/fragment_${id}_${slugs[id-1]}.webp`}
                       alt="" style={ST.img}/>
                )}
              </div>
            );
          })}
        </div>

        <p style={ST.count}><em>Ash Seekers: {total.toLocaleString()}</em></p>

        <button style={ST.btn} onClick={()=>nav('/path')}>🔥 Burn Again</button>
        {frags.length===8 && (
          <button style={ST.btn2} onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <button style={ST.del} onClick={()=>setAskDel(true)}>
          Delete profile
        </button>
      </div>

      {/* enlarge fragment */}
      {zoom && (
        <div style={ST.back} onClick={()=>setZoom(null)}>
          <img src={`/fragments/fragment_${zoom}_${slugs[zoom-1]}.webp`}
               alt="" style={ST.big}/>
        </div>
      )}

      {/* confirm delete */}
      {askDel && (
        <div style={ST.back}>
          <div style={ST.pop} onClick={e=>e.stopPropagation()}>
            <p>Delete profile permanently?</p>
            {delErr && <p style={{color:'#f55',fontSize:14}}>{delErr}</p>}
            <button disabled={busy} style={ST.yes} onClick={delProfile}>
              Yes, delete
            </button>
            <button disabled={busy} style={ST.no} onClick={()=>setAskDel(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- styles ---------- */
const ST = {
  page :{minHeight:'100vh',background:'url("/profile-bg.webp") center/cover',
         display:'flex',justifyContent:'center',alignItems:'center',
         fontFamily:'serif',color:'#d4af37',padding:16},
  card :{width:'100%',maxWidth:420,textAlign:'center'},
  h2   :{margin:'0 0 8px'},
  sub  :{margin:'0 0 16px',opacity:.85,fontSize:14},
  grid :{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:16},
  slot :{background:'#111',border:'1px solid #d4af37',borderRadius:6,
         aspectRatio:'1/1',overflow:'hidden',cursor:'pointer'},
  img  :{width:'100%',height:'100%',objectFit:'cover'},
  count:{fontSize:14,color:'#ccc',marginBottom:16},
  btn  :{width:'100%',padding:10,marginBottom:8,
         background:'#d4af37',color:'#000',border:'none',borderRadius:4,cursor:'pointer'},
  btn2 :{width:'100%',padding:10,marginBottom:8,
         background:'#d4af37',color:'#000',border:'none',borderRadius:6,cursor:'pointer'},
  del  :{width:'100%',padding:10,marginTop:4,
         background:'#822',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'},

  back :{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',
         display:'flex',justifyContent:'center',alignItems:'center',zIndex:100},
  big  :{maxWidth:'90%',maxHeight:'90%',objectFit:'contain',
         boxShadow:'0 0 20px rgba(0,0,0,.6)'},
  pop  :{width:260,background:'#222',color:'#fff',padding:20,
         borderRadius:8,textAlign:'center'},
  yes  :{width:'100%',padding:10,margin:'6px 0',background:'#d4af37',
         border:'none',borderRadius:4,cursor:'pointer'},
  no   :{width:'100%',padding:10,background:'#666',
         border:'none',borderRadius:4,cursor:'pointer'}
};
