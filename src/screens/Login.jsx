// src/screens/Login.jsx
import React, { useState, useEffect, useContext } from 'react';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import bgImage from '../assets/images/bg-welcome.webp';
import logo    from '../assets/images/logo.png';

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
      setError('Нет данных от Telegram, повторите вход через Web App.');
      return;
    }
    setError('');
    try {
      const { user, token } = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null,
      });
      login(user, token);
      navigate('/burn');
    } catch (e) {
      setError(e.error || e.message || 'Ошибка регистрации');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black opacity-70" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 bg-opacity-90 rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center">
          <img src={logo} alt="Order of Ash" className="h-16" />
        </div>

        <h1 className="text-2xl font-extrabold text-center text-white">
          Welcome to Order of Ash
        </h1>

        {error && (
          <p className="text-center text-red-400 text-sm">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">
                  Referral Code (optional)
                </label>
                <input
                  type="text"
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="ABC123"
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!tgId || !initData}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                tgId && initData
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
            >
              Start Playing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
