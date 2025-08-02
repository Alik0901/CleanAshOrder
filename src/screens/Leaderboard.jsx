// файл: src/screens/Leaderboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Leaderboard() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    API.getLeaderboard()
      .then(data => {
        // API may return { leaders: [...] } or an array
        setLeaders(data.leaders || data);
      })
      .catch(e => {
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, [logout, navigate]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white pt-20 pb-16">
      <BackButton className="absolute top-4 left-4 text-white z-10" />
      <div className="max-w-lg mx-auto bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-3xl font-montserrat font-bold text-center">Leaderboard</h2>

        {loading && <p className="text-center font-inter">Loading...</p>}
        {error && <p className="text-center text-red-400 font-inter">{error}</p>}

        {!loading && !error && (
          <ol className="space-y-4">
            {leaders.map((u, idx) => (
              <li
                key={u.tg_id}
                className={`flex justify-between items-center p-4 bg-gray-800 rounded-lg transition ${
                  u.tg_id === user.tg_id ? 'border-2 border-[#4ECDC4]' : ''
                }`}>
                <div className="flex items-center space-x-3">
                  <span className="font-montserrat font-bold">{idx + 1}.</span>
                  <span className="font-inter">{u.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-inter">{Number(u.totalTon).toFixed(3)} TON</p>
                  <p className="text-sm text-gray-400 font-inter">{u.totalBurns} burns</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
