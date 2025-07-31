// src/screens/Burn.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function Burn() {
  const navigate = useNavigate();

  const [invoiceId, setInvoiceId]       = useState(null);
  const [paymentLink, setPaymentLink]   = useState('');
  const [status, setStatus]             = useState('idle'); // 'idle' | 'pending' | 'confirmed' | 'error'
  const [error, setError]               = useState('');

  // Заглушка для создания инвойса — позже заменим на API.createBurn
  const startBurn = async () => {
    setError('');
    setStatus('pending');

    // TODO: здесь нужно будет вызвать API.createBurn({ amount: 0.5 })
    // и подставить реальный id и ссылку из ответа сервера.
    // Пример: const { id, link } = await API.createBurn({ amount: 0.5 });
    // setInvoiceId(id);
    // setPaymentLink(link);

    // Сейчас — заглушка:
    setInvoiceId('stub-invoice-123');
    setPaymentLink('https://t.me/your_bot?start=stub-invoice-123');
  };

  // Опрос статуса инвойса:
  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;

    const timer = setInterval(() => {
      // TODO: здесь нужно будет вызывать API.getBurnStatus(invoiceId)
      // и проверять { status } === 'confirmed'
      // Если подтверждён — clearInterval(timer) и navigate('/gallery')

      // Пока что — имитация мгновенного подтверждения
      clearInterval(timer);
      setStatus('confirmed');
      navigate('/gallery');
    }, 5000);

    return () => clearInterval(timer);
  }, [status, invoiceId, navigate]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-burn.webp')" }}
    >
      {/* Тёмный полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* Основная карточка */}
      <div className="relative z-10 w-full max-w-md bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-6 text-center">
        {/* Кнопка «назад» */}
        <BackButton />

        <h2 className="text-2xl font-bold text-gray-900">Burn Yourself</h2>

        {status === 'idle' && (
          <button
            onClick={startBurn}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            🔥 Burn for 0.5 TON
          </button>
        )}

        {status === 'pending' && (
          <>
            <p className="text-gray-800">Invoice created:</p>
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 underline mb-4"
            >
              Open TonHub to pay
            </a>
            <p className="text-sm text-gray-700">Waiting for confirmation...</p>
          </>
        )}

        {status === 'confirmed' && (
          <p className="text-green-600 font-semibold">Payment confirmed! Redirecting…</p>
        )}

        {status === 'error' && (
          <p className="text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
