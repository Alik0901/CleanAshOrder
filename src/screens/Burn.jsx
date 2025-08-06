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
  const [result, setResult] = useState({ category: '', fragmentId: null, pity_counter: 0 });
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
          setResult({ category: res.category, fragmentId: res.newFragment, pity_counter: res.pity_counter });
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

  // Static layout
  const rarityItems = [
    { key: 'legendary', label: 'Legendary', percent: '5%',  icon: '/images/icons/legendary.png', top: 197 },
    { key: 'rare',      label: 'Rare',      percent: '15%', icon: '/images/icons/rare.png',      top: 266 },
    { key: 'uncommon',  label: 'Uncommon',  percent: '30%', icon: '/images/icons/uncommon.png',  top: 335 },
    { key: 'common',    label: 'Common',    percent: '50%', icon: '/images/icons/common.png',    top: 404 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflowX: 'hidden' }}>
      {/* Checker overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/Checker.webp')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />

      {/* Burn background with gradient */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.56), rgba(0,0,0,0.56)), url('/images/bg-burn.webp')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />

      <BackButton style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, color: '#fff' }} />

      <h1
        style={{
          position: 'absolute', left: 79, top: 45, width: 235, height: 96,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 40, lineHeight: '48px',
          color: '#9E9191', whiteSpace: 'pre-line', textAlign: 'center',
        }}
      >
        Burn<br/>Yourself
      </h1>

      <h3
        style={{
          position: 'absolute', left: 46, top: 163, width: 127, height: 24,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px',
          color: '#9E9191',
        }}
      >
        Element rarity
      </h3>

      {rarityItems.map(item => (
        <React.Fragment key={item.key}>
          {/* Icon */}
          <div
            style={{
              position: 'absolute', left: 26, top: item.top,
              width: 58, height: 58,
              backgroundImage: `url('${item.icon}')`,
              backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Frame */}
          <div
            style={{
              position: 'absolute', left: 102, top: item.top,
              width: 193, height: 58,
              border: '1px solid #979696',
              borderRadius: 16,
            }}
          />

          {/* Label */}
          <span
            style={{
              position: 'absolute', left: 152, top: item.top + 21,
              fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px',
              color: '#9E9191',
            }}
          >
            {item.label}
          </span>

          {/* Percent */}
          <span
            style={{
              position: 'absolute', left: 316, top: item.top + 21,
              fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px',
              color: '#9E9191',
            }}
          >
            {item.percent}
          </span>
        </React.Fragment>
      ))}

      <button
        onClick={startBurn}
        style={{
          position: 'absolute', left: 70, top: 520, width: 265, height: 76,
          backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0,0,0,0.87)', borderRadius: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '29px', color: '#FFFFFF',
          }}
        >
          BURN 0,5 TON
        </span>
      </button>

      <p
        style={{
          position: 'absolute', left: 52, top: 634, width: 318, height: 53,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: '18px', color: '#9E9191',
          textAlign: 'center',
        }}
      >
        Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.
      </p>
    </div>
  );
}
