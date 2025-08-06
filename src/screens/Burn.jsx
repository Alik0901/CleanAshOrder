import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

const BASE_AMOUNT_NANO = 500_000_000; // 0.5 TON
const PITY_BOOST_PER = 1;  // +1% per non-successful burn
const PITY_CAP = 20;       // maximum +20%

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [error, setError] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [result, setResult] = useState({ category: '', fragmentId: null, pity_counter: 0 });

  useEffect(() => {
    // fetch pity counter if needed from backend; for now assume 0
    setResult(r => ({ ...r, pity_counter: 0 }));
  }, []);

  const computeChances = () => {
    const boost = Math.min(result.pity_counter * PITY_BOOST_PER, PITY_CAP);
    const baseRare = 15;
    const baseLegend = 5;
    const sumRL = baseRare + baseLegend;
    return [
      { key: 'legendary', label: 'Legendary', percent: (baseLegend + boost * (baseLegend / sumRL)).toFixed(1) || '0' },
      { key: 'rare', label: 'Rare', percent: (baseRare + boost * (baseRare / sumRL)).toFixed(1) || '0' },
      { key: 'uncommon', label: 'Uncommon', percent: '30' },
      { key: 'common', label: 'Common', percent: '50' },
    ];
  };

  const startBurn = async () => {
    setStatus('pending'); setError('');
    try {
      const { invoiceId, paymentUrl } = await API.createBurn(user.tg_id, BASE_AMOUNT_NANO);
      setInvoiceId(invoiceId);
      setPaymentUrl(paymentUrl);
    } catch (e) {
      setError(e.message || 'Error creating invoice');
      setStatus('error');
      if (e.message.toLowerCase().includes('invalid token')) {
        logout(); navigate('/login');
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
          logout(); navigate('/login');
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId, logout, navigate]);

  const chances = computeChances();

  return (
    <div className="relative w-[393px] h-[800px] mx-auto">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[url('/images/Checker.png')] bg-cover"></div>
      <div className="absolute left-1/2 top-[-1px] w-[801px] h-[801px] -translate-x-1/2 bg-center bg-cover" style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.56), rgba(0,0,0,0.56)), url('/images/bg-burn.png')` }} />

      {/* Back button */}
      <BackButton className="absolute top-4 left-4 z-10 text-white" />

      {/* Title */}
      <h1 className="absolute left-[79px] top-[45px] w-[235px] h-[48px] font-Tajawal font-bold text-[40px] leading-[48px] text-[#9E9191]">
        Burn Yourself
      </h1>

      {status === 'idle' && (
        <>
          {/* Chance blocks */}
          {chances.map((c, i) => {
            const topOffset = 149 + i * 69; // 149,218,287,356
            return (
              <React.Fragment key={c.key}>
                <div className={`absolute left-[102px] top-[${topOffset}px] w-[193px] h-[58px] border border-[#979696] rounded-[16px]`} />
                <div className={`absolute left-[306px] top-[${topOffset}px] w-[58px] h-[58px] border border-[#979696] rounded-[16px]`} />
                <span className={`absolute left-[152px] top-[${topOffset + 21}px] font-Tajawal font-bold text-[20px] leading-[24px] text-[#9E9191]`}>{c.label}</span>
                <span className={`absolute left-[${i === 0 ? 322 : i === 1 ? 318 : i === 2 ? 316 : 316}px] top-[${topOffset + 21}px] font-Tajawal font-bold text-[20px] leading-[24px] text-[#9E9191]`}>{c.percent}%</span>
              </React.Fragment>
            );
          })}

          {/* Burn button */}
          <button
            onClick={startBurn}
            className="absolute left-[70px] top-[480px] w-[265px] h-[76px] bg-gradient-to-r from-[#D81E3D] to-[#D81E5F] shadow-[0px_6px_6px_rgba(0,0,0,0.87)] rounded-[40px] flex items-center justify-center"
          >
            <span className="font-Tajawal font-bold text-[24px] leading-[29px] text-white">
              BURN 0,5 TON
            </span>
          </button>

          {/* Disclaimer */}
          <p className="absolute left-[52px] top-[594px] w-[318px] h-[53px] font-Tajawal font-bold text-[15px] leading-[18px] text-[#9E9191]">
            Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.
          </p>
        </>
      )}

      {/* Pending / success / error states can remain as overlays or separate layouts */}
    </div>
  );
}
