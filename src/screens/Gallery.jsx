// src/screens/Gallery.jsx

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';
import CipherModal from '../components/CipherModal';

/**
 * Absolute positions for 8 slots (within the fixed-size central layout).
 */
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

/**
 * Absolute positions for lock icons drawn on top of each slot.
 */
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

/* ----------------------------- Utilities ------------------------------ */

/**
 * Return a sorted, unique numeric array from any input array-like.
 */
const norm = (arr) => Array.from(new Set((arr || []).map(Number))).sort((a, b) => a - b);

/**
 * Shallow equality for two numeric sets (order-insensitive).
 */
const same = (a, b) => {
  const A = norm(a), B = norm(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

/**
 * Append a timestamp query param to break caches (works with/without existing ?query).
 */
const withTs = (url) => {
  if (!url) return url;
  return `${url}${url.includes('?') ? '&' : '?'}ts=${Date.now()}`;
};

/* ================================ View ================================ */

export default function Gallery() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Signed fragment URLs (HMAC) + owned fragments.
  const [signedUrls, setSignedUrls] = useState({});
  const [fragments, setFragments] = useState(() => norm(user?.fragments || []));

  // Loading & error UI state.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Zoomed image URL (fragment or rune).
  const [zoomUrl, setZoomUrl] = useState(null);

  // First-fragment welcome modal.
  const [showFirstFragmentNotice, setShowFirstFragmentNotice] = useState(false);

  // Award modal state (new fragment after burn).
  const [awardId, setAwardId] = useState(null);
  const [showAward, setShowAward] = useState(false);
  const [awardRarity, setAwardRarity] = useState(null);

  // About modal toggle.
  const [showAbout, setShowAbout] = useState(false);

  // Refs to throttle periodic re-fetch of signed URLs (frag & runes).
  const lastUrlsRefresh = useRef(0);
  const lastRuneUrlsRefresh = useRef(0);

  // Rune map & asset URLs:
  // runesByFrag: { [fragId]: { runeId: number|null, answered: boolean } }
  // runeUrls:    { [runeId]: string }
  const [runesByFrag, setRunesByFrag] = useState({});
  const [runeUrls, setRuneUrls] = useState({});
  const [cipherFragId, setCipherFragId] = useState(null); // open cipher from gallery

  /* --------------------- Local storage notice parser --------------------- */

  /**
   * Reads "newFragmentNotice" from localStorage:
   *  - Supports legacy raw value (e.g., "2")
   *  - Supports JSON: { id: number, rarity?: string, ts?: number }
   */
  const readPendingNotice = useCallback(() => {
    try {
      const raw = localStorage.getItem('newFragmentNotice');
      if (!raw) return null;

      let id = null;
      let rarity = null;

      try {
        const val = JSON.parse(raw);
        if (typeof val === 'number') {
          id = val;
        } else if (typeof val === 'string') {
          const n = parseInt(val, 10);
          if (Number.isFinite(n)) id = n;
        } else if (val && typeof val === 'object') {
          const n = Number(val.id);
          if (Number.isFinite(n)) id = n;
          if (val.rarity) rarity = String(val.rarity);
        }
      } catch {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n)) id = n;
      }

      if (Number.isFinite(id)) return { id, rarity };
    } catch {}
    return null;
  }, []);

  /* ------------------------- Rune URL hydration ------------------------- */

  /**
   * Lazily fetch missing rune signed URLs by ids[] and merge into state.
   */
  const ensureRuneUrls = useCallback(async (ids) => {
    const need = (ids || []).filter((id) => id && !runeUrls[id]);
    if (!need.length) return;

    try {
      // IMPORTANT: apiClient exports getRuneUrls (no "s")
      const { urls } = await API.getRuneUrls(need);
      if (urls) {
        setRuneUrls((prev) => ({ ...prev, ...urls }));
        lastRuneUrlsRefresh.current = Date.now();
      }
    } catch (_) {}
  }, [runeUrls]);

  /* ----------------------------- Initial load --------------------------- */

  // Initial load:
  //  1) fetch signed fragment URLs and fragments
  //  2) apply optimistic "newFragmentNotice"
  //  3) fetch rune map + rune URLs (includeUrls=1)
  useEffect(() => {
    if (!user?.tg_id) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');

      try {
        const [{ signedUrls: su }, { fragments: frFromApi }] = await Promise.all([
          API.getSignedFragmentUrls(),
          API.getFragments(user.tg_id),
        ]);
        if (cancelled) return;

        let next = norm([...(frFromApi || []), ...(user?.fragments || [])]);

        const pending = readPendingNotice();
        if (pending && pending.id >= 1 && pending.id <= 8) {
          if (!next.includes(pending.id)) next = norm([...next, pending.id]);
          setAwardId(pending.id);
          setAwardRarity(pending.rarity || null);
          setShowAward(true);
        }

        setSignedUrls(su || {});
        lastUrlsRefresh.current = Date.now();
        setFragments(next);

        // Fetch rune status for owned fragments and (optionally) their URLs.
        try {
          const data = await API.getCipherAll(true); // -> { byFragment, urls }
          if (data?.byFragment) setRunesByFrag(data.byFragment);
          if (data?.urls) {
            setRuneUrls((prev) => ({ ...prev, ...data.urls }));
            lastRuneUrlsRefresh.current = Date.now();
          }
        } catch {}
      } catch (e) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e?.message || 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.tg_id, user?.fragments, readPendingNotice, logout, navigate]);

  /* --------------------------- Award TTL refresh ------------------------ */

  // When award modal is shown, refresh fragment signed URLs (in case of TTL).
  useEffect(() => {
    if (!showAward) return;
    (async () => {
      try {
        const { signedUrls: su } = await API.getSignedFragmentUrls();
        setSignedUrls(su || {});
        lastUrlsRefresh.current = Date.now();
      } catch {}
    })();
  }, [showAward]);

  /* ---------------------- React to user.fragments ----------------------- */

  // Sync gallery when user.fragments changes + merge optimistic pending notice.
  useEffect(() => {
    const next = (() => {
      let arr = norm(user?.fragments || []);
      const pending = readPendingNotice();
      if (pending && pending.id >= 1 && pending.id <= 8 && !arr.includes(pending.id)) {
        arr = norm([...arr, pending.id]);
      }
      return arr;
    })();

    if (!same(next, fragments)) {
      setFragments(next);
      (async () => {
        try {
          const { signedUrls: su } = await API.getSignedFragmentUrls();
          setSignedUrls(su || {});
          lastUrlsRefresh.current = Date.now();
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.fragments, readPendingNotice]);

  /* -------------------- Refresh rune map when fragments ----------------- */

  // Whenever fragment set changes, re-pull rune map (and their URLs).
  useEffect(() => {
    (async () => {
      try {
        const data = await API.getCipherAll(true);
        if (data?.byFragment) setRunesByFrag(data.byFragment);
        if (data?.urls) {
          setRuneUrls((prev) => ({ ...prev, ...data.urls }));
          lastRuneUrlsRefresh.current = Date.now();
        }
      } catch {}
    })();
  }, [fragments]);

  /* ------------------------ Periodic URL TTL refresh -------------------- */

  // Refresh fragment signed URLs every ~4 minutes.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (Date.now() - lastUrlsRefresh.current < 4 * 60 * 1000) return;
      try {
        const { signedUrls: su } = await API.getSignedFragmentUrls();
        if (!cancelled) {
          setSignedUrls(su || {});
          lastUrlsRefresh.current = Date.now();
        }
      } catch {}
    };

    const id = setInterval(tick, 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Refresh rune signed URLs every ~4 minutes (for currently known rune ids).
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (Date.now() - lastRuneUrlsRefresh.current < 4 * 60 * 1000) return;
      try {
        const ids = Object.keys(runeUrls)
          .map((k) => parseInt(k, 10))
          .filter(Number.isFinite);
        if (!ids.length) return;

        // IMPORTANT: apiClient exports getRuneUrls (no "s")
        const { urls } = await API.getRuneUrls(ids);
        if (!cancelled && urls) {
          setRuneUrls((prev) => ({ ...prev, ...urls }));
          lastRuneUrlsRefresh.current = Date.now();
        }
      } catch {}
    };

    const id = setInterval(tick, 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [runeUrls]);

  // When rune map changes, fetch any missing rune URLs.
  useEffect(() => {
    const ids = Object.values(runesByFrag)
      .map((v) => Number(v?.runeId))
      .filter((n) => Number.isFinite(n));
    if (ids.length) ensureRuneUrls(ids);
  }, [runesByFrag, ensureRuneUrls]);

  /* ---------------------------- Notices logic --------------------------- */

  // Show award modal if there is a pending notice; otherwise show first-fragment welcome (once).
  useEffect(() => {
    if (loading) return;

    const pending = readPendingNotice();
    if (pending && Number.isFinite(pending.id)) {
      if (!showAward) {
        setAwardId(pending.id);
        setAwardRarity(pending.rarity || null);
        setShowAward(true);
      }
      return; // don't show welcome simultaneously
    }

    if (fragments.includes(1) && localStorage.getItem('firstFragmentShown') !== 'true') {
      setShowFirstFragmentNotice(true);
      try { localStorage.setItem('firstFragmentShown', 'true'); } catch {}
    }
  }, [loading, fragments, showAward, readPendingNotice]);

  /* ----------------------- Auto-redirect when full set ------------------ */

  useEffect(() => {
    if (!loading && fragments.length >= 8) navigate('/final');
  }, [loading, fragments, navigate]);

  /* ------------------------------- Render ------------------------------- */

  if (loading) return <p style={{ padding: 16 }}>Loading gallery…</p>;
  if (error)   return <p style={{ padding: 16, color: 'tomato' }}>{error}</p>;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        fontFamily: 'Tajawal, sans-serif',
      }}
    >
      {/* Background layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/bg-path.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Centered page container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 414,
          margin: '0 auto',
          minHeight: '100vh',
        }}
      >
        {/* Back + Home */}
        <BackButton
          style={{ position: 'absolute', top: 16, left: 16, zIndex: 5 }}
        />

        <button
          onClick={() => navigate('/')}
          title="Home"
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
        >
          Home
        </button>

        {/* Title */}
        <h1
          style={{
            position: 'absolute',
            left: 41,
            top: 24,
            fontSize: 'clamp(28px, 8vw, 36px)',
            color: '#9D9D9D',
            textShadow: '2px 5px 8px rgba(131,129,129,0.52)',
            zIndex: 5,
          }}
        >
          Artifact repository
        </h1>

        {/* Fragments grid */}
        {slotPositions.map((pos, i) => {
          const id = i + 1;
          const owned = fragments.includes(id);
          const file = FRAGMENT_FILES[id];
          const fragUrl = signedUrls[file];

          // Rune presentation (if the user has answered the cipher).
          const entry = runesByFrag[id] || null;
          const runeId = entry?.runeId ?? null;
          const runeUrl = runeId ? runeUrls[runeId] : null;

          return (
            <React.Fragment key={id}>
              <div
                onClick={() => {
                  if (!owned) return;

                  // If rune is not chosen yet -> open cipher for this fragment
                  if (!runeId) {
                    setCipherFragId(id);
                    return;
                  }

                  // If rune is chosen -> zoom rune image; else fallback to fragment image
                  if (runeUrl) {
                    setZoomUrl(withTs(runeUrl));
                  } else if (fragUrl) {
                    setZoomUrl(withTs(fragUrl));
                  }
                }}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: 80,
                  height: 80,
                  border: '1px solid #808080',
                  overflow: 'hidden',
                  cursor: owned ? 'pointer' : 'default',
                  zIndex: 5,
                }}
              >
                {owned ? (
                  runeUrl ? (
                    <img
                      src={withTs(runeUrl)}
                      alt={`Rune for fragment ${id}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    fragUrl && (
                      <img
                        src={withTs(fragUrl)}
                        alt={`Fragment ${id}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )
                  )
                ) : null}
              </div>

              {!owned && (
                <span
                  style={{
                    position: 'absolute',
                    left: lockPositions[i].left,
                    top: lockPositions[i].top,
                    fontSize: 15,
                    color: '#FFF',
                    zIndex: 6,
                  }}
                >
                  🔒
                </span>
              )}
            </React.Fragment>
          );
        })}

        {/* Legendary hint (visual placeholder) */}
        <div
          style={{
            position: 'absolute',
            left: 37,
            top: 289,
            width: 320,
            height: 21,
            border: '1px solid #808080',
            zIndex: 5,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 142,
            top: 291,
            fontSize: 10,
            color: '#FFF',
            zIndex: 6,
          }}
        >
          Legendary Hint — 5 TON
        </span>

        {/* Referral & Leaders */}
        <div
          onClick={() => navigate('/referral')}
          style={{
            position: 'absolute',
            left: 37,
            top: 355,
            width: 151,
            height: 43,
            border: '2px solid #9D9D9D',
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 20, color: '#FFF' }}>Referral</span>
        </div>
        <div
          onClick={() => navigate('/leaderboard')}
          style={{
            position: 'absolute',
            left: 206,
            top: 355,
            width: 151,
            height: 43,
            border: '2px solid #9D9D9D',
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 20, color: '#FFF' }}>Leaders</span>
        </div>

        {/* Burn Again CTA */}
        <div
          onClick={() => navigate('/burn')}
          style={{
            position: 'absolute',
            left: 64,
            top: 436,
            width: 265,
            height: 76,
            backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
            boxShadow: '0px 6px 6px rgba(0,0,0,0.87)',
            borderRadius: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700,
              fontSize: 24,
              color: '#FFF',
            }}
          >
            BURN AGAIN
          </span>
        </div>

        {/* About modal trigger */}
        <button
          onClick={() => setShowAbout(true)}
          style={{
            position: 'absolute',
            left: 22,
            top: 542,
            width: 349,
            height: 44,
            borderRadius: 22,
            border: '1px solid #9D9D9D',
            background: 'rgba(0,0,0,0.35)',
            color: '#FFF',
            fontWeight: 700,
            fontSize: 14,
            zIndex: 5,
            cursor: 'pointer',
          }}
        >
          About the Order
        </button>
      </div>

      {/* Zoom Modal (fragment or rune) */}
      {zoomUrl && (
        <div
          onClick={() => setZoomUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={zoomUrl}
            alt="Fragment zoom"
            style={{
              maxWidth: '92%',
              maxHeight: '88%',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      )}

      {/* Award modal (shows rarity if provided) */}
      {showAward && awardId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 320,
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #9E9191',
              borderRadius: 16,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 6px 6px' }}>Fragment #{awardId} obtained!</h3>

            {awardRarity && (
              <p style={{ margin: '0 0 8px', fontSize: 12, opacity: 0.85 }}>
                Rarity:{' '}
                <strong style={{ textTransform: 'capitalize' }}>{awardRarity}</strong>
              </p>
            )}

            <p style={{ margin: '0 0 12px' }}>A new piece joins your collection.</p>

            {signedUrls[FRAGMENT_FILES[awardId]] && (
              <img
                alt={`Fragment ${awardId}`}
                src={withTs(signedUrls[FRAGMENT_FILES[awardId]])}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: 'cover',
                  borderRadius: 8,
                  margin: '0 auto 16px',
                }}
              />
            )}

            <button
              onClick={() => {
                setShowAward(false);
                setAwardRarity(null);
                try {
                  localStorage.removeItem('newFragmentNotice');
                } catch {}
              }}
              style={{
                width: '100%',
                height: 44,
                background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* First-fragment welcome modal */}
      {showFirstFragmentNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: 16,
              padding: 24,
              maxWidth: '90%',
              width: 320,
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>Congratulations!</h2>
            <p style={{ margin: '12px 0' }}>
              You’ve received your first free fragment!
            </p>

            {signedUrls['fragment_1_the_whisper.jpg'] && (
              <img
                src={signedUrls['fragment_1_the_whisper.jpg']}
                alt="Fragment 1"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 8,
                  margin: '0 auto 16px',
                }}
              />
            )}

            <button
              onClick={() => setShowFirstFragmentNotice(false)}
              style={{
                display: 'block',
                margin: '16px auto 0',
                padding: '10px 20px',
                backgroundColor: '#D81E3D',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* About the Order modal */}
      {showAbout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid #9E9191',
              borderRadius: 16,
              padding: 18,
              color: '#fff',
            }}
          >
            <h3 style={{ margin: '0 0 8px', textAlign: 'center' }}>
              About the Order
            </h3>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', fontSize: 13, lineHeight: 1.5 }}>
              <p>
                The true purpose of the Order of Ash is to recover all eight
                sacred fragments by deciphering hidden riddles and gathering
                every hint along the way. Once you have assembled the complete
                set, a final input window will appear—this is your one and only
                chance to enter the secret control phrase.
              </p>
              <p>
                If your submission is incorrect, you may choose to “Reborn” and
                begin your journey anew, forfeiting all fragments and hints.
                Should you succeed on your first attempt—having met every
                condition—you will unlock a substantial reward. Good luck, and
                may the ashes guide your path.
              </p>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: 14,
                width: '100%',
                height: 44,
                background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cipher dialog for picking a rune (when user clicks a fragment without a rune yet) */}
      {cipherFragId && (
        <CipherModal
          fragId={cipherFragId}
          onClose={async () => {
            setCipherFragId(null);
            // After closing, refresh rune map (user might have answered the cipher).
            try {
              const data = await API.getCipherAll(true);
              if (data?.byFragment) setRunesByFrag(data.byFragment);
              if (data?.urls) {
                setRuneUrls((prev) => ({ ...prev, ...data.urls }));
                lastRuneUrlsRefresh.current = Date.now();
              }
            } catch {}
          }}
        />
      )}
    </div>
  );
}
