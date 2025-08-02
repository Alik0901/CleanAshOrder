// файл: src/screens/Burn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

// Конфигурация категорий и базовых шансов
const CATEGORIES = [
  { key: 'legendary', label: 'Legendary', baseChance: 5 },
  { key: 'rare',      label: 'Rare',      baseChance: 15 },
  { key: 'uncommon',  label: 'Uncommon',  baseChance: 30 },
  { key: 'common',    label: 'Common',    baseChance: 50 },
];
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

  const computeChances = () => {
    const boost = Math.min(pityCounter * PITY_BOOST_PER, PITY_CAP);
    const baseR = CATEGORIES.find(c => c.key === 'rare').baseChance;
    const baseL = CATEGORIES.find(c => c.key === 'legendary').baseChance;
    const sumRL = baseR + baseL;
    return CATEGORIES.map(c => {
      let chance = c.baseChance;
      if (c.key === 'rare' || c.key === 'legendary') {
        chance += boost * (c.baseChance / sumRL);
      }
      return { ...c, chance };
    });
  };

  const startBurn = async () => {
    setError('');
    setStatus('pending');
    try {
      const resp = await API.createBurn(user.tg_id);
      setInvoiceId(resp.invoiceId);
      setPaymentUrl(resp.paymentUrl);
    } catch (e) {
      setError(e.message || 'Ошибка создания инвойса');
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
        const resp = await API.getBurnStatus(invoiceId);
        if (resp.paid) {
          clearInterval(timer);
          setCategory(resp.category);
          setFragmentId(resp.newFragment);
          setPityCounter(resp.pity_counter);
          setStatus('success');
        }
      } catch (e) {
        clearInterval(timer);
        setError(e.message || 'Ошибка проверки оплаты');
        setStatus('error');
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId, logout, navigate]);

  const chances = computeChances();

  return (
    <div className="relative min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/images/bg-burn.webp')" }}>
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 mx-auto max-w-md p-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-xl space-y-6">
        <BackButton className="text-white" />
        <h2 className="text-2xl font-bold text-center text-white">Burn Yourself</h2>

        {status === 'idle' && (
          <>
            <div className="space-y-2">
              {chances.map(c => (
                <div key={c.key} className="flex justify-between text-sm text-white">
                  <span>{c.label}</span>
                  <span>{c.chance.toFixed(1)}%</span>
                </div>
              ))}
              {pityCounter > 0 && (
                <p className="text-xs text-gray-300 text-white">
                  Вы получили {pityCounter} попыток без Rare/Legendary — +{Math.min(pityCounter, PITY_CAP)}% к шансам.
                </p>
              )}
            </div>
            <button
              onClick={startBurn}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white"
            >
              🔥 Burn for 0.5 TON
            </button>
          </>
        )}

        {status === 'pending' && (
          <div className="space-y-4 text-center">
            <p className="text-white">Счёт создан. Оплатите по ссылке:</p>
            <a href={paymentUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">
              {paymentUrl}
            </a>
            <p className="text-gray-300 text-sm text-white">Ожидаем подтверждения...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center">
            <p className="text-lg text-white">Вы получили <span className="font-bold text-white">{category}</span> фрагмент</p>
            <p className="text-2xl text-white">#{fragmentId}</p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setStatus('idle')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                Burn again
              </button>
              <button
                onClick={() => navigate('/gallery')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                View Gallery
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-center text-white">{error}</p>
        )}
      </div>
    </div>
  );
}
