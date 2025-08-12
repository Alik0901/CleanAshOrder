// src/screens/Referral.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';

export default function Referral() {
  const { logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [rewardIssued, setRewardIssued] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.getReferral();
        if (!mounted) return;
        // API возвращает именно { refCode, invitedCount, rewardIssued }
        setRefCode(res.refCode ?? res.ref_code ?? res.code ?? '');
        setInvitedCount(Number(res.invitedCount ?? res.invite_count ?? res.count ?? 0));
        setRewardIssued(Boolean(res.rewardIssued ?? res.reward_issued ?? false));
      } catch (e) {
        const msg = e?.message || 'Failed to load referral info';
        setError(msg);
        if (msg.toLowerCase().includes('invalid token')) { logout(); navigate('/login'); }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [logout, navigate]);

  const eligible = !rewardIssued && invitedCount >= 3;

  const claim = async () => {
    if (!eligible || claiming) return;
    setClaiming(true); setError('');
    try {
      const res = await API.claimReferral();
      if (res?.ok) {
        try { localStorage.setItem('newFragmentNotice', '2'); } catch {}
        if (typeof refreshUser === 'function') { try { await refreshUser({ force: true }); } catch {} }
        navigate('/gallery', { replace: true });
      } else {
        setError(res?.error || 'Unable to claim now');
      }
    } catch (e) {
      setError(e?.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position:'relative', width:'100%', height:'100vh', background:'#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden' }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"url('/images/bg-path.webp')", backgroundSize:'cover', backgroundPosition:'center' }} />
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} />

      <BackButton style={{ position:'absolute', top:16, left:16, zIndex:5, color:'#fff' }} />

      <h1 style={{ position:'absolute', top:25, left:41, fontSize:36, fontWeight:700, color:'#D6CEBD', zIndex:5 }}>Referral</h1>

      <div style={{ position:'absolute', top:120, left:'50%', transform:'translateX(-50%)', width:320, background:'rgba(0,0,0,0.6)', border:'1px solid #9E9191', color:'#fff', borderRadius:16, padding:16, zIndex:5 }}>
        {error && <div style={{ color:'tomato', marginBottom:8 }}>{error}</div>}

        <div style={{ marginBottom:12 }}>
          <div style={{ opacity:0.8, fontSize:12 }}>Your referral code</div>
          <div style={{ fontFamily:'Tajawal, sans-serif', fontWeight:700, fontSize:18 }}>{refCode || '—'}</div>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ opacity:0.8, fontSize:12 }}>Confirmed invites</div>
          <div style={{ fontFamily:'Tajawal, sans-serif', fontWeight:700, fontSize:18 }}>{invitedCount}</div>
        </div>

        <button
          onClick={claim}
          disabled={!eligible || claiming}
          style={{
            width:'100%', height:44, marginTop:8,
            background: eligible && !claiming ? 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)' : '#555',
            border:'none', borderRadius:10, color:'#fff', fontWeight:700,
            cursor: eligible && !claiming ? 'pointer' : 'default', opacity: eligible && !claiming ? 1 : 0.6
          }}
        >
          {claiming ? 'Claiming…' : rewardIssued ? 'Already claimed' : 'Claim Fragment #2'}
        </button>
      </div>
    </div>
  );
}
