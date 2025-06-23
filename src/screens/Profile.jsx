import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoice, checkBurnStatus } from '../api/burn.js';
import { claimReferral } from '../api/referral.js';

const SLUG = [
  'the_whisper','the_number','the_language','the_mirror',
  'the_chain','the_hour','the_mark','the_gate'
];

export default function Profile() {
  const nav = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [name, setName]           = useState('');
  const [frags, setFrags]         = useState([]);
  const [total, setTotal]         = useState(null);

  // burn
  const [paying, setPaying]       = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  // referral
  const [refCode, setRefCode]     = useState('');
  const [invCnt, setInvCnt]       = useState(0);
  const [reward, setReward]       = useState(false);
  const [claiming, setClaiming]   = useState(false);
  const [copied, setCopied]       = useState(false);

  // delete
  const [askDel, setAskDel]       = useState(false);
  const [busyDel, setBusyDel]     = useState(false);
  const [delError, setDelError]   = useState('');

  // zoom
  const [zoomSrc, setZoomSrc]     = useState('');

  const token = localStorage.getItem('token');
  const uid   = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  // проверяем статус непогашенного invoice
  const pollStatus = useCallback(async (invoiceId) => {
    try {
      const { paid, newFragment } = await checkBurnStatus(invoiceId);
      if (paid) {
        if (newFragment != null) {
          setFrags(prev => [...prev, newFragment]);
        }
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('invoiceUrl');
        setPaying(false);
      } else {
        // если всё ещё не paid — оставляем paying = true
        setPaying(true);
      }
    } catch {
      setPaying(true);
    }
  }, []);

  useEffect(() => {
    if (!uid || !token) {
      localStorage.removeItem('token');
      nav('/init');
      return;
    }

    (async () => {
      try {
        // 1) профиль + фраги + рефералка сразу
        const resp = await fetch(`/api/player/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if ([401,403,404].includes(resp.status)) throw new Error();
        const pj = await resp.json();
        setName(pj.name || '');
        setFrags(pj.fragments || []);
        setRefCode(pj.ref_code || '');
        setInvCnt(pj.invitedCount || 0);
        setReward(!!pj.referral_reward_issued);
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }

      // 2) общая статистика
      fetch('/api/stats/total_users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(j => j && setTotal(j.total))
        .catch(() => {});

      // 3) если есть незавершённый invoice
      const pid = localStorage.getItem('invoiceId');
      const purl = localStorage.getItem('invoiceUrl');
      if (pid && purl) {
        setPaying(true);
        setInvoiceUrl(purl);
        pollStatus(pid);
      }
    })();
  }, [uid, token, nav, pollStatus]);

  const burn = async () => {
    try {
      const { invoiceId, paymentUrl } = await createInvoice(token, uid);
      localStorage.setItem('invoiceId', invoiceId);
      localStorage.setItem('invoiceUrl', paymentUrl);
      setInvoiceUrl(paymentUrl);
      setPaying(true);
      window.open(paymentUrl, '_blank');
    } catch {
      alert('Failed to create invoice');
    }
  };

  const claim = async () => {
    setClaiming(true);
    try {
      const { fragment } = await claimReferral(token);
      setReward(true);
      if (fragment != null) {
        setFrags(prev => [...prev, fragment]);
      }
      alert('🎉 Free fragment received!');
    } catch (e) {
      alert(e.message);
    } finally {
      setClaiming(false);
    }
  };

  const copyCode = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const deleteProfile = async () => {
    setBusyDel(true);
    setDelError('');
    try {
      await fetch(`/api/player/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      nav('/');
    } catch (e) {
      setDelError(e.message);
      setBusyDel(false);
    }
  };

  if (loading) return <div style={S.page}><p style={S.load}>Loading…</p></div>;
  if (error)   return <div style={S.page}><p style={S.err}>{error}</p></div>;

  const rows     = [[1,2,3,4],[5,6,7,8]];
  const progress = Math.min(invCnt, 3);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h}>{name}</h2>
        <p style={S.sub}>Fragments {frags.length}/8</p>

        {rows.map((r,i) => (
          <div key={i} style={S.row}>
            {r.map(id => (
              <div key={id} style={S.slot}>
                {frags.includes(id) && (
                  <img
                    src={`/fragments/fragment_${id}_${SLUG[id-1]}.webp`}
                    style={S.img}
                    onClick={() => setZoomSrc(`/fragments/fragment_${id}_${SLUG[id-1]}.webp`)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {paying ? (
          <button style={{ ...S.act, opacity: 0.6 }} disabled>
            Awaiting payment
          </button>
        ) : (
          <button style={S.act} onClick={burn}>
            🔥 Burn Again
          </button>
        )}

        <div style={S.refBox}>
          <p style={S.refLabel}>Your referral code</p>
          <div style={S.refCodeRow}>
            <span style={S.refCode}>{refCode || '—'}</span>
            <button style={S.copyBtn} onClick={copyCode}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p style={S.progress}>Invited {progress}/3</p>
          {!reward && progress >= 3 && (
            <button style={S.claim} disabled={claiming} onClick={claim}>
              {claiming ? 'Processing…' : 'Claim free fragment'}
            </button>
          )}
          {reward && <p style={S.claimed}>Reward already claimed ✅</p>}
        </div>

        {total !== null && (
          <p style={S.count}>Ash Seekers: {total.toLocaleString()}</p>
        )}

        {frags.length === 8 && (
          <button style={{ ...S.act, marginTop:6, fontSize:16 }} onClick={() => nav('/final')}>
            🗝 Enter Final Phrase
          </button>
        )}

        <div style={{ flexGrow: 1 }} />
        <button style={S.del} onClick={() => setAskDel(true)}>
          Delete profile
        </button>
      </div>

      {askDel && (
        <div style={S.wrap} onClick={() => !busyDel && setAskDel(false)}>
          <div style={S.box} onClick={e => e.stopPropagation()}>
            <p style={{ margin:'0 0 12px', fontSize:17 }}>
              Delete profile permanently?
            </p>
            {delError && <p style={{ color:'#f66', fontSize:14 }}>{delError}</p>}
            <button style={S.ok} disabled={busyDel} onClick={deleteProfile}>
              {busyDel ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button style={S.cancel} disabled={busyDel} onClick={() => setAskDel(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {zoomSrc && (
        <div style={S.zoomWrap} onClick={() => setZoomSrc('')}>
          <img src={zoomSrc} style={S.zoomImg} onClick={() => setZoomSrc('')} />
        </div>
      )}
    </div>
  );
}
/* Стили */
const S = {
  page: {
    minHeight: '100vh',
    background: 'url("/profile-bg.webp") center/cover',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: 16, color: '#d4af37', fontFamily: 'serif'
  },
  load: { fontSize: 18 },
  err:  { fontSize: 16, color: '#f66' },

  card: {
    width:'100%', maxWidth:360, minHeight:520,
    background:'rgba(0,0,0,0.55)', padding:20,
    borderRadius:8, display:'flex', flexDirection:'column',
    textAlign:'center'
  },
  h:   { margin:0, fontSize:26 },
  sub: { fontSize:14, margin:'6px 0 18px', opacity:.85 },

  row:{ display:'flex', gap:6, marginBottom:6 },
  slot:{
    flex:'1 1 0', aspectRatio:'1/1', background:'#111',
    border:'1px solid #d4af37', borderRadius:6, overflow:'hidden'
  },
  img:{
    width:'100%', height:'100%', objectFit:'cover',
    cursor:'pointer'
  },

  refBox:{
    background:'rgba(0,0,0,0.6)', border:'1px solid #d4af37',
    borderRadius:8, boxShadow:'0 0 8px rgba(0,0,0,0.5)',
    padding:16, display:'flex', flexDirection:'column',
    alignItems:'center', gap:8, margin:'24px 0'
  },
  refLabel:{ margin:0, fontSize:14, opacity:.8 },
  refCodeRow:{ display:'flex', alignItems:'center', gap:12 },
  refCode:{ fontSize:18, fontWeight:600, color:'#d4af37' },
  copyBtn:{
    padding:'6px 12px', fontSize:13, border:'none',
    borderRadius:4, background:'#d4af37', color:'#000',
    cursor:'pointer'
  },
  progress:{ margin:0, fontSize:13, opacity:.85 },
  claim:{
    marginTop:10, padding:10, width:'100%', fontSize:14,
    border:'none', borderRadius:6, background:'#6BCB77',
    color:'#000', cursor:'pointer'
  },
  claimed:{ marginTop:10, fontSize:13, color:'#6BCB77' },

  count:{ fontSize:14, margin:'14px 0 18px', opacity:.85 },
  act:{
    padding:10, fontSize:15, borderRadius:6, border:'none',
    background:'#d4af37', color:'#000', cursor:'pointer'
  },
  del:{
    padding:10, fontSize:14, borderRadius:6, border:'none',
    background:'#a00', color:'#fff', cursor:'pointer',
    marginTop:8
  },

  wrap:{
    position:'fixed', inset:0, background:'#0007',
    backdropFilter:'blur(4px)', display:'flex',
    justifyContent:'center', alignItems:'center', zIndex:40
  },
  box:{
    background:'#222', padding:24, borderRadius:10,
    width:300, color:'#fff', textAlign:'center'
  },
  ok:{
    width:'100%', padding:10, fontSize:15,
    border:'none', borderRadius:6, background:'#d4af37',
    color:'#000', cursor:'pointer'
  },
  cancel:{
    width:'100%', padding:10, fontSize:14,
    marginTop:10, border:'none', borderRadius:6,
    background:'#555', color:'#fff', cursor:'pointer'
  },

  zoomWrap:{
    position:'fixed', inset:0, background:'#000d',
    zIndex:60, display:'flex', justifyContent:'center',
    alignItems:'center'
  },
  zoomImg:{
    maxWidth:'90vw', maxHeight:'86vh', borderRadius:10
  }
};
