// src/screens/Leaderboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Leaderboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [leaders, setLeaders] = useState([]); // [{ rank, name, amount }]
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      setError('');
      try {
        // TODO: заменить на реальный вызов API.getStats()
        // const data = await API.getStats();
        // setLeaders(data.top10);
        await new Promise(res => setTimeout(res, 500));
        setLeaders([
          { rank: 1, name: 'Alice',   amount: 12.5 },
          { rank: 2, name: 'Bob',     amount: 11.0 },
          { rank: 3, name: 'Carol',   amount: 9.8 },
          { rank: 4, name: 'Dave',    amount: 8.2 },
          { rank: 5, name: 'Eve',     amount: 7.3 },
          { rank: 6, name: 'Frank',   amount: 6.5 },
          { rank: 7, name: 'Grace',   amount: 5.9 },
          { rank: 8, name: 'Heidi',   amount: 5.0 },
          { rank: 9, name: 'Ivan',    amount: 4.6 },
          { rank: 10, name: 'Judy',   amount: 4.2 },
        ]);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить таблицу лидеров');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/profile-bg.webp')" }}
    >
      {/* Тёмный оверлей */}
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        <div className="mx-auto max-w-lg bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Leaderboard
          </h2>

          {loading && (
            <p className="text-gray-700 text-center">Loading leaderboard…</p>
          )}
          {error && (
            <p className="text-red-600 text-center">{error}</p>
          )}

          {!loading && !error && (
            <ol className="space-y-2">
              {leaders.map(({ rank, name, amount }) => (
                <li
                  key={rank}
                  className={`flex justify-between items-center px-4 py-2 rounded-lg
                    ${user.name === name ? 'bg-yellow-100' : 'bg-gray-100'}
                  `}
                >
                  <span className="font-semibold">
                    #{rank} {name}
                  </span>
                  <span className="text-gray-700">
                    {amount.toFixed(1)} TON
                  </span>
                </li>
              ))}
            </ol>
          )}

          <button
            onClick={() => navigate('/gallery')}
            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    </div>
  );
}
