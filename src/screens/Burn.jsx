import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle');
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [result, setResult] = useState({});
  const [error, setError] = useState('');

  const BASE_AMOUNT_NANO = 500_000_000; // 0.5 TON

  const startBurn = async () => {
    setStatus('pending');
    setError('');
    try {
      const { invoiceId, paymentUrl } = await API.createBurn(user.tg_id, BASE_AMOUNT_NANO);
      setInvoiceId(invoiceId);
      setPaymentUrl(paymentUrl);
    } catch (e) {
      setError(e.message || 'Error creating invoice');
      setStatus('error');
      if (e.message.toLowerCase().includes('invalid token')) {
        logout();
        navigate('/login');
      }
    }
  };

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
        if (e.message.toLowerCase().includes('invalid token')) {
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
        style={{
          position: 'absolute',
          left: 70,
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
          cursor: 'pointer',
        }}
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

      {/* Подсказка */}
      <p
        style={{
          position: 'absolute',
          left: 52,
          top: 594,
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

      {/* Обработка состояний */}
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
          <span>Congratulations! You got a {result.category} fragment.</span>
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
          <span>{error}</span>
          <button onClick={() => setStatus('idle')} style={{ marginTop: 16 }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
