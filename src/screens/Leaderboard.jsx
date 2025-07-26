// src/screens/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { getLeaderboard } from '../utils/apiClient';

export default function Leaderboard() {
  const [scope, setScope] = useState('global');      // сразу подгружаем глобальный топ
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard(scope);
  }, [scope]);

  async function fetchLeaderboard(scope) {
    setLoading(true);
    setError(null);
    try {
      const list = await getLeaderboard(scope);
      // Гарантируем, что data всегда массив
      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('[/screens/Leaderboard] fetch error', err);
      setError('Failed to load leaderboard');
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: 'friends', label: 'Friends' },
    { key: 'global',  label: 'Global' },
  ];

  return (
    <div className="p-4">
      <BackButton />
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>

      {/* Scope tabs */}
      <div className="flex space-x-4 mb-4">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            className={`px-4 py-2 rounded ${
              scope === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((user, idx) => (
            <li
              key={user.tg_id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <div className="flex items-center space-x-2">
                <span className="font-bold">{idx + 1}.</span>
                <span>{user.name}</span>
              </div>
              <span className="font-mono">
                {user.fragmentsCount} / 8
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
