// файл: src/screens/Login.jsx
import React, { useState, useEffect, useContext } from 'react';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [tgId, setTgId]         = useState(null);
  const [name, setName]         = useState('');
  const [refCode, setRefCode]   = useState('');
  const [initData, setInitData] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setError('Откройте приложение внутри Telegram.');
      setLoading(false);
      return;
    }
    tg.ready();
    const unsafe = tg.initDataUnsafe || {};
    const user   = unsafe.user || {};
    if (!user.id) {
      setError('Не удалось получить ID Telegram.');
      setLoading(false);
      return;
    }
    setTgId(user.id);
    setName(user.first_name || '');
    setInitData(tg.initData || '');
    setLoading(false);
  }, []);

  const handleStart = async () => {
    if (!tgId || !initData) {
      setError('Нет данных от Telegram. Повторите вход через Web App.');
      return;
    }
    setError('');
    try {
      const { user: userObj, token } = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null
      });
      console.log('[Login] init response:', { userObj, token });
      login(userObj, token);
      console.log('→ token saved to localStorage:', localStorage.getItem('token'));
      navigate('/burn');
    } catch (e) {
      console.error('[Login] init error', e);
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading Telegram Web App…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-welcome.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-70" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 bg-opacity-90 rounded-xl p-8 space-y-6 text-white">
        <h1 className="text-2xl font-bold text-center">Welcome to Order of Ash</h1>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded text-white"
            />
          </div>
          <div>
            <label className="block mb-1">Referral Code (optional)</label>
            <input
              type="text"
              value={refCode}
              onChange={e => setRefCode(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 rounded text-white"
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!tgId || !initData}
          className={`w-full py-3 rounded-lg font-semibold ${
            tgId && initData
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-600 cursor-not-allowed'
          } text-white`}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
