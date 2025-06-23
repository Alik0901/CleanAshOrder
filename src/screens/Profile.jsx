// src/screens/Profile.jsx – v3.7

import React, { useEffect, useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import { claimReferral }      from '../api/referral.js';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const SLUG = [
  'the_whisper','the_number','the_language','the_mirror',
  'the_chain','the_hour','the_mark','the_gate'
];

export default function Profile() {
  const nav = useNavigate();

  // базовый стейт
  const [loading, setLoading] = useState(true);
  const [error,   setError ]  = useState('');
  const [name,    setName  ]  = useState('');
  const [frags,   setFrags ]  = useState([]);

  // общая статистика
  const [total, setTotal] = useState(null);

  // реферальная инфа
  const [refCode, setRefCode]       = useState('');
  const [invitedCount, setInvited]  = useState(0);
  const [rewardIssued, setReward]   = useState(false);
  const [claiming, setClaiming]     = useState(false);
  const [copied, setCopied]         = useState(false);

  // удаление профиля
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [delError, setDelError]     = useState('');

  // зум картинки
  const [zoomSrc, setZoomSrc]       = useState('');

  useEffect(() => {
    const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const token = localStorage.getItem('token');
    if (!uid || !token) {
      localStorage.removeItem('token');
      nav('/init');
      return;
    }

    (async () => {
      try {
        // 1) профиль + реферальные данные
        const res = await fetch(`${BACKEND}/api/player/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }
        const data = await res.json();
        setName(data.name || '');
        setFrags(data.fragments || []);
        setRefCode(data.ref_code || '');
        setInvited(data.invitedCount || 0);
        setReward(!!data.referral_reward_issued);
      } catch (err) {
        console.error('Profile load error', err);
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }

      // 2) общая статистика (fire-and-forget)
      fetch(`${BACKEND}/api/stats/total_users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(j => j && setTotal(j.total))
        .catch(()=>{/* silent */});
    })();
  }, [nav]);

  // копировать код
  const onCopy = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(()=>setCopied(false),1500);
    } catch {}
  };

  // забрать бесплатный фрагмент
  const onClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const { ok } = await claimReferral(token);
      if (ok) {
        setReward(true);
        alert('🎉 Вы получили бесплатный фрагмент!');
        // можно перезагрузить или добавить новый фрагмент в state
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setClaiming(false);
    }
  };

  // удалить профиль
  const onDelete = async () => {
    setDeleting(true);
    setDelError('');
    try {
      const uid = window.Telegram.WebApp.initDataUnsafe.user.id;
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/api/player/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || `status ${res.status}`);
      }
      localStorage.clear();
      nav('/');
    } catch (err) {
      console.error('Delete error', err);
      setDelError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={S.page}><p style={S.load}>Loading…</p></div>
  );
  if (error) return (
    <div style={S.page}><p style={S.err}>{error}</p></div>
  );

  const rows = [[1,2,3,4],[5,6,7,8]];
  const canClaim = invitedCount >= 3 && !rewardIssued;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h}>{name}</h2>
        <p style={S.sub}>Fragments {frags.length}/8</p>

        {rows.map((r,idx)=>(
          <div key={idx} style={S.row}>
            {r.map(id=>(
              <div key={id} style={S.slot}>
                {frags.includes(id)&&(
                  <img
                    src={`/fragments/fragment_${id}_${SLUG[id-1]}.webp`}
                    style={S.img}
                    onClick={()=>setZoomSrc(`/fragments/fragment_${id}_${SLUG[id-1]}.webp`)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        <button style={S.act} onClick={()=>nav('/path')}>
          🔥 Burn Again
        </button>

        {/* рефералка */}
        <div style={S.refBox}>
          <p style={S.refLabel}>Your referral code</p>
          <div style={S.refCodeRow}>
            <span style={S.refCode}>{refCode || '—'}</span>
            <button style={S.copyBtn} onClick={onCopy}>
              {copied?'Copied':'Copy'}
            </button>
          </div>

          <p style={S.progress}>
            Invited {invitedCount}/3
          </p>

          {canClaim && (
            <button style={S.claim} disabled={claiming} onClick={onClaim}>
              {claiming?'Processing…':'Claim free fragment'}
            </button>
          )}
          {rewardIssued && (
            <p style={S.claimed}>Reward already claimed ✅</p>
          )}
        </div>

        {total!==null && (
          <p style={S.count}>Ash Seekers: {total.toLocaleString()}</p>
        )}

        {frags.length===8 && (
          <button style={{...S.act,marginTop:6,fontSize:16}}
                  onClick={()=>nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <div style={{flexGrow:1}}/>
        <button style={S.del} onClick={()=>setConfirmDel(true)}>
          Delete profile
        </button>
      </div>

      {/* Подтверждение удаления */}
      {confirmDel && (
        <div style={S.wrap} onClick={()=>!deleting&&setConfirmDel(false)}>
          <div style={S.box} onClick={e=>e.stopPropagation()}>
            <p style={{margin:'0 0 12px',fontSize:17}}>
              Delete profile permanently?
            </p>
            {delError && <p style={{color:'#f66',fontSize:14}}>{delError}</p>}
            <button style={S.ok} disabled={deleting} onClick={onDelete}>
              {deleting?'Deleting…':'Yes, delete'}
            </button>
            <button style={S.cancel} disabled={deleting}
                    onClick={()=>setConfirmDel(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Зум overlay */}
      {zoomSrc && (
        <div style={S.zoomWrap} onClick={()=>setZoomSrc('')}>
          <img src={zoomSrc} style={S.zoomImg}
               onClick={()=>setZoomSrc('')} />
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
