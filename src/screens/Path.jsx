import React, { useEffect, useRef, useState } from 'react';
import { useNavigate }                      from 'react-router-dom';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

const TG       = window.Telegram?.WebApp;
const PLATFORM = TG?.platform ?? 'unknown';
const DEV      = import.meta.env.DEV;

// mapping from fragment index to its filename
const FRAG_IMG = {
  1: 'fragment_1_the_whisper.jpg',
  2: 'fragment_2_the_number.jpg',
  3: 'fragment_3_the_language.jpg',
  4: 'fragment_4_the_mirror.jpg',
  5: 'fragment_5_the_chain.jpg',
  6: 'fragment_6_the_hour.jpg',
  7: 'fragment_7_the_mark.jpg',
  8: 'fragment_8_the_gate.jpg',
};

const styleTag = (
  <style>{`
    @keyframes fly {
      0%  {opacity:0;transform:translate(-50%,-50%) scale(.3);}
      15% {opacity:1;transform:translate(-50%,-50%) scale(1);}
      65% {opacity:1;transform:translate(-50%,-50%) scale(1);}
      100%{opacity:0;transform:translate(-50%,280%) scale(.3);}
    }
  `}</style>
);

export default function Path() {
  const nav     = useNavigate();
  const pollRef = useRef(null);

  const [tgId,       setTgId]       = useState('');
  const [rawInit,    setRawInit]    = useState('');
  const [cd,         setCd]         = useState(0);
  const [curse,      setCurse]      = useState(null);
  const [busy,       setBusy]       = useState(false);
  const [wait,       setWait]       = useState(false);
  const [hubUrl,     setHubUrl]     = useState('');
  const [tonUrl,     setTonUrl]     = useState('');
  const [msg,        setMsg]        = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [frag,       setFrag]       = useState('');
  const [fragLoaded, setFragLoaded] = useState(false);
  const [collected,  setCollected]  = useState([]);
  const [fragUrls,   setFragUrls]   = useState({});

  const COOLDOWN = 120;

  // helpers
  const secLeft = t =>
    Math.max(0, COOLDOWN - Math.floor((Date.now() - new Date(t).getTime()) / 1000));

  const fmt = s =>
    `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const openLink = url =>
    TG?.openLink?.(url, { try_instant_view: false }) || window.open(url, '_blank');

  // save refreshed bearer token from any response
  function saveToken(res) {
    const h = res.headers.get('Authorization') || '';
    if (h.startsWith('Bearer ')) {
      localStorage.setItem('token', h.slice(7));
    }
  }

  // mount: init tgId, rawInit, token check, fetch presigned URLs, collected, cd & curse
  useEffect(() => {
    const wa = TG?.initDataUnsafe;
    const u  = wa?.user;

    if (!u?.id) {
      nav('/init');
      return;
    }

    setTgId(String(u.id));
    setRawInit(TG?.initData || '');

    if (!localStorage.getItem('token')) {
      nav('/init');
      return;
    }

    // fetch signed URLs for fragments
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/fragments/urls`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!r.ok) throw new Error();
        const { signedUrls } = await r.json();
        setFragUrls(signedUrls);
      } catch (e) {
        console.error('Failed to load signed fragment URLs', e);
      }
    })();

    // load already collected fragments
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/fragments/${u.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (r.ok) {
          const j = await r.json();
          setCollected(j.fragments || []);
        }
      } catch (e) {
        console.error('Failed to load collected fragments', e);
      }
    })();

    // load cooldown & curse_expires from player
    (async () => {
      try {
        const r = await fetch(`${BACKEND}/api/player/${u.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (r.ok) {
          const j = await r.json();
          if (j.last_burn)      setCd(secLeft(j.last_burn));
          if (j.curse_expires && new Date(j.curse_expires) > new Date())
            setCurse(j.curse_expires);
        }
      } catch (e) {
        console.error('Failed to load cooldown/curse', e);
      }
    })();

    // countdown timer
    const t = setInterval(() => setCd(s => s > 0 ? s - 1 : 0), 1000);
    return () => {
      clearInterval(t);
      clearInterval(pollRef.current);
    };
  }, [nav]);

  // clear fragment animation
  useEffect(() => {
    if (!fragLoaded) return;
    const t = setTimeout(() => {
      setFrag('');
      setFragLoaded(false);
    }, 2300);
    return () => clearTimeout(t);
  }, [fragLoaded]);

  // create invoice (0.5 TON)
  async function createInvoice(retry = false) {
    // hide modal immediately
    setShowModal(false);
    setBusy(true);
    setMsg('');
    setWait(false);

    try {
      const response = await fetch(`${BACKEND}/api/burn-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        // FIX: use tgId (not undefined tg_id)
        body: JSON.stringify({ tg_id: tgId }),
      });

      // maybe token expired → retry once
      if (response.status === 401 && !retry) {
        // re-init token
        const ok = await (async () => {
          const r = await fetch(`${BACKEND}/api/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tg_id: tgId, name: '', initData: rawInit }),
          });
          if (!r.ok) return false;
          const j = await r.json();
          localStorage.setItem('token', j.token);
          return true;
        })();
        if (ok) return createInvoice(true);
      }

      saveToken(response);

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to create invoice');

      setHubUrl(json.paymentUrl);
      setTonUrl(json.tonspaceUrl);
      localStorage.setItem('invoiceId',  json.invoiceId);
      localStorage.setItem('paymentUrl',  json.paymentUrl);
      localStorage.setItem('tonspaceUrl', json.tonspaceUrl);

      // deep‐link if on Android
      if (PLATFORM === 'android' && json.tonspaceUrl) {
        openLink(json.tonspaceUrl);
      } else {
        openLink(json.paymentUrl);
      }

      setWait(true);
      pollRef.current = setInterval(() => checkStatus(json.invoiceId), 5000);

    } catch (e) {
      console.error(e);
      setMsg(e.message);
      setBusy(false);
      setWait(false);
    }
  }

  // poll payment status
  async function checkStatus(invoiceId) {
    try {
      const r = await fetch(`${BACKEND}/api/burn-status/${invoiceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      saveToken(r);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'status');

      if (j.paid) {
        clearInterval(pollRef.current);
        setBusy(false);
        setWait(false);
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('paymentUrl');
        localStorage.removeItem('tonspaceUrl');

        if (j.cursed) {
          setCurse(j.curse_expires);
          setMsg(`⛔ Cursed until ${new Date(j.curse_expires).toLocaleString()}`);
        } else {
          setCurse(null);
          setCd(COOLDOWN);
          setCollected(prev => [...prev, j.newFragment]);

          // FIX: use the signed URL
          const fname = FRAG_IMG[j.newFragment];
          const url   = fragUrls[fname];
          setFrag(url);
          setFragLoaded(false);

          setMsg(`🔥 Fragment #${j.newFragment} received!`);
        }
      }
    } catch (e) {
      console.error(e);
      setMsg(e.message);
    }
  }

  // disable button if busy, waiting, cooldown, cursed or all collected
  const allGot   = collected.length === Object.keys(FRAG_IMG).length;
  const disabled = busy || wait || cd > 0 || !!curse || allGot;
  const mainTxt  = allGot
    ? '🔒 All fragments collected'
    : busy ? 'Creating invoice…'
    : wait ? 'Waiting for payment…'
    : '🔥 Burn Yourself for 0.5 TON';

  return (
    <>
      {styleTag}

      {/* confirmation modal */}
      {showModal && (
        <div style={S.modalWrap} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px' }}>⚠️ Important</h3>
            <p style={{ fontSize:14, opacity:0.9 }}>
              Send <b>exactly 0.5 TON</b>.<br/>
              Any other amount will <b>not be recognised</b><br/>
              and <b>will be lost</b>.
            </p>
            <button
              style={{ ...S.mBtn, background:'#d4af37', color:'#000' }}
              onClick={() => createInvoice()}>
              I understand, continue
            </button>
            <button
              style={{ ...S.mBtn, background:'#333', color:'#fff' }}
              onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={S.page}>
        <div style={S.card}>
          <h2 style={S.h2}>The Path Begins</h2>
          <p style={S.sub}>Ready to burn yourself.</p>

          {msg && (
            <p style={{ ...S.stat, ...(msg.startsWith('🔥') ? S.ok : S.bad) }}>
              {msg}
            </p>
          )}
          {!msg && curse && (
            <p style={S.stat}>⛔ Cursed until {new Date(curse).toLocaleString()}</p>
          )}
          {!msg && !curse && cd > 0 && (
            <p style={S.stat}>⏳ Next burn in {fmt(cd)}</p>
          )}

          <button
            style={{ ...S.btn, ...S.prim, opacity: disabled ? 0.6 : 1 }}
            disabled={disabled}
            onClick={() => setShowModal(true)}>
            {mainTxt}
          </button>

          {wait && (
            <>
              {PLATFORM === 'android' && tonUrl && (
                <button style={{ ...S.btn, ...S.sec }} onClick={() => openLink(tonUrl)}>
                  Continue in Telegram Wallet
                </button>
              )}
              <button style={{ ...S.btn, ...S.sec }} onClick={() => openLink(hubUrl)}>
                Open in Tonhub
              </button>
              <button
                style={{ ...S.btn, ...S.sec, marginTop:0 }}
                onClick={() => {
                  const inv = localStorage.getItem('invoiceId');
                  if (inv) checkStatus(inv);
                }}>
                Check status
              </button>
            </>
          )}

          <button
            style={{ ...S.btn, ...S.sec }}
            onClick={() => nav('/profile')}>
            Go to your personal account
          </button>
        </div>
      </div>

      {/* flying fragment animation */}
      {frag && (
        <img
          src={frag}
          alt="fragment"
          style={S.frag}
          onLoad={() => setFragLoaded(true)}
        />
      )}
    </>
  );
}

const S = {
  page: {
    position:'relative',
    minHeight:'100vh',
    background:'url("/bg-path.webp") center/cover',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    padding:'32px 12px',
  },
  card: {
    width:'100%',
    maxWidth:380,
    textAlign:'center',
    color:'#d4af37',
  },
  h2:   { margin:0, fontSize:28, fontWeight:700 },
  sub:  { margin:'8px 0 24px', fontSize:16 },
  btn:  {
    display:'block',
    width:'100%',
    padding:12,
    fontSize:16,
    borderRadius:6,
    border:'none',
    margin:'12px 0',
    cursor:'pointer',
    transition:'opacity .2s',
  },
  prim: { background:'#d4af37', color:'#000' },
  sec:  {
    background:'transparent',
    border:'1px solid #d4af37',
    color:'#d4af37',
  },
  stat: { fontSize:15, minHeight:22, margin:'12px 0' },
  ok:   { color:'#6BCB77' },
  bad:  { color:'#FF6B6B' },

  // modal
  modalWrap: {
    position:'fixed',
    inset:0,
    background:'#0008',
    backdropFilter:'blur(6px)',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    zIndex:50,
  },
  modal: {
    maxWidth:320,
    background:'#181818',
    color:'#fff',
    padding:20,
    borderRadius:8,
    boxShadow:'0 0 16px #000',
    textAlign:'center',
    lineHeight:1.4,
  },
  mBtn: {
    marginTop:16,
    padding:10,
    width:'100%',
    fontSize:15,
    border:'none',
    borderRadius:6,
    cursor:'pointer',
  },

  // flying fragment
  frag: {
    position:'fixed',
    left:'50%',
    top:'50%',
    width:260,
    height:260,
    transform:'translate(-50%,-50%)',
    zIndex:30,
    animation:'fly 2.3s forwards',
  },
};
