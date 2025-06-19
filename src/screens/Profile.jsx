/* src/screens/Profile.jsx – профиль игрока + панель рефералов */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReferral, claimReferral } from '../api/referral.js';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const SLUG = [
  'the_whisper', 'the_number', 'the_language', 'the_mirror',
  'the_chain',   'the_hour',   'the_mark',     'the_gate'
];

export default function Profile() {
  const nav = useNavigate();

  /* общие состояния */
  const [loading, setLoad]   = useState(true);
  const [error,   setErr ]   = useState('');

  /* профиль игрока */
  const [name,  setName]  = useState('');
  const [frags, setFr  ]  = useState([]);
  const [total, setTotal] = useState(0);

  /* рефералка */
  const [refCode,  setCode] = useState('');
  const [invited,  setInv ] = useState(0);
  const [rewarded, setRw  ] = useState(false);
  const [claimBusy, setCB] = useState(false);
  const [copied,   setCp  ] = useState(false);

  /* удаление */
  const [ask,  setAsk]  = useState(false);
  const [busy, setBusy] = useState(false);
  const [dErr, setDErr] = useState('');

  /* ── загрузка данных ─────────────────────────────────────────────── */
  useEffect(() => {
    const uid   = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const token = localStorage.getItem('token');
    if (!uid || !token) { nav('/init'); return; }

    const load = async () => {
      try {
        /* профиль */
        const p = await fetch(`${BACKEND}/api/player/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!p.ok) throw new Error();
        const pj = await p.json();
        setName(pj.name);
        setFr(pj.fragments || []);

        /* реферал-прогресс */
        const ref = await fetchReferral(uid, token);
        setCode(ref.refCode);
        setInv(ref.invitedCount);
        setRw(ref.rewardIssued);

        /* глобальная статистика (может упасть – игнорируем) */
        const s = await fetch(`${BACKEND}/api/stats/total_users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (s.ok) setTotal((await s.json()).value || 0);
      } catch {
        setErr('Failed to load');
      }
      setLoad(false);
    };

    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [nav]);

  /* клипборд */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCp(true);
      setTimeout(() => setCp(false), 1500);
    } catch {/* ignore */}
  };

  /* claim бесплатного фрагмента */
  const claim = async () => {
    setCB(true);
    try {
      const token = localStorage.getItem('token');
      await claimReferral(token);
      setRw(true);
      alert('🎉 Free fragment received!');
      window.location.reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setCB(false);
    }
  };

  /* удаление профиля */
  const delProfile = async () => {
    setBusy(true); setDErr('');
    try {
      const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const tok = localStorage.getItem('token');
      const r = await fetch(`${BACKEND}/api/player/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error || 'Delete error');
      }
      localStorage.clear();
      nav('/');
    } catch (e) { setDErr(e.message); setBusy(false); }
  };

  /* ── guard screens ───────────────────────────────────────────────── */
  if (loading)
    return <div style={S.page}><p style={S.load}>Loading…</p></div>;
  if (error)
    return <div style={S.page}><p style={S.err}>{error}</p></div>;

  const rows = [[1,2,3,4],[5,6,7,8]];
  const progress = Math.min(invited, 3);

  /* ── JSX ─────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h}>{name}</h2>
        <p style={S.sub}>Fragments {frags.length}/8</p>

        {/* сетка фрагментов */}
        {rows.map((row,i)=>(
          <div key={i} style={S.row}>
            {row.map(id=>(
              <div key={id} style={S.slot}>
                {frags.includes(id) && (
                  <img
                    src={`/fragments/fragment_${id}_${SLUG[id-1]}.webp`}
                    style={S.img}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {/* панель рефералов */}
        <div style={S.refBox}>
          <p style={S.refLabel}>Your referral code</p>
          <div style={S.copyRow}>
            <input
              style={S.refInput}
              readOnly
              value={refCode}
              onClick={copy}
            />
            <button style={S.copyBtn} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p style={S.progress}>Invited {progress}/3</p>

          {progress >= 3 && !rewarded && (
            <button style={S.claim}
                    disabled={claimBusy}
                    onClick={claim}>
              {claimBusy ? 'Processing…' : 'Claim free fragment'}
            </button>
          )}

          {rewarded && (
            <p style={S.claimed}>Reward already claimed ✅</p>
          )}
        </div>

        <p style={S.count}>Ash Seekers: {total.toLocaleString()}</p>

        <button style={S.act} onClick={()=>nav('/path')}>🔥 Burn Again</button>

        {frags.length === 8 && (
          <button style={{...S.act,marginTop:6,fontSize:16}}
                  onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <div style={{flexGrow:1}} />

        <button style={S.del} onClick={()=>setAsk(true)}>Delete profile</button>
      </div>

      {/* confirm delete */}
      {ask && (
        <div style={S.wrap}>
          <div style={S.box}>
            <p style={{margin:'0 0 12px',fontSize:17}}>
              Delete profile permanently?
            </p>
            {dErr && <p style={{color:'#f66',fontSize:14}}>{dErr}</p>}
            <button style={S.ok} disabled={busy} onClick={delProfile}>
              {busy ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button style={S.cancel} disabled={busy} onClick={()=>setAsk(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────── */
const S = {
  /* layout */
  page : {minHeight:'100vh',background:'url("/profile-bg.webp") center/cover',
          display:'flex',justifyContent:'center',alignItems:'center',
          padding:16,color:'#d4af37',fontFamily:'serif'},
  load : {fontSize:18},
  err  : {fontSize:16,color:'#f66'},

  /* card */
  card : {width:'100%',maxWidth:360,minHeight:500,
          background:'rgba(0,0,0,.55)',padding:20,borderRadius:8,
          display:'flex',flexDirection:'column',alignItems:'stretch',
          textAlign:'center'},

  h    : {margin:0,fontSize:26},
  sub  : {fontSize:14,margin:'6px 0 18px',opacity:.85},

  /* fragments grid */
  row  : {display:'flex',gap:6,marginBottom:6},
  slot : {flex:'1 1 0',aspectRatio:'1/1',background:'#111',
          border:'1px solid #d4af37',borderRadius:6,overflow:'hidden'},
  img  : {width:'100%',height:'100%',objectFit:'cover'},

  /* referral panel */
  refBox  : {background:'#0004',padding:14,borderRadius:8,margin:'20px 0'},
  refLabel: {fontSize:14,margin:0,opacity:.8},
  copyRow : {display:'flex',marginTop:6,alignItems:'center',gap:6},
  refInput: {flex:1,padding:'8px 10px',fontSize:14,borderRadius:4,
             border:'1px solid #d4af37',background:'#111',color:'#d4af37'},
  copyBtn : {padding:'8px 12px',fontSize:13,border:'none',borderRadius:4,
             background:'#d4af37',color:'#000',cursor:'pointer'},
  progress: {fontSize:13,marginTop:8,opacity:.85},
  claim   : {marginTop:10,padding:10,width:'100%',fontSize:14,border:'none',
             borderRadius:6,background:'#6BCB77',color:'#000',cursor:'pointer'},
  claimed : {marginTop:10,fontSize:13,color:'#6BCB77'},

  /* misc */
  count:{fontSize:14,margin:'14px 0 18px',opacity:.85},
  act  : {padding:10,fontSize:15,borderRadius:6,border:'none',
          background:'#d4af37',color:'#000',cursor:'pointer'},
  del  : {padding:10,fontSize:14,borderRadius:6,border:'none',
          background:'#a00',color:'#fff',cursor:'pointer',marginTop:8},

  /* confirm delete */
  wrap : {position:'fixed',inset:0,background:'#0007',backdropFilter:'blur(4px)',
          display:'flex',justifyContent:'center',alignItems:'center',zIndex:40},
  box  : {background:'#222',padding:24,borderRadius:10,width:300,color:'#fff',
          textAlign:'center'},
  ok   : {width:'100%',padding:10,fontSize:15,border:'none',borderRadius:6,
          background:'#d4af37',color:'#000',cursor:'pointer'},
  cancel:{width:'100%',padding:10,fontSize:14,marginTop:10,border:'none',
          borderRadius:6,background:'#555',color:'#fff',cursor:'pointer'}
};
