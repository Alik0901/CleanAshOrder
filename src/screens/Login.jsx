// src/screens/Login.jsx
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
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setError('Запустите бота внутри Telegram.');
      setLoading(false);
      return;
    }
    tg.ready();

    const unsafe = tg.initDataUnsafe ?? {};
    const user   = unsafe.user ?? {};

    if (!user.id) {
      setError('Не удалось получить информацию о пользователе.');
      setLoading(false);
      return;
    }

    setTgId(user.id);
    setName(user.first_name || '');
    setInitData(tg.initData || '');
    setLoading(false);
  }, []);

  const handleStart = async () => {
    setError('');

    if (!tgId || !initData) {
      setError('Не удалось получить данные от Telegram. Повторно откройте Web App.');
      return;
    }

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
      console.error('[Login] init error', e);
      setError(e.error || e.message || 'Ошибка инициализации');
    }
  };

  // Пока ждём Telegram — показываем простой лоадер или сообщение
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading Telegram Web App...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Order of Ash</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name (you can edit):</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Referral Code (optional):</label>
          <input
            type="text"
            value={refCode}
            onChange={e => setRefCode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!tgId || !initData}
          className={`w-full px-4 py-2 rounded 
            ${(!tgId || !initData)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
