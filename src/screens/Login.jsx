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

  // Добавить строку в лог
  const addLog = (msg) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog('Инициализация Login.jsx...');
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      addLog('❌ Telegram WebApp SDK не найден');
      setError('Запустите бота внутри Telegram.');
      setLoading(false);
      return;
    }
    addLog('✅ Telegram WebApp SDK найден');
    tg.ready();
    addLog('tg.ready() вызван');

    const unsafe = tg.initDataUnsafe ?? {};
    addLog(`initDataUnsafe: ${JSON.stringify(unsafe)}`);

    const user = unsafe.user ?? {};
    if (!user.id) {
      addLog('❌ user.id отсутствует');
      setError('Не удалось получить идентификатор пользователя.');
      setLoading(false);
      return;
    }
    addLog(`user.id = ${user.id}`);
    addLog(`user.first_name = ${user.first_name ?? '<пусто>'}`);

    setTgId(user.id);
    setName(user.first_name || '');

    const data = tg.initData || '';
    addLog(`initData (signed) length = ${data.length}`);
    setInitData(data);

    setLoading(false);
    addLog('Загрузка завершена, показываем форму');
  }, []);

  const handleStart = async () => {
    addLog('Нажата кнопка "Start Playing"');
    setError('');

    if (!tgId || !initData) {
      addLog('❌ Недостаточно данных для инициализации');
      setError('Нет данных от Telegram. Повторите вход через Web App.');
      return;
    }

    addLog(`Отправляем API.init: tg_id=${tgId}, name="${name}", refCode="${refCode}"`);
    try {
      const { user, token } = await API.init({
        tg_id: tgId,
        name: name.trim(),
        initData,
        referrer_code: refCode.trim() || null,
      });
      addLog('✅ API.init вернул успешный ответ');
      addLog(`Получен user.tg_id=${user.tg_id}, token length=${token.length}`);
      login(user, token);
      addLog('Пользователь залогинен, переходим на /burn');
      navigate('/burn');
    } catch (e) {
      console.error('[Login] init error', e);
      addLog(`❌ Ошибка API.init: ${e.error || e.message}`);
      setError(e.error || e.message || 'Ошибка инициализации');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-4 bg-gray-900 text-white">
        <div className="text-center">
          <p className="mb-2">Loading Telegram Web App...</p>
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-900 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Welcome to Order of Ash</h1>

      {/* Логирование */}
      <div className="w-full max-w-md h-40 mb-4 p-2 bg-gray-800 text-xs overflow-y-auto rounded">
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      {error && (
        <div className="w-full max-w-md mb-4 p-3 bg-red-600 text-white rounded">
          {error}
        </div>
      )}

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="block text-sm mb-1">Name (you can edit):</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Referral Code (optional):</label>
          <input
            type="text"
            value={refCode}
            onChange={e => setRefCode(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded text-white"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!tgId || !initData}
          className={`w-full py-2 rounded text-white font-medium transition ${
            tgId && initData
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
