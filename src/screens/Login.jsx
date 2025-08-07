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
      const { user: userObj, token } = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null
      });
      login(userObj, token);
      navigate('/burn', { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
        fontSize: 16
      }}>
        Loading Telegram WebApp…
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: "url('/images/bg-welcome.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
      }}/>

      {/* Logo */}
      <div style={{
        position: 'absolute',
        width: 212,
        height: 180,
        left: '50%',
        top: 39,
        transform: 'translateX(-50%)',
        backgroundImage: "url('/images/logo_trimmed_optimized.png')",
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
      }}/>

      {/* Welcome */}
      <h1 style={{
        position: 'absolute',
        width: 197,
        height: 54,
        left: '50%',
        top: 345,
        transform: 'translateX(-50%)',
        fontFamily: 'MedievalSharp, serif',
        fontWeight: 500,
        fontSize: 48,
        lineHeight: '54px',
        color: '#D6CEBD',
        textAlign: 'center',
        zIndex: 1,
      }}>
        Welcome
      </h1>

      {/* Error */}
      {error && (
        <p style={{
          position: 'absolute',
          width: '80%',
          left: '50%',
          top: 380,
          transform: 'translateX(-50%)',
          color: 'tomato',
          textAlign: 'center',
          zIndex: 1,
        }}>
          {error}
        </p>
      )}

      {/* Name input */}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          position: 'absolute',
          width: 256,
          height: 36,
          left: '50%',
          top: 421,
          transform: 'translateX(-50%)',
          padding: '0 12px',
          background: 'rgba(180,180,180,0.51)',
          border: '1px solid #D6CEBD',
          borderRadius: 20,
          fontFamily: 'MedievalSharp, serif',
          fontSize: 15,
          lineHeight: '17px',
          color: '#D6CEBD',
          zIndex: 1,
        }}
      />

      {/* Referral input */}
      <input
        type="text"
        placeholder="Referral code (optional)"
        value={refCode}
        onChange={e => setRefCode(e.target.value)}
        style={{
          position: 'absolute',
          width: 256,
          height: 36,
          left: '50%',
          top: 473,
          transform: 'translateX(-50%)',
          padding: '0 12px',
          background: 'rgba(180,180,180,0.51)',
          border: '1px solid #D6CEBD',
          borderRadius: 20,
          fontFamily: 'MedievalSharp, serif',
          fontSize: 15,
          lineHeight: '17px',
          color: '#D6CEBD',
          zIndex: 1,
        }}
      />

      {/* Start playing */}
      <button
        onClick={handleStart}
        disabled={!name.trim()}
        style={{
          position: 'absolute',
          width: 256,
          height: 36,
          left: '50%',
          top: 525,
          transform: 'translateX(-50%)',
          background: name.trim() ? '#D18622' : '#888',
          border: name.trim() ? '1px solid #E0933A' : '1px solid #666',
          borderRadius: 20,
          fontFamily: 'MedievalSharp, serif',
          fontWeight: 500,
          fontSize: 15,
          lineHeight: '17px',
          color: name.trim() ? '#191610' : '#444',
          cursor: name.trim() ? 'pointer' : 'not-allowed',
          zIndex: 1,
        }}
      >
        Start playing
      </button>
    </div>
  );
}
