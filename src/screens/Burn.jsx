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

  // Render only idle state; other states can overlay similarly
  return (
    <div style={{ position: 'relative', width: '393px', height: '800px', margin: '0 auto' }}>
      {/* Checker background */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: "url('/images/Checker.png')", backgroundSize: 'cover',
        }}
      />
      {/* Burn background with gradient overlay */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '-1px', width: '801px', height: '801px',
          transform: 'translateX(-50%)',
          backgroundImage: /*"linear-gradient(0deg, rgba(0,0,0,0.56), rgba(0,0,0,0.56)),*/ "url('/images/bg-burn.png')",
          backgroundSize: 'cover',
        }}
      />

      {/* Back button */}
      <BackButton style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, color: '#fff' }} />

      {/* Title */}
      <h1
        style={{
          position: 'absolute', left: 79, top: 45, width: 235, height: 48,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 40, lineHeight: '48px', color: '#9E9191',
        }}
      >
        Burn Yourself
      </h1>

      {/* Element rarity label */}
      <h3
        style={{
          position: 'absolute', left: 46, top: 115, width: 127, height: 24,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191',
        }}
      >
        Element rarity
      </h3>

      {/* Rarity rows */}
      {/* Legendary */}
      <div style={{ position: 'absolute', left: 26, top: 149, width: 44, height: 56, backgroundImage: "url('/images/icons/legendary.png')", backgroundSize: 'cover' }} />
      <div style={{ position: 'absolute', left: 102, top: 149, width: 193, height: 58, border: '1px solid #979696', borderRadius: 16 }} />
      <span style={{ position: 'absolute', left: 152, top: 170, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>Legendary</span>
      <span style={{ position: 'absolute', left: 322, top: 170, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>5%</span>

      {/* Rare */}
      <div style={{ position: 'absolute', left: 26, top: 218, width: 58, height: 58, backgroundImage: "url('/images/icons/rare.png')", backgroundSize: 'cover' }} />
      <div style={{ position: 'absolute', left: 102, top: 218, width: 193, height: 58, border: '1px solid #979696', borderRadius: 16 }} />
      <span style={{ position: 'absolute', left: 152, top: 239, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>Rare</span>
      <span style={{ position: 'absolute', left: 318, top: 239, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>15%</span>

      {/* Uncommon */}
      <div style={{ position: 'absolute', left: 26, top: 285, width: 59, height: 59, backgroundImage: "url('/images/icons/uncommon.png')", backgroundSize: 'cover' }} />
      <div style={{ position: 'absolute', left: 102, top: 287, width: 193, height: 58, border: '1px solid #979696', borderRadius: 16 }} />
      <span style={{ position: 'absolute', left: 152, top: 305, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>Uncommon</span>
      <span style={{ position: 'absolute', left: 316, top: 308, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>30%</span>

      {/* Common */}
      <div style={{ position: 'absolute', left: 26, top: 353, width: 74, height: 74, backgroundImage: "url('/images/icons/common.png')", backgroundSize: 'cover' }} />
      <div style={{ position: 'absolute', left: 102, top: 356, width: 193, height: 58, border: '1px solid #979696', borderRadius: 16 }} />
      <span style={{ position: 'absolute', left: 151, top: 377, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>Common</span>
      <span style={{ position: 'absolute', left: 316, top: 374, fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 20, lineHeight: '24px', color: '#9E9191' }}>50%</span>

      {/* Burn button */}
      <button
        onClick={startBurn}
        style={{
          position: 'absolute', left: 70, top: 480, width: 265, height: 76,
          backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0,0,0,0.87)', borderRadius: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '29px', color: '#FFFFFF' }}>
          BURN 0,5 TON
        </span>
      </button>

      {/* Disclaimer */}
      <p
        style={{
          position: 'absolute', left: 52, top: 594, width: 318, height: 53,
          fontFamily: 'Tajawal, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: '18px', color: '#9E9191',
          textAlign: 'center'
        }}
      >
        Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.
      </p>
    </div>
  );
}
