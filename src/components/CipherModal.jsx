// src/components/CipherModal.jsx
import React, { useEffect, useState } from 'react';
import API from '../utils/apiClient';

export default function CipherModal({ fragId, onClose, onCompleted }) {
  // debug toggle
  const DBG = (() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      return qs.get('dbg') === '1' || localStorage.getItem('debug') === '1';
    } catch { return false; }
  })();
  const d = (...a) => DBG && console.log('[CIPHER]', ...a);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [riddleUrl, setRiddleUrl] = useState('');
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let dead = false;
    d('open fragId=', fragId);
    (async () => {
      setLoading(true); setErr(''); setSelected(null);
      try {
        const data = await API.getCipher(fragId);
        if (dead) return;
        d('getCipher OK', data);
        setRiddleUrl(data?.riddle?.url || '');
        setGrid(Array.isArray(data?.gridNumbers) ? data.gridNumbers : []);
      } catch (e) {
        if (!dead) setErr(e?.message || 'Failed to load cipher');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; d('close'); };
  }, [fragId]);

  const submit = async () => {
    if (selected === null) return;
    setSubmitting(true); setErr('');
    try {
      const resp = await API.answerCipher(fragId, Number(selected));
      d('answerCipher', resp);
      if (resp?.ok && resp.symbolId) {
        onCompleted?.(resp.symbolId);
        onClose?.();
      } else {
        setErr(resp?.error || 'Failed to submit');
      }
    } catch (e) {
      setErr(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cipher for fragment ${fragId}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(92vw, 420px)',      // даём модалке подрасти, чтобы квадрат уместился крупнее
          maxHeight: '92dvh',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid #9E9191',
          borderRadius: 16,
          padding: 16,
          color: '#fff',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
        }}>
          <h3 style={{ margin: 0, fontFamily: 'Tajawal, sans-serif' }}>
            Fragment #{fragId} — Cipher
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p style={{ opacity: 0.8 }}>Loading…</p>
        ) : err ? (
          <p style={{ color: 'tomato' }}>{err}</p>
        ) : (
          <>
            {/* Квадрат загадки, максимально возможный: ширина модалки, высота = ширине */}
            {riddleUrl && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  marginBottom: 12,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #9E9191',
                  background: '#111',
                }}
              >
                <img
                  src={riddleUrl}
                  alt="Riddle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',   // влезает без обрезки
                    display: 'block',
                  }}
                />
              </div>
            )}

            {/* Квадратная 4×4 сетка из квадратных ячеек */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',        // вся сетка = квадрат
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {grid.map((n, idx) => {
                const active = selected === n;
                return (
                  <button
                    key={`${n}-${idx}`}
                    onClick={() => !submitting && setSelected(n)}
                    disabled={submitting}
                    style={{
                      // каждая клетка — квадрат
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 12,
                      border: '1px solid #9E9191',
                      background: active
                        ? 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)'
                        : '#161616',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: submitting ? 'default' : 'pointer',
                      boxShadow: active ? '0 0 0 2px rgba(216,30,93,0.35) inset' : 'none',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
              {/* На случай, если API пришлёт меньше 16 чисел — заполним «пустышками», чтобы всегда был квадрат */}
              {Array.from({ length: Math.max(0, 16 - grid.length) }).map((_, i) => (
                <div
                  key={`pad-${i}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 12,
                    border: '1px dashed #555',
                    background: '#0f0f0f',
                  }}
                />
              ))}
            </div>

            <button
              onClick={submit}
              disabled={selected === null || submitting}
              style={{
                width: '100%',
                height: 48,
                background: 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                opacity: (selected === null || submitting) ? 0.6 : 1,
                cursor: (selected === null || submitting) ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Confirm choice'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
