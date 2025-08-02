// файл: src/screens/Leaderboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Leaderboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      setError('');
      try {
        const data = await API.getLeaderboard();
        setLeaders(data.leaders || []);
      } catch (e) {
        console.error('[Leaderboard] load error', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError('Ошибка загрузки лидеров');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, [logout, navigate]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <BackButton className="text-white" />
        <h2 className="text-3xl font-bold font-montserrat text-center">Leaderboard</h2>

        {loading && <p className="text-center font-inter">Loading...</p>}
        {error && <p className="text-center text-red-400 font-inter">{error}</p>}

        {!loading && !error && (
          <ol className="space-y-4">
            {leaders.map((l, idx) => (
              <li
                key={l.tg_id}
                className={`flex items-center justify-between p-4 bg-gray-800 bg-opacity-90 rounded-lg shadow-md transition ${
                  l.tg_id === user.tg_id ? 'border-2 border-[#4ECDC4]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-xl font-montserrat">{idx + 1}.</span>
                  <img
                    src={`https://t.me/i/userpic/320/${l.tg_id}.jpg`} 
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/avatar-placeholder.png'; }}
                  />
                  <span className="font-inter font-medium">{l.name}</span>
                </div>
                <span className="font-inter">{l.totalTon.toFixed(3)} TON</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
