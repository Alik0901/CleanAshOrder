import React, { useEffect, useState } from 'react';
import API from '../utils/apiClient';

export default function CipherModal({ fragId, onClose, onCompleted }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [riddleUrl, setRiddleUrl] = useState('');
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true); setErr('');
      try {
        const data = await API.getCipher(fragId);
        if (dead) return;
        setRiddleUrl(data?.riddle?.url || '');
        setGrid(Array.isArray(data?.gridNumbers) ? data.gridNumbers : []);
      } catch (e) {
        if (!dead) setErr(e?.message || 'Failed to load cipher');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [fragId]);

  const submit = async () => {
    if (selected === null) return;
    setSubmitting(true); setErr('');
    try {
      const resp = await API.answerCipher(fragId, Number(selected));
      // resp: { ok: true, symbolId }
      if (resp?.ok && resp.symbolId) {
        onCompleted?.(resp.symbolId);
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
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.78)',
      display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <div style={{
        width: 340, maxWidth:'92%',
        background:'rgba(0,0,0,0.6)',
        border:'1px solid #9E9191',
        borderRadius:16, padding:16, color:'#fff'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h3 style={{ margin:0, fontFamily:'Tajawal, sans-serif' }}>Fragment #{fragId} — Cipher</h3>
          <button onClick={onClose}
                  style={{ background:'transparent', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ opacity:0.8 }}>Loading…</p>
        ) : err ? (
          <p style={{ color:'tomato' }}>{err}</p>
        ) : (
          <>
            {/* Картинка-загадка */}
            {riddleUrl && (
              <div style={{
                width:'100%', height:180, marginBottom:12,
                borderRadius:10, overflow:'hidden', border:'1px solid #9E9191',
                background:'#111'
              }}>
                <img src={riddleUrl} alt="Riddle"
                     style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
            )}

            {/* Сетка 4x4 */}
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12
            }}>
              {grid.map((n, idx) => {
                const active = selected === n;
                return (
                  <button
                    key={`${n}-${idx}`}
                    onClick={() => setSelected(n)}
                    style={{
                      height:44, borderRadius:10, border:'1px solid #9E9191',
                      background: active ? 'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)' : '#161616',
                      color:'#fff', fontWeight:700, cursor:'pointer'
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <button
              onClick={submit}
              disabled={selected === null || submitting}
              style={{
                width:'100%', height:44,
                background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border:'none', borderRadius:10, color:'#fff', fontWeight:700,
                opacity: (selected===null||submitting)?0.6:1, cursor:(selected===null||submitting)?'default':'pointer'
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
