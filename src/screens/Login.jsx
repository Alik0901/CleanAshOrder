// src/screens/Login.jsx

import React, { useState, useEffect, useContext } from 'react';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [tgId, setTgId]         = useState(null);
  const [name, setName]         = useState('');
  const [refCode, setRefCode]   = useState('');
  const [initData, setInitData] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setError('Please open inside Telegram WebApp.');
      setLoading(false);
      return;
    }
    tg.ready();
    const unsafe = tg.initDataUnsafe || {};
    const user   = unsafe.user || {};
    if (!user.id) {
      setError('Failed to get Telegram ID.');
      setLoading(false);
      return;
    }
    setTgId(user.id);
    setName(user.first_name || '');
    setInitData(tg.initData || '');
    setLoading(false);
  }, []);

  const handleStart = async () => {
    if (!tgId || !initData) {
      setError('Telegram data missing. Reopen WebApp.');
      return;
    }
    setError('');
    try {
      const resp = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null,
      });

      // Если это новый пользователь (на этом устройстве) — сбрасываем локальные флаги модалок
      try {
        const prev = localStorage.getItem('last_tg_id');
        if (String(prev) !== String(resp.user?.tg_id)) {
          ['firstFragmentShown','newFragmentNotice','showFirstFragmentNotice','showInitialAward']
            .forEach((k) => localStorage.removeItem(k));
          localStorage.setItem('last_tg_id', String(resp.user?.tg_id || ''));
        }
      } catch {}

      // Если бэк сразу выдал фрагмент #1 — покажем универсальную нотификацию
      try {
        if (resp?.initial_award && Number(resp.initial_award.fragment) === 1) {
          localStorage.setItem('newFragmentNotice', '1');
        }
      } catch {}

      login(resp.user, resp.token);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    }
  };

  if (loading) {
    return (
      <div style={{
        display:'flex', height:'100vh', background:'#000', color:'#fff',
        alignItems:'center', justifyContent:'center', fontFamily:'MedievalSharp, serif', fontSize:16
      }}>
        Loading Telegram WebApp…
      </div>
    );
  }

  return (
    <div style={{
      position:'relative', width:'100%', height:'100vh', overflow:'hidden', fontFamily:'MedievalSharp, serif',
    }}>
      {/* Фон */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:"url('/images/bg-welcome.webp')",
        backgroundSize:'cover', backgroundPosition:'center', zIndex:0,
      }}/>
      {/* Оверлей */}
      <div style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:1 }}/>
      {/* Контент */}
      <div style={{ position:'absolute', inset:0, overflowY:'auto', WebkitOverflowScrolling:'touch', zIndex:2 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:39, paddingBottom:40 }}>
          <div style={{
            width:212, height:180, backgroundImage:"url('/images/logo_trimmed_optimized.png')",
            backgroundSize:'contain', backgroundRepeat:'no-repeat',
          }}/>
          <h1 style={{ marginTop:56, fontSize:48, lineHeight:'54px', color:'#D6CEBD', textAlign:'center' }}>
            Welcome
          </h1>

          {error && (
            <p style={{ marginTop:16, color:'tomato', textAlign:'center', width:'80%' }}>{error}</p>
          )}

          <input
            type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}
            style={{
              marginTop:40, width:256, height:36, padding:'0 12px',
              background:'rgba(180,180,180,0.51)', border:'1px solid #D6CEBD',
              borderRadius:20, fontSize:15, color:'#D6CEBD',
            }}
          />

          <input
            type="text" placeholder="Referral code (optional)" value={refCode} onChange={e=>setRefCode(e.target.value)}
            style={{
              marginTop:20, width:256, height:36, padding:'0 12px',
              background:'rgba(180,180,180,0.51)', border:'1px solid #D6CEBD',
              borderRadius:20, fontSize:15, color:'#D6CEBD',
            }}
          />

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            style={{
              marginTop:30, width:256, height:36,
              background: name.trim() ? '#D18622' : '#777',
              border: name.trim() ? '1px solid #E0933A' : '1px solid #555',
              borderRadius:20, fontSize:15,
              color: name.trim() ? '#191610' : '#333',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}
