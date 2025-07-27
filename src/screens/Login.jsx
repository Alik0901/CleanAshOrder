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
  const [logs, setLogs]         = useState([]);
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  // Утилита для добавления лога
  const addLog = (msg) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog('Инициализация Login.jsx');
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      addLog('❌ window.Telegram.WebApp не найден');
      setError('Запустите бота внутри Telegram.');
      setLoading(false);
      return;
    }
    addLog('✅ Telegram WebApp SDK найден');
    tg.ready();
    addLog('Вызван tg.ready()');

    const unsafe = tg.initDataUnsafe ?? {};
    addLog(`initDataUnsafe получен: ${JSON.stringify(unsafe)}`);

    const user = unsafe.user ?? {};
    if (!user.id) {
      addLog('❌ user.id отсутствует в initDataUnsafe');
      setError('Не удалось получить информацию о пользователе.');
      setLoading(false);
      return;
    }
    addLog(`user.id = ${user.id}`);
    addLog(`user.first_name = ${user.first_name}`);

    setTgId(user.id);
    setName(user.first_name || '');
    
    const data = tg.initData || '';
    addLog(`initData (signed) = ${data.substring(0, 50)}…`);
    setInitData(data);

    setLoading(false);
    addLog('Загрузка завершена, показываем форму');
  }, []);

  const handleStart = async () => {
    addLog('Нажата кнопка Start Playing');
    setError('');

    if (!tgId || !initData) {
      addLog('❌ tgId или initData отсутствуют');
      setError('Не удалось получить данные от Telegram. Повторно откройте Web App.');
      return;
    }
    addLog(`Отправка на API.init: tg_id=${tgId}, name=${name}, refCode=${refCode}`);

    try {
      const { user, token } = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null,
      });
      addLog('✅ Успешный ответ от API.init');
      addLog(`Получен user.tg_id=${user.tg_id}, token.length=${token.length}`);
      login(user, token);
      addLog('Вызван login() и навигация на /burn');
      navigate('/burn');
    } catch (e) {
      console.error('[Login] init error', e);
      addLog(`❌ Ошибка API.init: ${e.error || e.message}`);
      setError(e.error || e.message || 'Ошибка инициализации');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="mb-4">Loading Telegram Web App...</p>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Order of Ash</h1>

      {/* Логи */}
      <div className="mb-4 p-2 bg-gray-800 text-gray-200 text-xs h-32 overflow-y-auto rounded">
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

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
