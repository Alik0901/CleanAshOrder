/*  src/screens/Profile.jsx – v3.5
    • refCode выводится текстом, кнопка Copy сохранена
    • остальной функционал неизменён (stats-fix, zoom-overlay, safe copy)
*/

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReferral, claimReferral } from '../api/referral.js';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const SLUG = [
  'the_whisper','the_number','the_language','the_mirror',
  'the_chain','the_hour','the_mark','the_gate'
];

export default function Profile () {
  const nav = useNavigate();

  /* base */
  const [loading,setLoad]  = useState(true);
  const [error,  setErr ]  = useState('');
  const [name,   setName]  = useState('');
  const [frags,  setFr  ]  = useState([]);

  /* stats */
  const [total,  setTotal] = useState(null);

  /* referral */
  const [refCode,setCode]  = useState('');
  const [invCnt, setInv ]  = useState(0);
  const [reward, setRw  ]  = useState(false);
  const [claimB, setCB  ]  = useState(false);
  const [copied, setCp  ]  = useState(false);

  /* delete */
  const [ask,  setAsk ]    = useState(false);
  const [busy, setBusy]    = useState(false);
  const [dErr, setDErr]    = useState('');

  /* zoom */
  const [zoomSrc,setZoom]  = useState('');

  /* ─── load once ─────────────────────────────────────── */
  useEffect(() => {
    const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const tok = localStorage.getItem('token');
    if (!uid) { nav('/init'); return; }

    (async () => {
      try {
        const p = await fetch(`${BACKEND}/api/player/${uid}`, {
          headers: { Authorization: tok ? `Bearer ${tok}` : undefined }
        });

        if ([401,403,404].includes(p.status)) {
          localStorage.removeItem('token'); nav('/init'); return;
        }
        if (!p.ok) throw 0;

        const pj = await p.json();
        setName(pj.name ?? '');
        setFr(pj.fragments ?? []);

        if (tok) {
          try {
            const ref = await fetchReferral(uid, tok);
            setCode(ref.refCode ?? '');
            setInv(ref.invitedCount ?? 0);
            setRw (ref.rewardIssued ?? false);
          } catch {/* optional */}
        }
      } catch { setErr('Failed to load'); }
      setLoad(false);

      fetch(`${BACKEND}/api/stats/total_users`, {
        headers: { Authorization: tok ? `Bearer ${tok}` : undefined }
      })
        .then(r=>r.ok?r.json():null)
        .then(j=>j && setTotal(j.total))
        .catch(()=>{});
    })();
  }, [nav]);

  /* helpers */
  const copy = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCp(true); setTimeout(()=>setCp(false),1500);
    } catch {}
  };

  const claim = async () => {
    setCB(true);
    try {
      const tok = localStorage.getItem('token');
      await claimReferral(tok);
      setRw(true);
      alert('🎉 Free fragment received!');
      window.location.reload();
    } catch (e) { alert(e.message); }
    setCB(false);
  };

  const delProfile = async () => {
    setBusy(true); setDErr('');
    try {
      const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const tok = localStorage.getItem('token');
      await fetch(`${BACKEND}/api/player/${uid}`, {
        method:'DELETE', headers:{ Authorization:`Bearer ${tok}` }
      });
      localStorage.clear(); nav('/');
    } catch (e) { setDErr(e.message); setBusy(false); }
  };

  /* guards */
  if (loading)
    return <div style={S.page}><p style={S.load}>Loading…</p></div>;
  if (error)
    return <div style={S.page}><p style={S.err}>{error}</p></div>;

  /* render */
  const rows     = [[1,2,3,4],[5,6,7,8]];
  const progress = Math.min(invCnt,3);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h}>{name}</h2>
        <p style={S.sub}>Fragments {frags.length}/8</p>

        {rows.map((r,i)=>(
          <div key={i} style={S.row}>
            {r.map(id=>(
              <div key={id} style={S.slot}>
                {frags.includes(id) && (
                  <img
                    src={`/fragments/fragment_${id}_${SLUG[id-1]}.webp`}
                    style={S.img}
                    onClick={()=>setZoom(`/fragments/fragment_${id}_${SLUG[id-1]}.webp`)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        <button style={S.act} onClick={()=>nav('/path')}>🔥 Burn Again</button>

        <div style={S.refBox}>
          <p style={S.refLabel}>Your referral code</p>
          <div style={S.copyRow}>
            <span style={S.refText} onClick={copy}>{refCode || '—'}</span>
            <button style={S.copyBtn} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p style={S.progress}>Invited {progress}/3</p>

          {(progress>=3 && !reward && localStorage.getItem('token')) && (
            <button style={S.claim} disabled={claimB} onClick={claim}>
              {claimB ? 'Processing…' : 'Claim free fragment'}
            </button>
          )}
          {reward && <p style={S.claimed}>Reward already claimed ✅</p>}
        </div>

        {total !== null && (
          <p style={S.count}>
            Ash Seekers:&nbsp;{total.toLocaleString()}
          </p>
        )}

        {frags.length === 8 && (
          <button
            style={{ ...S.act, marginTop:6, fontSize:16 }}
            onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <div style={{flexGrow:1}} />
        <button style={S.del} onClick={()=>setAsk(true)}>Delete profile</button>
      </div>

      {ask && (
        <div style={S.wrap} onClick={()=>!busy&&setAsk(false)}>
          <div style={S.box} onClick={e=>e.stopPropagation()}>
            <p style={{margin:'0 0 12px',fontSize:17}}>
              Delete profile permanently?
            </p>
            {dErr && <p style={{color:'#f66',fontSize:14}}>{dErr}</p>}
            <button style={S.ok} disabled={busy} onClick={delProfile}>
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              style={S.cancel}
              disabled={busy}
              onClick={()=>setAsk(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {zoomSrc && (
        <div style={S.zoomWrap} onClick={()=>setZoom('')}>
          <img src={zoomSrc} style={S.zoomImg} onClick={e=>e.stopPropagation()}/>
          <button style={S.close} onClick={()=>setZoom('')}>✕</button>
        </div>
      )}
    </div>
  );
}

/* styles */
const S = {
  page:{minHeight:'100vh',background:'url("/profile-bg.webp") center/cover',
        display:'flex',justifyContent:'center',alignItems:'center',
        padding:16,color:'#d4af37',fontFamily:'serif'},
  load:{fontSize:18}, err:{fontSize:16,color:'#f66'},

  card:{width:'100%',maxWidth:360,minHeight:520,background:'rgba(0,0,0,.55)',
        padding:20,borderRadius:8,display:'flex',flexDirection:'column',
        textAlign:'center'},
  h:{margin:0,fontSize:26}, sub:{fontSize:14,margin:'6px 0 18px',opacity:.85},

  row:{display:'flex',gap:6,marginBottom:6},
  slot:{flex:'1 1 0',aspectRatio:'1/1',background:'#111',
        border:'1px solid #d4af37',borderRadius:6,overflow:'hidden'},
  img:{width:'100%',height:'100%',objectFit:'cover',cursor:'pointer'},

  refBox:{background:'#0004',padding:14,borderRadius:8,margin:'20px 0'},
  refLabel:{fontSize:14,margin:0,opacity:.8},
  copyRow:{display:'flex',marginTop:6,alignItems:'center',gap:6},
  refText:{flex:1,padding:'8px 0',fontSize:15,wordBreak:'break-all',
           cursor:'pointer',userSelect:'all',textAlign:'center',
           borderBottom:'1px dotted #d4af37'},
  copyBtn:{padding:'8px 12px',fontSize:13,border:'none',borderRadius:4,
           background:'#d4af37',color:'#000',cursor:'pointer'},

  progress:{fontSize:13,marginTop:8,opacity:.85},
  claim:{marginTop:10,padding:10,width:'100%',fontSize:14,border:'none',
         borderRadius:6,background:'#6BCB77',color:'#000',cursor:'pointer'},
  claimed:{marginTop:10,fontSize:13,color:'#6BCB77'},

  count:{fontSize:14,margin:'14px 0 18px',opacity:.85},
  act:{padding:10,fontSize:15,borderRadius:6,border:'none',
       background:'#d4af37',color:'#000',cursor:'pointer'},
  del:{padding:10,fontSize:14,borderRadius:6,border:'none',
       background:'#a00',color:'#fff',cursor:'pointer',marginTop:8},

  wrap:{position:'fixed',inset:0,background:'#0007',backdropFilter:'blur(4px)',
        display:'flex',justifyContent:'center',alignItems:'center',zIndex:40},
  box:{background:'#222',padding:24,borderRadius:10,width:300,color:'#fff',
       textAlign:'center'},
  ok:{width:'100%',padding:10,fontSize:15,border:'none',borderRadius:6,
      background:'#d4af37',color:'#000',cursor:'pointer'},
  cancel:{width:'100%',padding:10,fontSize:14,marginTop:10,border:'none',
          borderRadius:6,background:'#555',color:'#fff',cursor:'pointer'},

  zoomWrap:{position:'fixed',inset:0,background:'#000d',zIndex:60,
            display:'flex',justifyContent:'center',alignItems:'center'},
  zoomImg:{maxWidth:'90vw',maxHeight:'86vh',borderRadius:10},
  close:{position:'fixed',top:16,right:14,fontSize:34,lineHeight:'28px',
         background:'none',border:'none',color:'#fff',cursor:'pointer',
         zIndex:61}
};
