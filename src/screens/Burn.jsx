// src/screens/Burn.jsx
import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

/**
 * Burn screen — quest-first flow
 *
 * 1) idle → create invoice
 * 2) awaiting → poll /burn-status/:id until { paid: true, task }
 * 3) task → user solves and submits → POST /burn-complete/:id { success:true, answer }
 * 4) if awardedFragment -> set newFragmentNotice, refresh user, go /gallery
 *
 * No extra polling outside of payment wait. "To Gallery" button included.
 */

const TON_AMOUNT_NANO = 500_000_000; // 0.5 TON

export default function Burn() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useContext(AuthContext);

  const [stage, setStage] = useState('idle'); // idle | awaiting | task
  const [invoiceId, setInvoiceId] = useState(null);
  const [statusErr, setStatusErr] = useState('');

  // quest
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef(null);

  const isCursed = !!user?.is_cursed;
  const hasTutorial = useMemo(() => {
    const fr = user?.fragments || [];
    return fr.includes(1) && fr.includes(2) && fr.includes(3);
  }, [user?.fragments]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startBurn = async () => {
    if (!user || isCursed || !hasTutorial) return;
    setStatusErr('');
    try {
      const res = await API.createBurn(user.tg_id, TON_AMOUNT_NANO);
      setInvoiceId(res.invoiceId);
      setStage('awaiting');

      // Poll payment status ONLY while awaiting
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const st = await API.getBurnStatus(res.invoiceId);
          if (st?.paid) {
            clearInterval(pollRef.current); pollRef.current = null;
            if (st.task) {
              setTask(st.task);
              setStage('task');
            } else {
              // small retry after 1s in case task propagation lags
              setTimeout(async () => {
                try {
                  const st2 = await API.getBurnStatus(res.invoiceId);
                  if (st2?.task) { setTask(st2.task); setStage('task'); }
                } catch (_) {}
              }, 1000);
            }
          }
        } catch (e) {
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('invalid token')) { logout(); navigate('/login'); }
        }
      }, 2000);
    } catch (e) {
      const msg = e?.message || 'Failed to create burn';
      setStatusErr(msg);
      if (msg.toLowerCase().includes('invalid token')) { logout(); navigate('/login'); }
    }
  };

  const submitQuest = async () => {
    if (!invoiceId || !task) return;
    if (!answer) { setStatusErr('Choose or enter the answer'); return; }
    setSubmitting(true); setStatusErr('');
    try {
      const resp = await API.completeBurn(invoiceId, true, { answer });
      if (resp?.ok) {
        if (Number.isFinite(resp.awardedFragment)) {
          try { localStorage.setItem('newFragmentNotice', String(resp.awardedFragment)); } catch {}
        }
        if (resp?.cursed) {
          // nothing special: UI will pick up curse on refresh
        }
        if (typeof refreshUser === 'function') {
          try { await refreshUser({ force: true }); } catch {}
        }
        navigate('/gallery');
      } else {
        setStatusErr(resp?.error || 'Quest failed');
      }
    } catch (e) {
      setStatusErr(e?.message || 'Failed to complete burn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"url('/images/bg-burn.webp')", backgroundSize:'cover', backgroundPosition:'center' }} />
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)' }} />

      <BackButton style={{ position:'absolute', top:16, left:16, zIndex:5, color:'#fff' }} />

      <h1 style={{ position:'absolute', top:25, left:41, fontSize:36, fontWeight:700, color:'#D6CEBD', zIndex:5 }}>Burn Yourself</h1>

      {/* Rarity panel placeholder — keep your actual UI */}
      <div style={{ position:'absolute', top:100, left:40, width:280, color:'#fff', zIndex:5 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 16px', marginBottom:12 }}>
          <strong>Legendary</strong><span>5%</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 16px', marginBottom:12 }}>
          <strong>Rare</strong><span>15%</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 16px', marginBottom:12 }}>
          <strong>Uncommon</strong><span>30%</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 16px' }}>
          <strong>Common</strong><span>50%</span>
        </div>
      </div>

      {/* Error */}
      {statusErr && (
        <div style={{ position:'absolute', top:380, left:40, width:280, color:'tomato', zIndex:5 }}>{statusErr}</div>
      )}

      {/* CTA */}
      {stage === 'idle' && !isCursed && hasTutorial && (
        <div onClick={startBurn} style={{
          position:'absolute', left:64, top:436, width:265, height:76,
          backgroundImage:'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)', boxShadow:'0px 6px 6px rgba(0,0,0,0.87)', borderRadius:40,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:5,
        }}>
          <span style={{ fontFamily:'Tajawal, sans-serif', fontWeight:700, fontSize:24, color:'#FFF' }}>BURN 0,5 TON</span>
        </div>
      )}

      {/* Locked states */}
      {stage === 'idle' && (!hasTutorial || isCursed) && (
        <div style={{ position:'absolute', top:430, left:40, width:280, color:'#fff', zIndex:5, textAlign:'center', opacity:0.85 }}>
          {!hasTutorial && <p style={{ margin:0 }}>Collect fragments #1–#3 to unlock burns.</p>}
          {isCursed && <p style={{ margin:'6px 0 0' }}>You are cursed. Wait until the curse expires to burn again.</p>}
        </div>
      )}

      {/* Awaiting payment */}
      {stage === 'awaiting' && (
        <div style={{ position:'absolute', top:430, left:40, width:280, color:'#fff', zIndex:5, textAlign:'center' }}>
          <p style={{ margin:0 }}>Waiting for payment…</p>
          <p style={{ margin:'6px 0 0', fontSize:12, opacity:0.8 }}>Invoice: {invoiceId}</p>
        </div>
      )}

      {/* Task */}
      {stage === 'task' && task && (
        <div style={{ position:'absolute', top:420, left:'50%', transform:'translateX(-50%)', width:320, background:'rgba(0,0,0,0.6)', border:'1px solid #9E9191', color:'#fff', borderRadius:16, padding:16, zIndex:6 }}>
          <p style={{ margin:'0 0 12px', fontFamily:'Tajawal, sans-serif', fontWeight:700 }}>
            {task.params?.question || 'Solve the quest to complete the burn:'}
          </p>

          {task.type === 'quiz' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(task.params?.options || []).map((opt) => (
                <label key={String(opt)} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type='radio' name='burn-quiz' value={String(opt)} onChange={(e) => setAnswer(e.target.value)} />
                  <span>{String(opt)}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type='text'
              placeholder='Your answer'
              value={answer}
              onChange={(e)=>setAnswer(e.target.value)}
              style={{ width:'100%', height:40, padding:'0 12px', borderRadius:10, border:'1px solid #9E9191', background:'#161616', color:'#fff' }}
            />
          )}

          <button
            onClick={submitQuest}
            disabled={!answer || submitting}
            style={{
              marginTop:16, width:'100%', height:44,
              background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
              border:'none', borderRadius:10, color:'#fff', fontWeight:700,
              cursor:(!answer||submitting)?'default':'pointer', opacity:(!answer||submitting)?0.6:1
            }}
          >
            {submitting ? 'Submitting…' : 'Complete Burn'}
          </button>
        </div>
      )}

      {/* To Gallery */}
      <div
        onClick={() => navigate('/gallery')}
        style={{
          position:'absolute', left:65, top:566, width:265, height:56,
          backgroundImage:'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)', boxShadow:'0px 6px 6px rgba(0,0,0,0.87)', borderRadius:40,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:5,
        }}
      >
        <span style={{ fontFamily:'Tajawal, sans-serif', fontWeight:700, fontSize:20, color:'#FFF', letterSpacing:0.5 }}>TO GALLERY</span>
      </div>
    </div>
  );
}
