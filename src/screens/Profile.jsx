import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/* карты id → slug для картинок */
const SLUG = ['the_whisper','the_number','the_language','the_mirror',
              'the_chain','the_hour','the_mark','the_gate'];

export default function Profile(){
  const nav = useNavigate();
  const [load,setLoad] = useState(true);
  const [err ,setErr ] = useState('');
  const [name,setName] = useState('');
  const [fr ,setFr  ] = useState([]);
  const [total,setTotal]=useState(0);
  const [sel ,setSel ] = useState(null);

  /* delete modal */
  const [askDel,setAsk] = useState(false);
  const [busyDel,setBD ] = useState(false);
  const [errDel,setED ] = useState('');

  /* ---------- load ---------- */
  useEffect(()=>{
    const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const token = localStorage.getItem('token');
    if (!id||!token){ nav('/init'); return; }

    const load = async()=>{
      try{
        const p = await fetch(`${BACKEND}/api/player/${id}`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        if (!p.ok) throw new Error('player');
        const j = await p.json();
        setName(j.name); setFr(j.fragments||[]);

        const s = await fetch(`${BACKEND}/api/stats/total_users`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        if (s.ok){ setTotal((await s.json()).value||0); }
      }catch{ setErr('Failed to load');}
      setLoad(false);
    };
    load();
    window.addEventListener('focus',load);
    return ()=>window.removeEventListener('focus',load);
  },[nav]);

  /* ---------- delete ---------- */
  const doDelete = async()=>{
    setBD(true); setED('');
    try{
      const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const tok=localStorage.getItem('token');
      const r = await fetch(`${BACKEND}/api/player/${id}`,{
        method:'DELETE',headers:{Authorization:`Bearer ${tok}`}
      });
      if (!r.ok){ const j=await r.json(); throw new Error(j.error); }
      localStorage.clear();
      nav('/');
    }catch(e){ setED(e.message); setBD(false);}
  };

  /* ---------- ui ---------- */
  if (load)  return <div style={P.page}><p style={P.load}>Loading…</p></div>;
  if (err)   return <div style={P.page}><p style={P.err}>{err}</p></div>;

  const rows=[[1,2,3,4],[5,6,7,8]];

  return(
    <div style={P.page}>
      <div style={P.card}>
        <h2 style={P.h}>{name}</h2>
        <p style={P.sub}>Fragments {fr.length}/8</p>

        {/* grid */}
        {rows.map((row,ri)=>(
          <div key={ri} style={P.row}>
            {row.map(id=>{
              const have = fr.includes(id);
              const img  = have?`/fragments/fragment_${id}_${SLUG[id-1]}.webp`:null;
              return (
                <div key={id} style={P.slot} onClick={()=>have&&setSel(id)}>
                  {have&&<img src={img} style={P.img}/>}
                </div>
              );
            })}
          </div>
        ))}

        <p style={P.count}>Ash Seekers: {total.toLocaleString()}</p>

        <button style={P.act} onClick={()=>nav('/path')}>🔥 Burn Again</button>

        {fr.length===8&&(
          <button style={{...P.act,marginTop:6,fontSize:16}}
                  onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <button style={P.del} onClick={()=>setAsk(true)}>Delete profile</button>
      </div>

      {sel&&(
        <div style={P.modal} onClick={()=>setSel(null)}>
          <img src={`/fragments/fragment_${sel}_${SLUG[sel-1]}.webp`} style={P.big}/>
        </div>
      )}

      {/* delete confirm */}
      {askDel&&(
        <div style={P.wrap}>
          <div style={P.box}>
            <p style={{margin:0,marginBottom:12,fontSize:17}}>
              Delete profile permanently?
            </p>
            {errDel&&<p style={{color:'#f66',fontSize:14}}>{errDel}</p>}
            <button style={P.ok} disabled={busyDel} onClick={doDelete}>
              {busyDel?'Deleting…':'Yes, delete'}
            </button>
            <button style={P.cancel} disabled={busyDel} onClick={()=>setAsk(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- css-in-js ---------- */
const P={
  page :{position:'relative',minHeight:'100vh',background:'url("/profile-bg.webp") center/cover',
         display:'flex',justifyContent:'center',alignItems:'center',padding:16,color:'#d4af37',fontFamily:'serif'},
  load :{fontSize:18},  err:{fontSize:16,color:'#f66'},
  card :{width:'100%',maxWidth:360,textAlign:'center'},
  h    :{margin:0,fontSize:26},
  sub  :{fontSize:14,margin:'6px 0 18px',opacity:.85},
  row  :{display:'flex',gap:6,marginBottom:6},
  slot :{flex:'1 1 0',aspectRatio:'1/1',background:'#111',
         border:'1px solid #d4af37',borderRadius:6,overflow:'hidden',cursor:'pointer'},
  img  :{width:'100%',height:'100%',objectFit:'cover'},
  count:{fontSize:14,margin:'14px 0 18px',opacity:.85},
  act  :{width:'100%',padding:10,fontSize:15,borderRadius:6,border:'none',
         background:'#d4af37',color:'#000',cursor:'pointer'},
  del  :{width:'100%',marginTop:8,padding:10,fontSize:14,borderRadius:6,border:'none',
         background:'#a00',color:'#fff',cursor:'pointer'},
  modal:{position:'fixed',inset:0,background:'#000c',display:'flex',
         justifyContent:'center',alignItems:'center',zIndex:30},
  big  :{maxWidth:'90%',maxHeight:'90%',objectFit:'contain'},
  /* delete confirm */
  wrap :{position:'fixed',inset:0,background:'#0007',backdropFilter:'blur(4px)',
         display:'flex',justifyContent:'center',alignItems:'center',zIndex:40},
  box  :{background:'#222',padding:24,borderRadius:10,width:300,color:'#fff',textAlign:'center'},
  ok   :{width:'100%',padding:10,fontSize:15,border:'none',borderRadius:6,
         background:'#d4af37',color:'#000',cursor:'pointer'},
  cancel:{width:'100%',padding:10,fontSize:14,marginTop:10,border:'none',borderRadius:6,
          background:'#555',color:'#fff',cursor:'pointer'}
};
