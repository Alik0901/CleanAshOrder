// src/screens/Burn.jsx

import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';

function Countdown({ to }) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(to) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, new Date(to) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [to]);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <>{hh}:{mm}:{ss}</>;
}

export default function Burn() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // stages: idle → awaiting (poll payment) → task (show mini-quest)
  const [stage, setStage] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [error, setError] = useState('');
  const [curseModalUntil, setCurseModalUntil] = useState(null); // show modal on fresh curse

  // quest
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    if (!user?.tg_id) {
      logout();
      navigate('/login');
    }
  }, [user, logout, navigate]);

  // derived state
  const fragments = useMemo(() => (Array.isArray(user?.fragments) ? user.fragments.map(Number) : []), [user?.fragments]);
  const hasTutorial = useMemo(() => [1, 2, 3].every((n) => fragments.includes(n)), [fragments]);
  const isCursed = !!user?.is_cursed;
  const activeCurseUntil = useMemo(() => (isCursed && user?.curse_expires ? user.curse_expires : null), [isCursed, user?.curse_expires]);
  const burnDisabled = isCursed || !hasTutorial || loading || stage === 'awaiting' || stage === 'task';

  // clear poller on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startBurn = async () => {
    if (burnDisabled) return;
    setError('');
    setLoading(true);
    try {
      const inv = await API.createBurn(user.tg_id); // { invoiceId, tonhubUrl/tonspaceUrl }
      setInvoiceId(inv.invoiceId);
      setStage('awaiting');

      // start polling for payment → then expect task in /burn-status/:invoiceId
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const st = await API.getBurnStatus(inv.invoiceId); // { paid:boolean, task?: {...} }
          if (st?.paid) {
            clearInterval(pollRef.current); pollRef.current = null;
            if (st.task) {
              setTask(st.task);
              setStage('task');
            } else {
              // small fallback retry (sometimes task propagation is a tick late)
              setTimeout(async () => {
                try {
                  const st2 = await API.getBurnStatus(inv.invoiceId);
                  if (st2?.task) { setTask(st2.task); setStage('task'); }
                } catch (_) {}
              }, 800);
            }
          }
        } catch (e) {
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('invalid token')) { logout(); navigate('/login'); }
        }
      }, 2000);
    } catch (e) {
      setError(e.message || 'Failed to create burn invoice');
    } finally {
      setLoading(false);
    }
  };

  const submitQuest = async () => {
    if (!invoiceId || !task) return;
    if (!answer) { setError('Choose or enter the answer'); return; }
    setSubmitting(true); setError('');
    try {
      const resp = await API.completeBurn(invoiceId, true, { answer });
      if (resp?.ok) {
        if (resp.cursed) {
          // curse — show modal, refresh profile, do not navigate away
          setCurseModalUntil(resp.curse_expires || activeCurseUntil || null);
          if (typeof refreshUser === 'function') { try { await refreshUser({ force: true }); } catch {} }
          setStage('idle'); // exit task stage
        } else {
          const awarded = (resp.newFragment ?? resp.awardedFragment);
          if (Number.isFinite(awarded)) { try { localStorage.setItem('newFragmentNotice', String(awarded)); } catch {} }
          if (typeof refreshUser === 'function') { try { await refreshUser({ force: true }); } catch {} }
          navigate('/gallery');
        }
      } else {
        setError(resp?.error || 'Quest failed');
      }
    } catch (e) {
      setError(e?.message || 'Failed to complete burn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/bg-burn.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />

      <BackButton style={{ position: 'absolute', top: 16, left: 16, zIndex: 5, color: '#fff' }} />

      <h1
        style={{
          position: 'absolute',
          top: 25,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 40,
          lineHeight: '48px',
          color: '#D6CEBD',
          zIndex: 5,
          whiteSpace: 'nowrap',
        }}
      >
        Burn Yourself
      </h1>

      {/* Curse banner (if user already cursed) */}
      {activeCurseUntil && (
        <div style={{
          position:'absolute', top:80, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.6)', color:'#fff', border:'1px solid #9E9191',
          padding:'8px 12px', borderRadius:12, zIndex:6, whiteSpace:'nowrap'
        }}>
          You are cursed. Time left: <Countdown to={activeCurseUntil} />
        </div>
      )}

      {/* CTA — always visible, just disabled when blocked */}
      <div style={{ position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 5, width: 320, textAlign: 'center' }}>
        {error && <div style={{ color: 'tomato', marginBottom: 12 }}>{error}</div>}

        <button
          onClick={startBurn}
          disabled={burnDisabled}
          style={{
            width: 280,
            height: 50,
            background: burnDisabled ? 'linear-gradient(90deg,#777,#555)' : 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
            border: 'none',
            borderRadius: 30,
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            cursor: burnDisabled ? 'not-allowed' : 'pointer',
            opacity: burnDisabled ? 0.7 : 1,
          }}
          title={!hasTutorial ? 'Collect fragments #1–#3 to unlock burns' : isCursed ? 'You are cursed right now' : ''}
        >
          {loading || stage === 'awaiting' ? 'Processing…' : 'Start Burn'}
        </button>

        <button
          onClick={() => navigate('/gallery')}
          style={{
            marginTop: 40,
            width: 280,
            height: 50,
            background: 'linear-gradient(90deg, #777 0%, #555 100%)',
            border: 'none',
            borderRadius: 30,
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          Back to Gallery
        </button>
      </div>

      {/* Awaiting payment overlay */}
      {stage === 'awaiting' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#fff', fontSize: 18 }}>Waiting for payment…</span>
        </div>
      )}

      {/* Task overlay (after paid) */}
      {stage === 'task' && task && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div style={{
            width: 320,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid #9E9191',
            color: '#fff',
            borderRadius: 16,
            padding: 16,
          }}>
            <p style={{ margin: '0 0 12px', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>
              {task.params?.question || 'Solve the quest to complete the burn:'}
            </p>

            {task.type === 'quiz' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(task.params?.options || []).map((opt) => (
                  <label key={String(opt)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="radio" name="burn-quiz" value={String(opt)} onChange={(e) => setAnswer(e.target.value)} />
                    <span>{String(opt)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #9E9191', background: '#161616', color: '#fff' }}
              />
            )}

            {error && <div style={{ color: 'tomato', marginTop: 10 }}>{error}</div>}

            <button
              onClick={submitQuest}
              disabled={!answer || submitting}
              style={{
                marginTop: 16,
                width: '100%',
                height: 44,
                background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                cursor: !answer || submitting ? 'default' : 'pointer',
                opacity: !answer || submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting…' : 'Complete Burn'}
            </button>
          </div>
        </div>
      )}

      {/* Curse modal shown right after result with curse */}
      {curseModalUntil && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:30 }}>
          <div style={{ width:320, background:'#2a2a2a', color:'#fff', border:'1px solid #9E9191', borderRadius:16, padding:16, textAlign:'center' }}>
            <h3 style={{ margin:'0 0 10px' }}>You are cursed</h3>
            <p style={{ margin:'0 0 6px' }}>The ritual failed. No fragment was granted.</p>
            {curseModalUntil && (
              <p style={{ margin:'0 0 12px' }}>Time left: <strong><Countdown to={curseModalUntil} /></strong></p>
            )}
            <button
              onClick={async () => {
                setCurseModalUntil(null);
                if (typeof refreshUser === 'function') { try { await refreshUser({ force: true }); } catch {} }
              }}
              style={{ width:'100%', height:44, background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:'pointer' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
