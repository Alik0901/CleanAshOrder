// Path.jsx  ───────────────
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

// ⬅️ маленькая помощь для локального /debug
if (location.search.includes('debug=1')) {
  import('/logger.js');
}

export default function Path() {
  const nav = useNavigate();

  /* ───────── состояние ───────── */
  const [tgId        , setTgId]        = useState('');
  const [fragments   , setFragments]   = useState([]);
  const [lastBurn    , setLastBurn]    = useState(null);
  const [isCursed    , setIsCursed]    = useState(false);
  const [curseTill   , setCurseTill]   = useState(null);
  const [cooldown    , setCooldown]    = useState(0);

  const [loading     , setLoading]     = useState(true);
  const [burning     , setBurning]     = useState(false);
  const [polling     , setPolling]     = useState(false);

  const [invoiceId   , setInvoiceId]   = useState(null);
  const [hubUrl      , setHubUrl]      = useState('');
  const [tonUrl      , setTonUrl]      = useState('');
  const [newFragment , setNewFragment] = useState(null);
  const [error       , setError]       = useState('');

  const timer = useRef(null);
  const COOLDOWN_MS = 2 * 60_000;

  /* ───────── кулдаун-тикер ────── */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1_000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* ───────── начальная инициализация ────── */
  useEffect(() => {
    const unsafe = window.Telegram?.WebApp?.initDataUnsafe || {};
    const id = unsafe.user?.id;
    if (!id) { nav('/init'); return; }
    setTgId(String(id));

    const token = localStorage.getItem('token');
    if (!token) { nav('/init'); return; }

    // если был незаконченный платёж
    const saved = {
      id:  localStorage.getItem('invoiceId'),
      hub: localStorage.getItem('hubUrl'),
      ton: localStorage.getItem('tonUrl')
    };
    if (saved.id && saved.hub && saved.ton) {
      setInvoiceId(saved.id); setHubUrl(saved.hub); setTonUrl(saved.ton);
      setPolling(true);
      timer.current = setInterval(() => checkStatus(saved.id), 5_000);
    }

    loadProfile(id);
    window.addEventListener('focus', () => loadProfile(id));
    return () => window.removeEventListener('focus', () => loadProfile(id));
  }, [nav]);

  async function loadProfile(id) {
    try {
      const r = await fetch(`${BACKEND_URL}/api/player/${id}`);
      if (!r.ok) throw new Error();
      const p = await r.json();
      setFragments(p.fragments || []);
      setLastBurn (p.last_burn);
      const now = Date.now();
      if (p.curse_expires && new Date(p.curse_expires) > now) {
        setIsCursed(true);  setCurseTill(p.curse_expires);
      } else {
        setIsCursed(false); setCurseTill(null);
        setCooldown(Math.max(0, COOLDOWN_MS - (now - new Date(p.last_burn)) )/1000|0);
      }
    } finally { setLoading(false); }
  }

  /* ───────── «Сжечь» ────── */
  async function handleBurn() {
    setBurning(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${BACKEND_URL}/api/burn-invoice`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ tg_id: tgId })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');

      // сохраним и покажем
      localStorage.setItem('invoiceId', j.invoiceId);
      localStorage.setItem('hubUrl',    j.paymentUrl);
      localStorage.setItem('tonUrl',    j.tonspaceUrl);
      setInvoiceId(j.invoiceId); setHubUrl(j.paymentUrl); setTonUrl(j.tonspaceUrl);

      /* главное: убираем «creating…» и показываем «waiting…» */
      setBurning(false); setPolling(true);

      // открываем встроенный кошелёк
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(j.tonspaceUrl, { try_instant_view: false });
      } else {
        window.location.href = j.tonspaceUrl;
      }
      timer.current = setInterval(() => checkStatus(j.invoiceId), 5_000);

    } catch (e) { setError(e.message); setBurning(false); }
  }

  /* ───────── проверка статуса ────── */
  async function checkStatus(id) {
    const token = localStorage.getItem('token');
    const r = await fetch(`${BACKEND_URL}/api/burn-status/${id}`,
                          { headers:{ Authorization:`Bearer ${token}` } });
    const j = await r.json();
    if (!r.ok) { clearInterval(timer.current); setPolling(false); setError(j.error); return; }
    if (!j.paid) return;

    clearInterval(timer.current); setPolling(false);
    localStorage.removeItem('invoiceId'); localStorage.removeItem('hubUrl'); localStorage.removeItem('tonUrl');

    if (j.cursed) {
      setError(`⚠️ You are cursed until ${new Date(j.curse_expires).toLocaleString()}`);
      setIsCursed(true); setCurseTill(j.curse_expires);
    } else {
      setFragments(j.fragments); setNewFragment(j.newFragment);
      setLastBurn (j.lastBurn);  setCooldown(COOLDOWN_MS/1000);
    }
  }

  /* ───────── UI ────── */
  if (loading) return <div style={s.center}>Loading…</div>;

  const fmt = s => String(s).padStart(2,'0');
  const cd  = `${fmt(cooldown/60|0)}:${fmt(cooldown%60)}`;

  return (
    <div style={s.wrap}>
      <div style={s.dark}/>
      <div style={s.box}>
        <h2 style={s.h2}>The Path Begins</h2>

        {newFragment && <p style={s.ok}>🔥 Fragment #{newFragment} received!</p>}

        {isCursed ? <p style={s.txt}>⚠️ Cursed till {new Date(curseTill).toLocaleTimeString()}</p>
                   : cooldown>0 ? <p style={s.txt}>⏳ Next burn in {cd}</p>
                                 : <p style={s.txt}>Ready to burn yourself.</p>}

        <button style={s.btn}
                disabled={burning||polling||isCursed||cooldown>0}
                onClick={handleBurn}>
          { burning ? 'Creating invoice…'
                    : polling ? 'Waiting for payment…'
                              : '🔥 Burn Yourself for 0.5 TON' }
        </button>

        {polling && hubUrl && (
          <button style={s.sec}
                  onClick={()=> window.open(hubUrl,'_blank')}>
            Open in Tonhub
          </button>
        )}

        <button style={s.sec} onClick={()=>nav('/profile')}>
          Go to your personal account
        </button>
        {error && <p style={s.err}>{error}</p>}
      </div>
    </div>
  );
}

/* ─── styles ─── */
const s = {
  center:{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'#fff'},
  wrap  :{position:'relative',minHeight:'100vh',background:'url(/bg-path.webp) center/cover'},
  dark  :{position:'absolute',inset:0,background:'rgba(0,0,0,.55)'},
  box   :{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',
          padding:'70px 16px 32px',color:'#d4af37',textAlign:'center'},
  h2    :{fontSize:30,margin:'0 0 16px'},
  ok    :{fontSize:16,color:'#7CFC00',margin:0},
  txt   :{fontSize:15,margin:'12px 0'},
  btn   :{padding:'12px 26px',fontSize:15,borderRadius:6,border:'none',background:'#d4af37',color:'#000'},
  sec   :{marginTop:14,padding:'10px 24px',fontSize:14,borderRadius:6,
          border:'1px solid #d4af37',background:'transparent',color:'#d4af37'},
  err   :{marginTop:12,fontSize:14,color:'#ff5c5c'}
};
