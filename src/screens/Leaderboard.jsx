// src/screens/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { getLeaderboard } from '../utils/apiClient';

export default function Leaderboard() {
  const [scope, setScope] = useState<'friends' | 'global'>('friends');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBoard(scope);
  }, [scope]);

  async function loadBoard(scope) {
    setLoading(true);
    try {
      const list = await getLeaderboard(scope);
      setData(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <BackButton />
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>

      {/* Таб переключения scope */}
      <div className="flex space-x-4 mb-4">
        {['friends', 'global'].map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 rounded ${
              scope === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {s === 'friends' ? 'Friends' : 'Global'}
          </button>
        ))}
      </div>

      {/* Список лидеров */}
      {loading ? (
        <p>Loading…</p>
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
              <span className="font-mono">{user.fragmentsCount} / 8</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
