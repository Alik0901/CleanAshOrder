// файл: src/screens/Burn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiRefreshCw } from 'react-icons/fi';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

const BASE_AMOUNT_NANO = 500_000_000; // 0.5 TON
const PITY_BOOST_PER = 1;  // +1% за каждый неудачный burn
const PITY_CAP        = 20; // максимум +20%

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus]         = useState('idle'); // idle | pending | success | error
  const [error, setError]           = useState('');
  const [invoiceId, setInvoiceId]   = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');

  const [fragmentId, setFragmentId]   = useState(null);
  const [category, setCategory]       = useState('');
  const [pityCounter, setPityCounter] = useState(0);

  // Загружаем купон
  const [coupon, setCoupon] = useState(0);
  useEffect(() => {
    API.getDailyQuest()
      .then(data => setCoupon(data.coupon || 0))
      .catch(e => {
        if (e.message.toLowerCase().includes('invalid token')) {
          logout(); navigate('/login');
        }
      });
  }, [logout, navigate]);

  // Считаем цену в nano
  const discountedNano = Math.floor(BASE_AMOUNT_NANO * (100 - coupon) / 100);
  const priceTON = (discountedNano / 1e9).toFixed(3);

  // Расчет шансов
  const computeChances = () => {
    const boost = Math.min(pityCounter * PITY_BOOST_PER, PITY_CAP);
    const baseRare = 15;
    const baseLegend = 5;
    const sumRL = baseRare + baseLegend;
    return [
      { key: 'legendary', label: 'Legendary', chance: baseLegend + boost * (baseLegend / sumRL) },
      { key: 'rare',      label: 'Rare',      chance: baseRare + boost * (baseRare / sumRL) },
      { key: 'uncommon',  label: 'Uncommon',  chance: 30 },
      { key: 'common',    label: 'Common',    chance: 50 },
    ];
  };

  const startBurn = async () => {
    setStatus('pending'); setError('');
    try {
      const { invoiceId, paymentUrl } = await API.createBurn(user.tg_id, discountedNano);
      setInvoiceId(invoiceId); setPaymentUrl(paymentUrl);
    } catch (e) {
      setError(e.message || 'Error creating invoice'); setStatus('error');
      if (e.message.toLowerCase().includes('invalid token')) logout(), navigate('/login');
    }
  };

  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        if (res.paid) {
          clearInterval(timer);
          setCategory(res.category);
          setFragmentId(res.newFragment);
          setPityCounter(res.pity_counter);
          setStatus('success');
        }
      } catch (e) {
        clearInterval(timer);
        setError(e.message || 'Error checking payment');
        setStatus('error');
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId, logout, navigate]);

  const chances = computeChances();

  return (
    <div className="relative min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/images/bg-burn.webp')" }}>
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 mx-auto max-w-md p-6 bg-gray-900 bg-opacity-80 backdrop-blur-lg rounded-2xl space-y-6">
        <BackButton className="text-white" />
        <h2 className="text-3xl font-bold text-center font-montserrat">Burn Yourself</h2>

        {status === 'idle' && (
          <>
            {coupon > 0 && (
              <p className="text-center text-green-400">Coupon: {coupon}% off → {priceTON} TON</p>
            )}
            <ul className="space-y-2 font-inter">
              {chances.map(c => (
                <li key={c.key} className="flex justify-between">
                  <span>{c.label}</span>
                  <span>{c.chance.toFixed(1)}%</span>
                </li>
              ))}
              {pityCounter > 0 && (
                <li className="text-xs text-gray-400">Pity +{Math.min(pityCounter, PITY_CAP)}%</li>
              )}
            </ul>
            <button
              onClick={startBurn}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF4757] rounded-xl shadow-lg hover:opacity-90 transition"
            >
              <FiZap size={24} />
              <span className="font-semibold">Burn {priceTON} TON</span>
            </button>
          </>
        )}

        {status === 'pending' && (
          <div className="text-center space-y-3 font-inter">
            <p>Invoice created:</p>
            <a href={paymentUrl} target="_blank" rel="noreferrer" className="underline">Pay Now</a>
            <p className="text-gray-400">Waiting for confirmation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4 font-inter">
            <p>You received <span className="font-bold text-[#FF6B6B]">{category}</span> fragment!</p>
            <p className="text-4xl font-montserrat">#{fragmentId}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setStatus('idle')}
                className="flex items-center gap-1 py-2 px-4 bg-[#4ECDC4] rounded-lg hover:opacity-90 transition"
              >
                <FiRefreshCw />
                <span>Again</span>
              </button>
              <button
                onClick={() => navigate('/gallery')}
                className="py-2 px-4 text-white underline"
              >
                Gallery
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-center font-inter">{error}</p>
        )}
      </div>
    </div>
  );
}
