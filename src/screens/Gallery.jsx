// src/screens/Gallery.jsx

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

const FRAGMENT_FILES = {
  1: 'fragment_1_the_whisper.jpg',
  2: 'fragment_2_the_number.jpg',
  3: 'fragment_3_the_language.jpg',
  4: 'fragment_4_the_mirror.jpg',
  5: 'fragment_5_the_chain.jpg',
  6: 'fragment_6_the_hour.jpg',
  7: 'fragment_7_the_mark.jpg',
  8: 'fragment_8_the_gate.jpg',
};

const slotPositions = [
  { left: 37,  top: 107 },
  { left: 117, top: 107 },
  { left: 197, top: 107 },
  { left: 277, top: 107 },
  { left: 37,  top: 187 },
  { left: 117, top: 187 },
  { left: 197, top: 187 },
  { left: 277, top: 187 },
];

const lockPositions = [
  { left: 70,  top: 140 },
  { left: 150, top: 140 },
  { left: 230, top: 139 },
  { left: 310, top: 140 },
  { left: 70,  top: 221 },
  { left: 150, top: 221 },
  { left: 230, top: 220 },
  { left: 310, top: 221 },
];

// helpers
const norm = (arr) => Array.from(new Set((arr || []).map(Number))).sort((a, b) => a - b);
const same = (a, b) => {
  const A = norm(a), B = norm(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

export default function Gallery() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [signedUrls, setSignedUrls] = useState({});
  const [fragments, setFragments] = useState(() => norm(user?.fragments || []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [zoomUrl, setZoomUrl] = useState(null);
  const [showFirstFragmentNotice, setShowFirstFragmentNotice] = useState(false);
  const [fragmentNoticeId, setFragmentNoticeId] = useState(null); // NEW: generic notice for any fragment

  const lastUrlsRefresh = useRef(0);

  // + новые стейты вверху компонента
  const [awardId, setAwardId] = useState(null);      // номер полученного фрагмента
  const [showAward, setShowAward] = useState(false); // модалка награды
  const [awardRarity, setAwardRarity] = useState(null);


  // initial load: take fragments from context, fetch signed URLs once
  // initial load: union(API, context) + optimistic add from localStorage
// initial load: union(API, context) + optimistic add from localStorage
useEffect(() => {
  let cancelled = false;
  (async () => {
    setLoading(true); setError('');
    try {
      const [{ signedUrls }, { fragments: frFromApi }] = await Promise.all([
        API.getSignedFragmentUrls(),
        API.getFragments(user.tg_id),
      ]);
      if (cancelled) return;

      let next = norm([...(frFromApi || []), ...(user?.fragments || [])]);

      // ⬇ читаем JSON { id, rarity, ts } — не очищаем тут, модалка закроет сама
      let pendingObj = null;
      try { const raw = localStorage.getItem('newFragmentNotice'); if (raw) pendingObj = JSON.parse(raw); } catch {}
      if (pendingObj && Number.isFinite(pendingObj.id) && pendingObj.id >= 1 && pendingObj.id <= 8) {
        if (!next.includes(pendingObj.id)) next = norm([...next, pendingObj.id]);
        setAwardId(pendingObj.id);
        setAwardRarity(pendingObj.rarity || null);
        setShowAward(true);
      }

      setSignedUrls(signedUrls || {});
      lastUrlsRefresh.current = Date.now();
      setFragments(next);
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('invalid token')) {
        logout(); navigate('/login');
      } else {
        setError(e?.message || 'Failed to load');
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [user?.tg_id, logout, navigate]);


// (опционально) когда модалка открылась, обновить ссылки (на случай TTL)
useEffect(() => {
  if (!showAward) return;
  (async () => {
    try {
      const { signedUrls } = await API.getSignedFragmentUrls();
      setSignedUrls(signedUrls || {});
      lastUrlsRefresh.current = Date.now();
    } catch {}
  })();
}, [showAward]);


// react to context user.fragments changes (no local polling) + optimistic merge
useEffect(() => {
  let next = norm(user?.fragments || []);

  // учитываем возможный pending из JSON для согласованности сетки
  let pendingObj = null;
  try { const raw = localStorage.getItem('newFragmentNotice'); if (raw) pendingObj = JSON.parse(raw); } catch {}
  if (pendingObj && Number.isFinite(pendingObj.id) && pendingObj.id >= 1 && pendingObj.id <= 8 && !next.includes(pendingObj.id)) {
    next = norm([...next, pendingObj.id]);
  }

  if (!same(next, fragments)) {
    setFragments(next);
    (async () => {
      try {
        const { signedUrls } = await API.getSignedFragmentUrls();
        setSignedUrls(signedUrls || {});
        lastUrlsRefresh.current = Date.now();
      } catch (_) {}
    })();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.fragments]);



// refresh signed URLs TTL every ~4 minutes (keeps HMAC links fresh)
useEffect(() => {
  let cancelled = false;
  const tick = async () => {
    if (Date.now() - lastUrlsRefresh.current < 4 * 60 * 1000) return;
    try {
      const { signedUrls } = await API.getSignedFragmentUrls();
      if (!cancelled) {
        setSignedUrls(signedUrls || {});
        lastUrlsRefresh.current = Date.now();
      }
    } catch (_) {}
  };
  // раз в минуту проверяем, не пора ли обновить TTL
  const id = setInterval(tick, 60 * 1000);
  return () => { cancelled = true; clearInterval(id); };
}, []);

// NOTICE LOGIC (JSON): показываем модалку награды с редкостью; фолбэк — приветствие за 1-й фрагмент
useEffect(() => {
  if (loading) return;

  let obj = null;
  try { const raw = localStorage.getItem('newFragmentNotice'); if (raw) obj = JSON.parse(raw); } catch {}

  if (obj && Number.isFinite(obj.id)) {
    // Если по какой-то причине модалка ещё не показана — синхронизируем состояние
    if (!showAward) {
      setAwardId(obj.id);
      setAwardRarity(obj.rarity || null);
      setShowAward(true);
    }
    return; // не показываем welcome одновременно
  }

  // Fallback: first fragment welcome (only once)
  if (fragments.includes(1) && localStorage.getItem('firstFragmentShown') !== 'true') {
    setShowFirstFragmentNotice(true);
    try { localStorage.setItem('firstFragmentShown', 'true'); } catch {}
  }
}, [loading, fragments, showAward]);


  // go to final when full set collected
  useEffect(() => {
    if (!loading && fragments.length >= 8) navigate('/final');
  }, [loading, fragments, navigate]);

  if (loading) return <p style={{ padding: 16 }}>Loading gallery…</p>;
  if (error)   return <p style={{ padding: 16, color: 'tomato' }}>{error}</p>;

  return (
    <div style={{
      position:  'relative',
      width:     '100%',
      minHeight: '100vh',
      fontFamily:'Tajawal, sans-serif',
    }}>
      {/* Background */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: "url('/images/bg-path.webp')",
        backgroundSize:  'cover',
        backgroundPosition: 'center',
        zIndex:          0,
      }} />
      <div className="app-page">
      {/* Back Button */}
      <BackButton style={{
        position: 'absolute',
        top:      16,
        left:     16,
        zIndex:   5,
      }} />
      <button
  onClick={() => navigate('/')}
  style={{
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 5,
    height: 36,
    padding: '0 14px',
    border: 'none',
    borderRadius: 18,
    background: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
  }}
  title="Home"
/>

      {/* Title */}
      <h1 style={{
        position:    'absolute',
        left:        41,
        top:         24,
        fontSize:    36,
        color:       '#9D9D9D',
        textShadow:  '2px 5px 8px rgba(131,129,129,0.52)',
        zIndex:      5,
      }}>
        Artifact repository
      </h1>

      {/* Fragments Grid */}
      {slotPositions.map((pos, i) => {
        const id    = i + 1;
        const owned = fragments.includes(id);
        const file  = FRAGMENT_FILES[id];
        const url   = signedUrls[file];
        const bust  = `&ts=${Date.now()}`;
        return (
          <React.Fragment key={id}>
            <div
              onClick={() => owned && url && setZoomUrl(`${url}${bust}`)}
              style={{
                position: 'absolute',
                left:     pos.left,
                top:      pos.top,
                width:    80,
                height:   80,
                border:   '1px solid #808080',
                overflow: 'hidden',
                cursor:   owned ? 'pointer' : 'default',
                zIndex:   5,
              }}
            >
              {owned && url && (
                <img
                  src={`${url}${bust}`}
                  alt={`Fragment ${id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            {!owned && (
              <span style={{
                position: 'absolute',
                left:     lockPositions[i].left,
                top:      lockPositions[i].top,
                fontSize: 15,
                color:    '#FFF',
                zIndex:   6,
              }}>🔒</span>
            )}
          </React.Fragment>
        );
      })}

      {/* Legendary Hint */}
      <div style={{
        position: 'absolute',
        left:     37,
        top:      289,
        width:    320,
        height:   21,
        border:   '1px solid #808080',
        zIndex:   5,
      }} />
      <span style={{
        position: 'absolute',
        left:     142,
        top:      291,
        fontSize: 10,
        color:    '#FFF',
        zIndex:   6,
      }}>
        Legendary Hint — 5 TON
      </span>

      {/* Referral & Leaders */}
      <div onClick={() => navigate('/referral')} style={{
        position: 'absolute',
        left:     37,
        top:      355,
        width:    151,
        height:   43,
        border:   '2px solid #9D9D9D',
        borderRadius: 30,
        display:  'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor:   'pointer',
        zIndex:   5,
      }}>
        <span style={{ fontSize: 20, color: '#FFF' }}>Referral</span>
      </div>
      <div onClick={() => navigate('/leaderboard')} style={{
        position: 'absolute',
        left:     206,
        top:      355,
        width:    151,
        height:   43,
        border:   '2px solid #9D9D9D',
        borderRadius: 30,
        display:  'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor:   'pointer',
        zIndex:   5,
      }}>
        <span style={{ fontSize: 20, color: '#FFF' }}>Leaders</span>
      </div>

      {/* Burn Again */}
      <div onClick={() => navigate('/burn')} style={{
        position: 'absolute',
        left:     64,
        top:      436,
        width:    265,
        height:   76,
        backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
        boxShadow: '0px 6px 6px rgba(0,0,0,0.87)',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 5,
      }}>
        <span style={{
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize:   24,
          color:      '#FFF'
        }}>
          BURN AGAIN
        </span>
      </div>

      {/* Description */}
      <p style={{
        position:   'absolute',
        left:       22,
        top:        542,
        width:      349,
        fontWeight: 700,
        fontSize:   13,
        color:      '#FFF',
        zIndex:     5,
      }}>
        The true purpose of the Order of Ash is to recover all eight sacred fragments by deciphering hidden riddles and gathering every hint along the way. Once you have assembled the complete set, a final input window will appear—this is your one and only chance to enter the secret control phrase. If your submission is incorrect, you may choose to “Reborn” and begin your journey anew, but you will forfeit all existing fragments and hints. Should you succeed in entering the correct phrase on your first try—having met every condition—you will unlock a substantial cash reward. Good luck, and may the ashes guide your path.
      </p>

      {/* Zoom Modal */}
      {zoomUrl && (
        <Modal onClose={() => setZoomUrl(null)}>
          <div onClick={() => setZoomUrl(null)} style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <img
              src={zoomUrl}
              alt="Fragment zoom"
              style={{ maxWidth: '90%', maxHeight: '90%' }}
            />
          </div>
        </Modal>
      )}

 // рендер модалки награды (показываем также редкость)
{showAward && awardId && (
  <div style={{
    position:'fixed', inset:0, background:'rgba(0,0,0,0.78)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
  }}>
    <div style={{
      width:320, background:'#2a2a2a', color:'#fff',
      border:'1px solid #9E9191', borderRadius:16, padding:16, textAlign:'center'
    }}>
      <h3 style={{ margin:'0 6px 6px' }}>Fragment #{awardId} obtained!</h3>
      {awardRarity && (
        <p style={{ margin:'0 0 8px', fontSize:12, opacity:0.85 }}>
          Rarity: <strong style={{ textTransform:'capitalize' }}>{awardRarity}</strong>
        </p>
      )}
      <p style={{ margin:'0 0 12px' }}>A new piece joins your collection.</p>
      {signedUrls[FRAGMENT_FILES[awardId]] && (
        <img
          alt={`Fragment ${awardId}`}
          src={`${signedUrls[FRAGMENT_FILES[awardId]]}&ts=${Date.now()}`}
          style={{ width:150, height:150, objectFit:'cover', borderRadius:8, margin:'0 auto 16px' }}
        />
      )}
      <button
        onClick={() => {
          setShowAward(false);
          setAwardRarity(null);
          try { localStorage.removeItem('newFragmentNotice'); } catch {}
        }}
        style={{
          width:'100%', height:44,
          background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
          border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:'pointer'
        }}
      >
        Continue
      </button>
      
    </div>
  </div>
)}


      {/* First Fragment Modal (kept) */}
      {showFirstFragmentNotice && (
        <div style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          zIndex:          9999,
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius:    16,
            padding:         24,
            maxWidth:        '90%',
            width:           320,
            textAlign:       'center',
            color:           '#fff',
          }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Congratulations!</h2>
            <p style={{ margin: '12px 0' }}>You’ve received your first free fragment!</p>
            <img
              src={signedUrls['fragment_1_the_whisper.jpg']}
              alt="Fragment 1"
              style={{
                width:        120,
                height:       120,
                objectFit:    'cover',
                borderRadius: 8,
                margin:       '0 auto 16px',
              }}
            />
            <button
              onClick={() => setShowFirstFragmentNotice(false)}
              style={{
                display:         'block',
                margin:          '16px auto 0',
                padding:         '10px 20px',
                backgroundColor: '#D81E3D',
                color:           '#fff',
                border:          'none',
                borderRadius:    20,
                cursor:          'pointer',
                fontSize:        16,
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      
      {fragmentNoticeId && (
        <div style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          zIndex:          9999,
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius:    16,
            padding:         24,
            maxWidth:        '90%',
            width:           320,
            textAlign:       'center',
            color:           '#fff',
          }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Fragment #{fragmentNoticeId} obtained!</h2>
            <p style={{ margin: '12px 0' }}>A new piece joins your collection.</p>
            {signedUrls[FRAGMENT_FILES[fragmentNoticeId]] && (
              <img
                src={signedUrls[FRAGMENT_FILES[fragmentNoticeId]]}
                alt={`Fragment ${fragmentNoticeId}`}
                style={{
                  width:        120,
                  height:       120,
                  objectFit:    'cover',
                  borderRadius: 8,
                  margin:       '0 auto 16px',
                }}
              />
            )}
            <button
              onClick={() => setFragmentNoticeId(null)}
              style={{
                display:         'block',
                margin:          '16px auto 0',
                padding:         '10px 20px',
                backgroundColor: '#D81E3D',
                color:           '#fff',
                border:          'none',
                borderRadius:    20,
                cursor:          'pointer',
                fontSize:        16,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
       </div>
    </div>
  );
}
