// src/screens/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [tgId, setTgId]       = useState('');
  const [name, setName]       = useState('');
  const [refCode, setRefCode] = useState('');   // опционально
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login }             = useContext(AuthContext);
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!tgId.trim()) {
      setError('Telegram ID обязателен');
      return;
    }
    setLoading(true);
    try {
      // initData можно зафиксировать, например, как '' или как tgId
      const body = { tg_id: tgId.trim(), name: name.trim(), initData: tgId.trim(), referrer_code: refCode.trim() || null };
      const { user, token } = await API.init(body);
      login(user, token);
      navigate('/burn');  // сразу на Burn Screen
    } catch (err) {
      console.error('[Login] init error', err);
      setError(err.error || 'Ошибка инициализации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Ash Bot</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Telegram ID</label>
          <input
            type="text"
            value={tgId}
            onChange={e => setTgId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Name (опционально)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Referral Code (опционально)</label>
          <input
            type="text"
            value={refCode}
            onChange={e => setRefCode(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Loading…' : 'Start Playing'}
        </button>
      </form>
    </div>
  );
}
