// src/screens/Burn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Burn() {
  const { user }       = useContext(AuthContext);
  const navigate       = useNavigate();
  const [invoiceId, setInvoiceId]     = useState(null);
  const [paymentUrl, setPaymentUrl]   = useState('');
  const [status, setStatus]           = useState('idle'); // idle | pending | confirmed | error
  const [error, setError]             = useState('');

  // 1) Создаём инвойс
  const startBurn = async () => {
    setError('');
    setStatus('pending');
    try {
      const { invoiceId: id, paymentUrl: url } = await API.createBurn(user.tg_id);
      setInvoiceId(id);
      setPaymentUrl(url);
    } catch (e) {
      console.error(e);
      setError(e.message);
      setStatus('error');
    }
  };

  // 2) Ожидаем оплаты
  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;

    const timer = setInterval(async () => {
      try {
        const { paid, newFragment, cursed, curse_expires } = await API.getBurnStatus(invoiceId);

        if (paid) {
          clearInterval(timer);
          // Можно здесь показать анимацию получения фрагмента / проклятия
          navigate('/gallery');
        }
      } catch (e) {
        console.error(e);
        clearInterval(timer);
        setError('Ошибка проверки статуса оплаты');
        setStatus('error');
      }
    }, 3000); // опрашиваем каждые 3 секунды

    return () => clearInterval(timer);
  }, [status, invoiceId, navigate]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-burn.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 space-y-6 text-white">
        <BackButton />

        <h2 className="text-2xl font-bold text-center">Burn Yourself</h2>

        {status === 'idle' && (
          <button
            onClick={startBurn}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            🔥 Burn for 0.5 TON
          </button>
        )}

        {status === 'pending' && (
          <div className="space-y-4 text-center">
            <p>Invoice created. Complete payment:</p>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-400 underline"
            >
              Open TonHub
            </a>
            <p className="text-sm text-gray-300">Waiting for confirmation...</p>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
