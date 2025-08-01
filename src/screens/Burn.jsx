// src/screens/Burn.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate }               from 'react-router-dom';
import BackButton                    from '../components/BackButton';
import { AuthContext }               from '../context/AuthContext';
import API                           from '../utils/apiClient';

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate         = useNavigate();

  const [invoiceId, setInvoiceId]   = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [status, setStatus]         = useState('idle'); // idle | pending | confirmed | error
  const [error, setError]           = useState('');
  const [logs, setLogs]             = useState([]);

  const addLog = msg => setLogs(l => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const startBurn = async () => {
    addLog('🕑 startBurn()');
    addLog(`User: ${user.tg_id}, token: ${localStorage.getItem('token')?.slice(0,10)}…`);
    setError('');
    setStatus('pending');

    try {
      addLog('→ POST /api/burn-invoice');
      const resp = await API.createBurn(user.tg_id);
      addLog(`← createBurn resp: ${JSON.stringify(resp)}`);

      setInvoiceId(resp.invoiceId);
      setPaymentUrl(resp.paymentUrl);
    } catch (e) {
      console.error('[Burn] createBurn error', e);
      const msg = e.message || 'Ошибка создания инвойса';
      setError(msg);
      addLog(`❌ createBurn error: ${msg}`);
      if (msg.toLowerCase().includes('invalid token')) {
        addLog('🚪 Invalid token — logging out');
        logout();
        navigate('/login');
      }
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;

    addLog('🕵️ Polling burn status…');
    const timer = setInterval(async () => {
      try {
        addLog(`→ GET /api/burn-status/${invoiceId}`);
        const resp = await API.getBurnStatus(invoiceId);
        addLog(`← burnStatus resp: ${JSON.stringify(resp)}`);

        if (resp.paid) {
          addLog('✅ Paid! redirect to /gallery');
          clearInterval(timer);
          navigate('/gallery');
        }
      } catch (e) {
        console.error('[Burn] getBurnStatus error', e);
        const msg = e.message || 'Ошибка проверки оплаты';
        setError(msg);
        addLog(`❌ burnStatus error: ${msg}`);
        if (msg.toLowerCase().includes('invalid token')) {
          addLog('🚪 Invalid token — logging out');
          logout();
          navigate('/login');
        }
        clearInterval(timer);
        setStatus('error');
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [status, invoiceId]);

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-burn.webp')" }}>
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 mx-auto max-w-md p-6 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-xl space-y-6 text-white">
        <BackButton />

        {/* Лог-контейнер */}
        <div className="h-32 overflow-y-auto bg-gray-800 text-xs p-2 rounded">
          {logs.map((l,i) => <div key={i}>{l}</div>)}
        </div>

        <h2 className="text-2xl font-bold text-center">Burn Yourself</h2>

        {status === 'idle' && (
          <button
            onClick={startBurn}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
          >
            🔥 Burn for 0.5 TON
          </button>
        )}

        {status === 'pending' && (
          <div className="space-y-4 text-center">
            <p>Invoice created. Open payment link:</p>
            <a href={paymentUrl} target="_blank" rel="noreferrer"
               className="text-blue-400 underline">
              {paymentUrl}
            </a>
            <p className="text-gray-300 text-sm">Waiting for confirmation...</p>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
