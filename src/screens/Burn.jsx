import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

function Countdown({ to }) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(to) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, new Date(to) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [to]);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <>{hh}:{mm}:{ss}</>;
}

export default function Burn() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle');     // idle | pending | success | error
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [result, setResult] = useState({});
  const [error, setError] = useState('');

  const BASE_AMOUNT_NANO = 500_000_000; // 0.5 TON

  // Derived user state
  const frags = Array.isArray(user?.fragments) ? user.fragments.map(Number) : [];
  const has1 = frags.includes(1);
  const has2 = frags.includes(2);
  const has3 = frags.includes(3);
  const mandatoryDone = has1 && has2 && has3;

  const curse = useMemo(() => {
    if (!user?.is_cursed || !user?.curse_expires) return null;
    const active = new Date(user.curse_expires) > new Date();
    return active ? user.curse_expires : null;
  }, [user]);

  // instant refresh on enter
  useEffect(() => {
    refreshUser?.({ silent: true, force: true });
  }, [refreshUser]);

  // poll while burn is blocked (no 1–3 or curse) OR while waiting for payment
  useEffect(() => {
    const needPoll = !mandatoryDone || !!curse || status === 'pending';
    if (!needPoll) return;
    const id = setInterval(() => refreshUser?.({ silent: true }), 3000);
    return () => clearInterval(id);
  }, [mandatoryDone, curse, status, refreshUser]);

  // After success/error, pull fresh profile once (to get new fragment ASAP)
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      refreshUser?.({ silent: true, force: true });
    }
  }, [status, refreshUser]);

  const startBurn = async () => {
    if (!mandatoryDone) {
      setError('Collect fragments #1–#3 first.');
      setStatus('error');
      return;
    }
    if (curse) {
      setError('You are cursed. Wait until the timer ends.');
      setStatus('error');
      return;
    }
    setStatus('pending');
    setError('');
    try {
      const { invoiceId, paymentUrl } = await API.createBurn(user.tg_id, BASE_AMOUNT_NANO);
      setInvoiceId(invoiceId);
      setPaymentUrl(paymentUrl);
    } catch (e) {
      setError(e.message || 'Error creating invoice');
      setStatus('error');
      if (String(e.message || '').toLowerCase().includes('invalid token')) {
        logout();
        navigate('/login');
      }
    }
  };

  // Poll payment status when pending
  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        if (res.paid) {
          clearInterval(timer);
          setResult(res);
          setStatus('success');
        }
      } catch (e) {
        clearInterval(timer);
        setError(e.message || 'Error checking payment');
        setStatus('error');
        if (String(e.message || '').toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId, logout, navigate]);

  const rarityItems = [
    { key: 'legendary', label: 'Legendary', percent: '5%',    icon: '/images/icons/legendary.png', top: 149 },
    { key: 'rare',      label: 'Rare',      percent: '15%',   icon: '/images/icons/rare.png',      top: 218 },
    { key: 'uncommon',  label: 'Uncommon',  percent: '30%',   icon: '/images/icons/uncommon.png',  top: 287 },
    { key: 'common',    label: 'Common',    percent: '50%',   icon: '/images/icons/common.png',    top: 356 },
  ];

  const burnDisabled = !!curse || !mandatoryDone || status === 'pending';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Checker background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/Checker.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Burn background + gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "linear-gradient(0deg, rgba(0,0,0,0.56), rgba(0,0,0,0.56)), url('/images/bg-burn.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
      />

      {/* Навигация */}
      <BackButton
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 5,
          color: '#ffffff',
        }}
      />

      {/* Заголовок */}
      <h1
        style={{
          position: 'absolute',
          top: 25,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 40,
          lineHeight: '48px',
          color: '#9E9191',
          whiteSpace: 'nowrap',
          zIndex: 5,
        }}
      >
        Burn&nbsp;Yourself
      </h1>

      {/* Баннеры блокировки */}
      {!mandatoryDone && (
        <div style={{
          position:'absolute', top:80, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.6)', color:'#fff', border:'1px solid #979696',
          padding:'8px 12px', borderRadius:12, zIndex:6, whiteSpace:'nowrap'
        }}>
          Collect fragments #1–#3 to start burning.
        </div>
      )}
      {curse && (
        <div style={{
          position:'absolute', top:110, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.6)', color:'#fff', border:'1px solid #979696',
          padding:'8px 12px', borderRadius:12, zIndex:6, whiteSpace:'nowrap'
        }}>
          You are cursed. Time left: <Countdown to={curse} />
        </div>
      )}

      {/* Элемент редкости */}
      <h3
        style={{
          position: 'absolute',
          left: 46,
          top: 90,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          lineHeight: '24px',
          color: '#9E9191',
          zIndex: 5,
        }}
      >
        Element rarity
      </h3>

      {/* Ряды редкостей */}
      {rarityItems.map(({ key, label, percent, icon, top }) => (
        <React.Fragment key={key}>
          <div
            style={{
              position: 'absolute',
              left: 26,
              top,
              width: 58,
              height: 58,
              backgroundImage: `url('${icon}')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 102,
              top,
              width: 193,
              height: 58,
              border: '1px solid #979696',
              borderRadius: 16,
              zIndex: 5,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 152,
              top: top + 21,
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '24px',
              color: '#9E9191',
              zIndex: 5,
            }}
          >
            {label}
          </span>
          <span
            style={{
              position: 'absolute',
              left: 316,
              top: top + 21,
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '24px',
              color: '#9E9191',
              zIndex: 5,
            }}
          >
            {percent}
          </span>
        </React.Fragment>
      ))}

      {/* Кнопка */}
      <button
        onClick={startBurn}
        disabled={burnDisabled}
        style={{
          position: 'absolute',
          left: 65,
          top: 480,
          width: 265,
          height: 76,
          backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0,0,0,0.87)',
          border: 'none',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          cursor: burnDisabled ? 'not-allowed' : 'pointer',
          opacity: burnDisabled ? 0.6 : 1,
        }}
        title={
          curse ? 'Cursed — wait for timer'
            : (!mandatoryDone ? 'Collect 1–3 first' : undefined)
        }
      >
        <span
          style={{
            fontFamily: 'Tajawal, sans-serif',
            fontWeight: 700,
            fontSize: 24,
            lineHeight: '29px',
            color: '#FFFFFF',
          }}
        >
          BURN&nbsp;0,5&nbsp;TON
        </span>
      </button>

      {/* Back to Gallery */}
<div
  onClick={() => navigate('/gallery')}
  style={{
    position: 'absolute',
    left: 65,
    top: 566,                  // ниже основной кнопки
    width: 265,
    height: 56,                // чуть ниже и компактнее
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
      fontSize: 20,
      color: '#FFF',
      letterSpacing: 0.5,
    }}
  >
    TO GALLERY
  </span>
</div>


      {/* Подсказка */}
      <p
        style={{
          position: 'absolute',
          left: 42,
          top: 650,
          width: 318,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          lineHeight: '18px',
          color: '#9E9191',
          textAlign: 'center',
          zIndex: 5,
        }}
      >
        Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.
      </p>

      {/* Оверлеи состояний */}
      {status === 'pending' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#fff', fontSize: 18 }}>Waiting for payment...</span>
        </div>
      )}
      {status === 'success' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: '#fff',
          }}
        >
          <span>Congratulations! Your burn was processed.</span>
          <button onClick={() => navigate('/gallery')} style={{ marginTop: 16 }}>
            View Gallery
          </button>
        </div>
      )}
      {status === 'error' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: 'tomato',
          }}
        >
          <span>{error || 'Something went wrong'}</span>
          <button onClick={() => setStatus('idle')} style={{ marginTop: 16 }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
