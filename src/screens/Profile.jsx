import React, { useEffect, useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import { fetchReferral, claimReferral } from '../api/referral.js';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const SLUG = [
  'the_whisper','the_number','the_language','the_mirror',
  'the_chain','the_hour','the_mark','the_gate'
];

export default function Profile() {
  const nav = useNavigate();

  /* базовый стейт */
  const [loading, setLoad] = useState(true);
  const [error,   setErr ] = useState('');
  const [name,    setName] = useState('');
  const [frags,   setFr  ] = useState([]);

  /* общая статистика */
  const [total, setTotal] = useState(null);

  /* реферальная программа */
  const [refCode, setCode] = useState('');
  const [invCnt,  setInv ] = useState(0);
  const [reward,  setRw  ] = useState(false);
  const [claimB,  setCB  ] = useState(false);
  const [copied,  setCp  ] = useState(false);

  /* удаление профиля */
  const [ask,  setAsk ] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dErr, setDErr] = useState('');

  /* зум-фрагмент */
  const [zoomSrc, setZoom] = useState('');

  useEffect(() => {
  const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const tok = localStorage.getItem('token');
  console.log('PROFILE MOUNT', { uid, tok });
  if (!uid || !tok) {
    localStorage.removeItem('token');
    nav('/init');
    return;
  }

  (async () => {
    try {
      console.log('> fetch /api/player');
      const r1 = await fetch(`${BACKEND}/api/player/${uid}`, {
        headers: { Authorization:`Bearer ${tok}` }
      });
      console.log('player status', r1.status);
      if (!r1.ok) throw new Error('player failed');
      const pj = await r1.json();
      console.log('player data', pj);
      setName(pj.name||'');
      setFr(pj.fragments||[]);

      console.log('> fetchReferral');
      const ref = await fetchReferral(tok);
      console.log('referral', ref);
      setCode(ref.refCode);
      setInv(ref.invitedCount);
      setRw(ref.rewardIssued);

    } catch (e) {
      console.error('Error loading profile/referral', e);
      setErr('Failed to load');
    } finally {
      console.log('done loading');
      setLoad(false);
    }
  })();

  // статистика
  fetch(`${BACKEND}/api/stats/total_users`, {
    headers: { Authorization:`Bearer ${tok}` }
  })
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j) setTotal(j.total); })
    .catch(()=>{});
}, [nav]);

  /* ─── Helpers ───────────────────────────────────────── */
  const copy = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCp(true);
      setTimeout(() => setCp(false), 1500);
    } catch {}
  };

  const claim = async () => {
    setCB(true);
    try {
      const tok = localStorage.getItem('token');
      const { fragment } = await claimReferral(tok);
      setRw(true);
      alert(`🎉 You received fragment #${fragment}!`);
    } catch (e) {
      alert(e.message);
    } finally {
      setCB(false);
    }
  };

  const delProfile = async () => {
    setBusy(true);
    setDErr('');
    try {
      const uid = window.Telegram.WebApp.initDataUnsafe.user.id;
      await fetch(`${BACKEND}/api/player/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      localStorage.clear();
      nav('/');
    } catch (e) {
      setDErr(e.message);
      setBusy(false);
    }
  };

  /* ─── Guards ────────────────────────────────────────── */
  if (loading) return <div style={S.page}><p style={S.load}>Loading…</p></div>;
  if (error)   return <div style={S.page}><p style={S.err}>{error}</p></div>;

  const rows     = [[1,2,3,4],[5,6,7,8]];
  const progress = Math.min(invCnt, 3);

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

        <button style={S.act} onClick={()=>nav('/path')}>
          🔥 Burn Again
        </button>

        <div style={S.refBox}>
          <p style={S.refLabel}>Your referral code</p>
          <div style={S.refCodeRow}>
            <span style={S.refCode}>{refCode || '—'}</span>
            <button style={S.copyBtn} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p style={S.progress}>Invited {progress}/3</p>
          {progress >= 3 && !reward && (
            <button style={S.claim} disabled={claimB} onClick={claim}>
              {claimB ? 'Processing…' : 'Claim free fragment'}
            </button>
          )}
          {reward && <p style={S.claimed}>Reward already claimed ✅</p>}
        </div>

        {total !== null && (
          <p style={S.count}>Ash Seekers: {total.toLocaleString()}</p>
        )}

        {frags.length === 8 && (
          <button
            style={{ ...S.act, marginTop:6, fontSize:16 }}
            onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <div style={{ flexGrow:1 }}/>
        <button style={S.del} onClick={()=>setAsk(true)}>
          Delete profile
        </button>
      </div>

      {ask && (
        <div style={S.wrap} onClick={()=>!busy&&setAsk(false)}>
          <div style={S.box} onClick={e=>e.stopPropagation()}>
            <p style={{ margin:'0 0 12px', fontSize:17 }}>
              Delete profile permanently?
            </p>
            {dErr && <p style={{ color:'#f66', fontSize:14 }}>{dErr}</p>}
            <button style={S.ok} disabled={busy} onClick={delProfile}>
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button style={S.cancel} disabled={busy} onClick={()=>setAsk(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {zoomSrc && (
        <div style={S.zoomWrap} onClick={()=>setZoom('')}>
          <img
            src={zoomSrc}
            style={S.zoomImg}
            onClick={()=>setZoom('')}
          />
        </div>
      )}
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────── */
const S = {
  page:{ minHeight:'100vh', background:'url("/profile-bg.webp") center/cover',
         display:'flex',justifyContent:'center',alignItems:'center',
         padding:16,color:'#d4af37',fontFamily:'serif' },
  load:{ fontSize:18 }, err:{ fontSize:16,color:'#f66' },

  card:{ width:'100%',maxWidth:360,minHeight:520,background:'rgba(0,0,0,0.55)',
         padding:20,borderRadius:8,display:'flex',flexDirection:'column',
         textAlign:'center' },
  h:{ margin:0,fontSize:26 }, sub:{ fontSize:14,margin:'6px 0 18px',
                                     opacity:.85 },

  row:{ display:'flex',gap:6,marginBottom:6 },
  slot:{ flex:'1 1 0',aspectRatio:'1/1',background:'#111',
         border:'1px solid #d4af37',borderRadius:6,overflow:'hidden' },
  img:{ width:'100%',height:'100%',objectFit:'cover',cursor:'pointer' },

  refBox:{ background:'rgba(0,0,0,0.6)',border:'1px solid #d4af37',
           borderRadius:8,boxShadow:'0 0 8px rgba(0,0,0,0.5)',
           padding:16,display:'flex',flexDirection:'column',
           alignItems:'center',gap:8,margin:'24px 0' },
  refLabel:{ margin:0,fontSize:14,opacity:.8 },
  refCodeRow:{ display:'flex',alignItems:'center',gap:12 },
  refCode:{ fontSize:18,fontWeight:600,color:'#d4af37' },
  copyBtn:{ padding:'6px 12px',fontSize:13,border:'none',
            borderRadius:4,background:'#d4af37',color:'#000',
            cursor:'pointer' },
  progress:{ margin:0,fontSize:13,opacity:.85 },
  claim:{ marginTop:10,padding:10,width:'100%',fontSize:14,
          border:'none',borderRadius:6,background:'#6BCB77',
          color:'#000',cursor:'pointer' },
  claimed:{ marginTop:10,fontSize:13,color:'#6BCB77' },

  count:{ fontSize:14,margin:'14px 0 18px',opacity:.85 },
  act:{ padding:10,fontSize:15,borderRadius:6,border:'none',
        background:'#d4af37',color:'#000',cursor:'pointer' },
  del:{ padding:10,fontSize:14,borderRadius:6,border:'none',
        background:'#a00',color:'#fff',cursor:'pointer',marginTop:8 },

  wrap:{ position:'fixed',inset:0,background:'#0007',
         backdropFilter:'blur(4px)',display:'flex',
         justifyContent:'center',alignItems:'center',zIndex:40 },
  box:{ background:'#222',padding:24,borderRadius:10,width:300,
        color:'#fff',textAlign:'center' },
  ok:{ width:'100%',padding:10,fontSize:15,border:'none',
       borderRadius:6,background:'#d4af37',color:'#000',
       cursor:'pointer' },
  cancel:{ width:'100%',padding:10,fontSize:14,marginTop:10,
           border:'none',borderRadius:6,background:'#555',
           color:'#fff',cursor:'pointer' },

  zoomWrap:{ position:'fixed',inset:0,background:'#000d',zIndex:60,
             display:'flex',justifyContent:'center',alignItems:'center' },
  zoomImg:{ maxWidth:'90vw',maxHeight:'86vh',borderRadius:10 },
};
