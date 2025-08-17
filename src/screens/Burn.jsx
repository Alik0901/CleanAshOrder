// src/screens/Burn.jsx
import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';
import CipherModal from '../components/CipherModal';

/* ──────────────────────────────────────────────────────────────────────
 * Helpers & Constants
 * ──────────────────────────────────────────────────────────────────── */

/** Polling interval for invoice status (ms). */
const POLL_MS = 2000;

/** Small fallback delay for rare race when task is not yet attached (ms). */
const SECOND_LOOK_MS = 800;

/** Returns array of non-empty string options for a given task payload. */
function getOptions(task) {
  const raw = task?.params?.options;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o) => String(o ?? ''))
    .filter((s) => s.length > 0);
}

/** Coerces an input into a valid Date or null. */
function safeDate(input) {
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : null;
}

/* ──────────────────────────────────────────────────────────────────────
 * Countdown (hh:mm:ss)
 * ──────────────────────────────────────────────────────────────────── */

/** Displays a simple hh:mm:ss countdown until the given `to` time. */
function Countdown({ to }) {
  const target = safeDate(to)?.getTime() ?? 0;
  const [ms, setMs] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => {
      setMs(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSec = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  return <>{hh}:{mm}:{ss}</>;
}

/* ──────────────────────────────────────────────────────────────────────
 * Burn Screen
 * ──────────────────────────────────────────────────────────────────── */

export default function Burn() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // UI stages: "idle" → "awaiting" (poll payment) → "task" (mini-quest)
  const [stage, setStage] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [error, setError] = useState('');

  // Curse modal (shown immediately when a fresh curse is applied)
  const [curseModalUntil, setCurseModalUntil] = useState(null);

  // Quest state
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Open cipher after a successful fragment award
  const [cipherFragId, setCipherFragId] = useState(null);

  // Poller ref to clear on unmount
  const pollRef = useRef(null);

  /* ── Guard unauthenticated user ──────────────────────────────────── */
  useEffect(() => {
    if (!user?.tg_id) {
      logout();
      navigate('/login');
    }
  }, [user, logout, navigate]);

  /* ── Derived state ───────────────────────────────────────────────── */
  const fragments = useMemo(
    () => (Array.isArray(user?.fragments) ? user.fragments.map(Number) : []),
    [user?.fragments]
  );
  const hasTutorial = useMemo(
    () => [1, 2, 3].every((n) => fragments.includes(n)),
    [fragments]
  );
  const isCursed = !!user?.is_cursed;
  const activeCurseUntil = useMemo(
    () => (isCursed && user?.curse_expires ? user.curse_expires : null),
    [isCursed, user?.curse_expires]
  );
  const burnDisabled =
    isCursed || !hasTutorial || loading || stage === 'awaiting' || stage === 'task';

  /* ── Clear poller on unmount ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  /* ── Centralized post-result handling ────────────────────────────── */
  const handleServerResult = useCallback(
    async (res) => {
      // res: { ok, newFragment|null, cursed, pity_counter, curse_expires?, awarded_rarity? }
      if (!res) return;

      // 1) Проклятие → показываем модалку и выходим
      if (res.cursed) {
        setCurseModalUntil(res.curse_expires || activeCurseUntil || null);
        try {
          if (typeof refreshUser === 'function') {
            await refreshUser({ force: true });
          }
        } catch { /* ignore */ }
        setStage('idle');
        return;
      }

      // 2) Есть новый фрагмент?
      const nf = Number(res.newFragment);
      if (Number.isFinite(nf)) {
        const owned =
          Array.isArray(user?.fragments) &&
          user.fragments.map(Number).includes(nf);

        // Пишем уведомление и авто-открытие ШИФРА только если фрагмент реально новый
        if (!owned) {
          try {
            localStorage.setItem(
              'newFragmentNotice',
              JSON.stringify({
                id: nf,
                rarity: res.awarded_rarity || null,
                ts: Date.now(),
              })
            );
          } catch { /* ignore */ }

          try {
            const tg = user?.tg_id || 'anon';
            localStorage.setItem(`autoCipherShown:v4:${tg}:${nf}`, '1');
          } catch { /* ignore */ }
        } else {
          // На всякий случай почистим возможный "залипший" ключ
          try { localStorage.removeItem('newFragmentNotice'); } catch { /* ignore */ }
        }

        // Обновляем профиль
        try {
          if (typeof refreshUser === 'function') {
            await refreshUser({ force: true });
          }
        } catch { /* ignore */ }

        // И сразу открываем шифр, если фрагмент новый
        if (!owned) setCipherFragId(nf);

        setStage('idle');
        return;
      }

      // 3) Ничего не выдано (редкий кейс) → просто рефреш и в idle
      try {
        if (typeof refreshUser === 'function') {
          await refreshUser({ force: true });
        }
      } catch { /* ignore */ }
      setStage('idle');
    },
    [activeCurseUntil, refreshUser, user?.fragments, user?.tg_id]
  );


  /* ── Start burn flow ─────────────────────────────────────────────── */
  const startBurn = useCallback(async () => {
    if (burnDisabled) return;

    setError('');
    setLoading(true);

    try {
      // { invoiceId, paymentUrl, tonspaceUrl, task, paid }
      const inv = await API.createBurn(user.tg_id);
      setInvoiceId(inv.invoiceId);

      if (inv.paid) {
        // Dev/stage auto-pay: go straight to the task.
        setTask(inv.task || null);
        setStage('task');
        return;
      }

      setStage('awaiting');

      // Start polling invoice status
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          // { paid, processed, task, result }
          const st = await API.getBurnStatus(inv.invoiceId);

          if (st.processed) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await handleServerResult(st.result);
            return;
          }

          if (st.paid) {
            // Stop polling; either task is ready or take a second look after a short delay.
            clearInterval(pollRef.current);
            pollRef.current = null;

            if (st.task) {
              setTask(st.task);
              setStage('task');
            } else {
              setTimeout(async () => {
                try {
                  const st2 = await API.getBurnStatus(inv.invoiceId);
                  if (st2.processed) {
                    await handleServerResult(st2.result);
                    return;
                  }
                  if (st2.task) {
                    setTask(st2.task);
                    setStage('task');
                  }
                } catch {
                  /* ignore */
                }
              }, SECOND_LOOK_MS);
            }
          }
        } catch (e) {
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('invalid token')) {
            logout();
            navigate('/login');
          }
        }
      }, POLL_MS);
    } catch (e) {
      setError(e?.message || 'Failed to create burn invoice');
    } finally {
      setLoading(false);
    }
  }, [burnDisabled, handleServerResult, logout, navigate, user?.tg_id]);

  /* ── Submit quest answer ─────────────────────────────────────────── */
  const submitQuest = useCallback(async () => {
    if (!invoiceId || !task) return;

    // Basic UX validation
    if (!answer) {
      setError('Choose or enter the answer');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const opts = getOptions(task);
      const correct = String(task?.params?.answer ?? '');
      const isCorrect =
        opts.length > 0
          ? String(answer) === correct
          : String(answer).trim() === correct.trim();

      if (!isCorrect) {
        // Record failure idempotently; processed=TRUE prevents later success.
        try {
          await API.completeBurn(invoiceId, false);
        } catch {
          /* ignore */
        }
        setStage('idle');
        setError('Quest failed');
        return;
      }

      // Commit success → server resolves curse/award
      const res = await API.completeBurn(invoiceId, true, { answer });
      await handleServerResult(res);
    } catch (e) {
      setError(e?.message || 'Failed to complete burn');
    } finally {
      setSubmitting(false);
    }
  }, [answer, handleServerResult, invoiceId, task]);

/* ── Render ─────────────────────────────────────────────────────────── */
return (
  <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', overflow: 'hidden' }}>
    {/* Фон */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: "url('/images/bg-burn.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.56)' }} />

    {/* Канва под iPhone 14/15 Pro: 393×800, все элементы в абсолюте */}
    <div style={{ position: 'relative', width: 393, height: 800, margin: '0 auto', overflow: 'hidden' }}>
      {/* Заголовок */}
      <h1
        style={{
          position: 'absolute',
          top: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 32,            // было 40
          lineHeight: '40px',
          color: '#9E9191',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        Burn Yourself
      </h1>

      {/* Подпись "Element rarity" — по центру и меньше, чтобы не наезжала на иконки */}
      <div
        style={{
          position: 'absolute',
          top: 112,                // было 115, немного выше
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 16,            // было 20
          lineHeight: '20px',
          color: '#9E9191',
          whiteSpace: 'nowrap',
        }}
      >
        Element rarity
      </div>

      {/* Иконки редкостей (левая колонка) */}
      <img src="/images/icons/legendary.png" alt="Legendary" draggable={false}
          style={{ position: 'absolute', left: 34, top: 149, width: 44, height: 56, objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />
      <img src="/images/icons/rare.png" alt="Rare" draggable={false}
          style={{ position: 'absolute', left: 26, top: 215, width: 60, height: 60, objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />
      <img src="/images/icons/uncommon.png" alt="Uncommon" draggable={false}
          style={{ position: 'absolute', left: 26, top: 285, width: 59, height: 59, objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />
      <img src="/images/icons/common.png" alt="Common" draggable={false}
          style={{ position: 'absolute', left: 18, top: 353, width: 74, height: 74, objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />

      {/* Строка 1 — Legendary / 5% (сжали высоту и поправили выравнивание текста) */}
      <div style={{ position: 'absolute', left: 102, top: 149, width: 193, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 306, top: 149, width: 58, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 151, top: 164, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        Legendary
      </div>
      <div style={{ position: 'absolute', left: 322, top: 164, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        5%
      </div>

      {/* Строка 2 — Rare / 15% */}
      <div style={{ position: 'absolute', left: 102, top: 214, width: 193, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 306, top: 214, width: 58, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 152, top: 233, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        Rare
      </div>
      <div style={{ position: 'absolute', left: 318, top: 233, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        15%
      </div>

      {/* Строка 3 — Uncommon / 30% */}
      <div style={{ position: 'absolute', left: 102, top: 280, width: 193, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 306, top: 280, width: 58, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 152, top: 302, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        Uncommon
      </div>
      <div style={{ position: 'absolute', left: 316, top: 302, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        30%
      </div>

      {/* Строка 4 — Common / 50% */}
      <div style={{ position: 'absolute', left: 102, top: 346, width: 193, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 306, top: 346, width: 58, height: 54, border: '1px solid #979696', borderRadius: 16 }} />
      <div style={{ position: 'absolute', left: 151, top: 371, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        Common
      </div>
      <div style={{ position: 'absolute', left: 316, top: 371, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 18, color: '#9E9191', whiteSpace: 'nowrap' }}>
        50%
      </div>

      {/* CTA: Burn — чуть выше, чтобы убрать прокрутку */}
      <button
        onClick={startBurn}
        disabled={burnDisabled}
        style={{
          position: 'absolute',
          left: 70,
          top: 455,                 // было 480
          width: 265,
          height: 76,
          border: 'none',
          background: burnDisabled
            ? 'linear-gradient(90deg, #777, #555)'
            : 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0,0,0,0.87)',
          borderRadius: 40,
          color: '#fff',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 24,
          cursor: burnDisabled ? 'default' : 'pointer',
          opacity: burnDisabled ? 0.7 : 1,
        }}
        title={
          !hasTutorial ? 'Collect fragments #1–#3 to unlock burns'
          : isCursed ? 'You are cursed right now'
          : ''
        }
      >
        {loading || stage === 'awaiting' ? 'Processing…' : 'BURN 0,5 TON'}
      </button>

      {/* Secondary: To Gallery — ближе к кнопке */}
      <button
        onClick={() => navigate('/gallery')}
        style={{
          position: 'absolute',
          left: 70,
          top: 540,                 // было 572
          width: 265,
          height: 37,
          border: '1px solid #C2C2C2',
          borderRadius: 40,
          background: 'transparent',
          color: '#fff',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 14,
          filter: 'drop-shadow(0px 6px 6px rgba(0,0,0,0.87))',
          cursor: 'pointer',
        }}
      >
        To Gallery
      </button>

      {/* Предупреждение — компактнее и выше */}
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 632,                 // было 682
          width: 318,
          height: 48,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 14,             // было 15
          lineHeight: '17px',
          color: '#9E9191',
          textAlign: 'center',
        }}
      >
        Please ensure you send exactly 0.5 TON when making your payment.
        Transactions for any other amount may be lost.
      </div>
    </div>


    {/* Оверлеи логики — как было в твоей версии */}
    {stage === 'awaiting' && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Waiting for payment"
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <span style={{ color: '#fff', fontSize: 18 }}>Waiting for payment…</span>
      </div>
    )}

    {stage === 'task' && task && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Complete the quest to finish the burn"
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 320, background: 'rgba(0,0,0,0.6)',
            border: '1px solid #9E9191', color: '#fff',
            borderRadius: 16, padding: 16,
          }}
        >
          <p style={{ margin: '0 0 12px', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>
            {task.params?.question || 'Solve the quest to complete the burn:'}
          </p>

          {getOptions(task).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getOptions(task).map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="burn-quiz"
                    value={opt}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitQuest(); }}
              autoFocus
              style={{
                width: '100%', height: 40, padding: '0 12px',
                borderRadius: 10, border: '1px solid #9E9191',
                background: '#161616', color: '#fff',
              }}
            />
          )}

          {error && <div style={{ color: 'tomato', marginTop: 10 }}>{error}</div>}

          <button
            onClick={submitQuest}
            disabled={!answer || submitting}
            style={{
              marginTop: 16, width: '100%', height: 44,
              background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontWeight: 700, cursor: !answer || submitting ? 'default' : 'pointer',
              opacity: !answer || submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Submitting…' : 'Complete Burn'}
          </button>
        </div>
      </div>
    )}

    {curseModalUntil && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="You are cursed"
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: 320, background: '#2a2a2a', color: '#fff',
            border: '1px solid #9E9191', borderRadius: 16, padding: 16, textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 10px' }}>You are cursed</h3>
          <p style={{ margin: '0 0 6px' }}>The ritual failed. No fragment was granted.</p>
          <p style={{ margin: '0 0 12px' }}>
            Time left:{' '}
            <strong><Countdown to={curseModalUntil} /></strong>
          </p>
          <button
            onClick={async () => {
              setCurseModalUntil(null);
              try { if (typeof refreshUser === 'function') await refreshUser({ force: true }); } catch {}
            }}
            style={{
              width: '100%', height: 44,
              background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
              border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer',
            }}
          >
            OK
          </button>
        </div>
      </div>
    )}

    {cipherFragId && (
      <CipherModal
        key={cipherFragId}
        fragId={cipherFragId}
        onClose={() => setCipherFragId(null)}
        onCompleted={async () => {
          try { if (typeof refreshUser === 'function') await refreshUser({ force: true }); } catch {}
          setCipherFragId(null);
          navigate('/gallery');
        }}
      />
    )}
  </div>
);
}
