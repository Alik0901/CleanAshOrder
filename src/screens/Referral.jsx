// файл: src/screens/Referral.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Referral() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [refCode, setRefCode] = useState('');
  const [invited, setInvited] = useState([]); // [{ name, date }]
  const [bonusCount, setBonusCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchReferral() {
      setLoading(true);
      setError('');
      try {
        const data = await API.getReferral();
        setRefCode(data.refCode);
        setInvited([]); // API does not return list details by default
        setBonusCount(data.invitedCount);
      } catch (e) {
        console.error('[Referral] load error', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError('Не удалось загрузить реферальные данные');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, [user, logout, navigate]);

  const shareUrl = `${window.location.origin}/?ref=${refCode}`;

  const handleClaim = async () => {
    setClaiming(true);
    setMessage('');
    try {
      await API.claimReferral();
      setBonusCount(prev => prev + 1);
      setMessage('Бонус успешно получен!');
    } catch (e) {
      console.error('[Referral] claim error', e);
      setMessage('Ошибка при получении бонуса');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white">
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 max-w-md mx-auto px-4 py-8">
        <BackButton className="text-white mb-4" />
        <h2 className="text-3xl font-bold font-montserrat text-center mb-6">Referral Program</h2>

        {loading && <p className="text-gray-300 text-center">Loading...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}

        {!loading && !error && (
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 space-y-6">
            {/* Code & Link */}
            <div className="space-y-2">
              <span className="font-inter text-sm text-gray-400">Your code:</span>
              <div className="flex">
                <input
                  type="text"
                  value={refCode}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-l-md text-white font-inter"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(refCode); setMessage('Код скопирован'); }}
                  className="px-4 py-2 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-r-md font-inter"
                >Copy</button>
              </div>
              <span className="font-inter text-sm text-gray-400">Your link:</span>
              <div className="flex">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-l-md text-white text-sm font-inter"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); setMessage('Ссылка скопирована'); }}
                  className="px-4 py-2 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-r-md font-inter"
                >Copy</button>
              </div>
            </div>

            {/* Invited List */}
            <div>
              <h3 className="font-inter font-semibold text-gray-200">Invited Friends:</h3>
              {invited.length === 0 ? (
                <p className="text-gray-400">No friends invited yet.</p>
              ) : (
                <ul className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {invited.map((f, idx) => (
                    <li key={idx} className="flex justify-between bg-gray-700 px-3 py-1 rounded font-inter">
                      <span>{f.name}</span>
                      <span className="text-sm text-gray-400">{f.date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bonus & Claim */}
            <div className="space-y-2">
              <p className="font-inter">Bonus Burns Available: <span className="font-semibold">{bonusCount}</span></p>
              <button
                onClick={handleClaim}
                disabled={claiming || bonusCount === 0}
                className={`w-full py-2 rounded-lg font-inter font-semibold transition ${
                  bonusCount > 0 ? 'bg-[#FF6B6B] hover:bg-[#FF4757]' : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {claiming ? 'Claiming…' : 'Claim Bonus'}
              </button>
              {message && <p className="text-sm text-center text-yellow-300">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
