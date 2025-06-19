/*  src/screens/Init.jsx
    ─────────────────────────────────────────────────────────
    Регистрация + передача реферального кода (?ref=XYZ).
*/
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const RGX = /^[A-Za-z ]+$/;          // допустимые символы имени

export default function Init() {
  const nav      = useNavigate();
  const inputRef = useRef(null);

  /* базовые состояния */
  const [tgId, setTgId] = useState('');
  const [raw,  setRaw]  = useState('');
  const [note, setNote] = useState('Checking Telegram …');

  const [loading, setLoading] = useState(true);   // прячем форму до ответа бэка
  const [busy,    setBusy]    = useState(false);  // блокируем во время submit

  /* форма */
  const [name, setName] = useState('');
  const okName          = RGX.test(name.trim()) && name.trim().length > 0;

  /* приветственное модальное окно */
  const [showInfo, setInfo] = useState(false);

  /* ★ Читаем ?ref=XYZ при первом рендере */
  const [refCode] = useState(
    () => new URLSearchParams(window.location.search).get('ref') || ''
  );

  /* ── 1. Bootstrap через Telegram Web-App SDK ─────────────────────── */
  useEffect(() => {
    const wa  = window.Telegram?.WebApp;
    const uid = wa?.initDataUnsafe?.user?.id;

    if (!wa)  { setNote('Telegram WebApp unavailable'); setLoading(false); return; }
    if (!uid) { setNote('Unable to read Telegram ID');  setLoading(false); return; }

    setTgId(String(uid));
    setRaw(wa.initData || '');
    // loading остаётся true — ждём backend-проверку
  }, []);

  /* ── 2. Проверка игрока на сервере ───────────────────────────────── */
  useEffect(() => {
    if (!tgId) return;

    const INFO_KEY = `aoa_info_seen_${tgId}`;

    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/player/${tgId}`);

        if (res.ok) {                       // игрок уже есть → выдаём свежий JWT
          const tokenRes = await fetch(`${BACKEND}/api/init`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ tg_id: tgId, name: '', initData: raw })
          });
          const j = await tokenRes.json();
          if (j.token) localStorage.setItem('token', j.token);
          nav('/profile');
          return;
        }

        /* 404 → новый пользователь */
        if (!sessionStorage.getItem(INFO_KEY)) setInfo(true);
        setNote('Enter your name');
      } catch {
        setNote('Network error – try again');
      } finally {
        setLoading(false);
      }
    })();
  }, [tgId, raw, nav]);

  /* ── 3. Submit формы ─────────────────────────────────────────────── */
  const submit = async e => {
    e.preventDefault();
    if (busy || showInfo || !okName) return;

    setBusy(true);
    setNote('Submitting …');

    try {
      const r = await fetch(`${BACKEND}/api/init`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          tg_id        : tgId,
          name         : name.trim(),
          initData     : raw,
          /* передаём код пригласившего, если был в URL */
          referrer_code: refCode || undefined
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'init error');

      localStorage.setItem('token', j.token);
      nav('/path');
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── helpers для модалки info ────────────────────────────────────── */
  const INFO_KEY = `aoa_info_seen_${tgId}`;
  const confirmInfo = () => {
    sessionStorage.setItem(INFO_KEY, '1');
    setInfo(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* ── JSX ─────────────────────────────────────────────────────────── */
  return (
    <div style={st.wrap}>
      {/* ── Модальное окно с правилами ─────────────────────────────── */}
      {showInfo && (
        <div style={st.mask}>
          <div style={st.modal}>
            <h3 style={st.h3}>Welcome, Seeker!</h3>
            <p style={st.p}>
              • Every <b>burn</b> costs <b>0.5&nbsp;TON</b> and forges either a fragment
              or a <b>24-hour curse</b>.<br/>
              • You will <b>never spend more than 4&nbsp;TON</b> in total — eight burns
              is all it takes.<br/>
              • Gather the <b>8 unique fragments</b> to reveal a hidden incantation.<br/>
              • Enter that incantation to forge a <b>final NFT</b>; its look depends
              on your own path.<br/>
              • The first to enter the phrase becomes the winner.<br/>
              • Payments are <b>irreversible</b> — send exactly <b>0.5&nbsp;TON</b> each time.<br/><br/>
              <i>Tread carefully, and may the ashes guide you.</i>
            </p>
            <button style={st.ok} onClick={confirmInfo}>I understand</button>
          </div>
        </div>
      )}

      {/* ── Регистрационная карточка ───────────────────────────────── */}
      {!loading && (
        <form style={st.card} onSubmit={submit}>
          <h1 style={st.h1}>Enter&nbsp;the&nbsp;Ash</h1>
          <p style={st.sm}>Telegram&nbsp;ID: {tgId}</p>

          <input
            ref={inputRef}
            style={{ ...st.inp, opacity: showInfo ? 0.5 : 1 }}
            placeholder="Your name (A–Z only)"
            value={name}
            disabled={busy || showInfo}
            onChange={e => setName(e.target.value)}
          />

          <button
            type="submit"
            style={{ ...st.btn, opacity: (okName && !busy && !showInfo) ? 1 : 0.45 }}
            disabled={!okName || busy || showInfo}
          >
            Save and Continue
          </button>

          {note && <p style={st.note}>{note}</p>}
        </form>
      )}

      {/* простой статус во время initial-loading */}
      {loading && <p style={st.note}>{note}</p>}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────── */
const st = {
  wrap: {
    minHeight : '100vh',
    display   : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'url("/bg-init.webp") center/cover',
    padding   : 16,
    color     : '#f9d342',
    fontFamily: 'serif'
  },
  card: {
    background   : 'rgba(0,0,0,.72)',
    padding      : 24,
    borderRadius : 8,
    width        : '100%',
    maxWidth     : 360,
    display      : 'flex',
    flexDirection: 'column',
    gap          : 16,
    textAlign    : 'center'
  },
  h1  : { margin: 0, fontSize: 26 },
  sm  : { margin: 0, fontSize: 14, opacity: .85 },
  inp : {
    padding    : 12,
    fontSize   : 16,
    borderRadius: 4,
    border     : '1px solid #555',
    background : '#222',
    color      : '#fff',
    transition : 'opacity .25s'
  },
  btn : {
    padding    : 12,
    fontSize   : 16,
    borderRadius: 4,
    border     : 'none',
    background : '#f9d342',
    color      : '#000',
    fontWeight : 700,
    cursor     : 'pointer',
    transition : 'opacity .25s'
  },
  note: { fontSize: 13, marginTop: 8 },

  /* модалка info */
  mask : {
    position: 'fixed',
    inset   : 0,
    background: 'rgba(0,0,0,.82)',
    backdropFilter: 'blur(6px)',
    display : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex  : 100
  },
  modal: {
    background : '#111',
    padding    : 24,
    borderRadius: 8,
    maxWidth   : 330,
    lineHeight : 1.42
  },
  h3  : { margin: '0 0 8px' },
  p   : { fontSize: 14 },
  ok  : {
    marginTop : 12,
    padding   : '10px 18px',
    fontSize  : 15,
    border    : 'none',
    borderRadius: 6,
    background: '#f9d342',
    color     : '#000',
    cursor    : 'pointer'
  }
};
