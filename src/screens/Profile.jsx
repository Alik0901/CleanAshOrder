// файл: src/screens/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [player, setPlayer]   = useState(null);
  const [stats, setStats]     = useState(null);
  const [ref, setRef]         = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [playerData, statsData, refData] = await Promise.all([
          API.getPlayer(user.tg_id),
          API.getStats(),
          API.getReferral(),
        ]);
        setPlayer(playerData);
        setStats(statsData);
        setRef(refData);
      } catch (e) {
        console.error('[Profile] fetch error', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.tg_id, logout, navigate]);

  const handleReset = async () => {
    if (!window.confirm('Сбросить прогресс за 2 TON?')) return;
    try {
      await API.deletePlayer(user.tg_id);
      logout();
      navigate('/login');
    } catch (e) {
      console.error('[Profile] reset error', e);
      setError(e.message);
    }
  };

  if (loading) return <p className="text-white p-6">Loading profile...</p>;
  if (error)   return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white pt-20 pb-16 px-4">
      <BackButton className="absolute top-4 left-4 text-white z-10" />
      <div className="relative z-10 mx-auto max-w-xl bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-3xl font-montserrat font-bold text-center">Profile</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 font-inter">
            <h3 className="text-xl font-semibold">Player Info</h3>
            <p><strong>Name:</strong> {player.name}</p>
            <p><strong>TG ID:</strong> {player.tg_id}</p>
          </div>
          <div className="space-y-2 font-inter">
            <h3 className="text-xl font-semibold">Stats</h3>
            <p><strong>Total Burns:</strong> {stats.totalBurnds}</p>
            <p><strong>Total TON:</strong> {Number(stats.totalTon).toFixed(3)}</p>
            <p><strong>Last Burn:</strong> {new Date(player.last_burn).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold font-montserrat">Fragments</h3>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => {
              const id = i + 1;
              const owned = player.fragments.includes(id);
              return (
                <div
                  key={id}
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-inner flex items-center justify-center"
                >
                  {owned ? (
                    <img
                      src={`/fragments/fragment_${id}.jpg?dummy=${Date.now()}`}
                      alt={`Fragment ${id}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-gray-500 text-2xl font-bold">?</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold font-montserrat">Referral</h3>
          <p><strong>Code:</strong> {ref.refCode}</p>
          <p><strong>Invited:</strong> {ref.invitedCount}</p>
          <p><strong>Reward:</strong> {ref.rewardIssued ? 'Claimed' : 'Not claimed'}</p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate('/gallery')}
            className="w-full py-3 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-lg font-inter font-semibold transition"
          >View Gallery</button>
          <button
            onClick={() => navigate('/referral')}
            className="w-full py-3 bg-[#FF6B6B] hover:bg-[#FF4757] rounded-lg font-inter font-semibold transition"
          >Referral Program</button>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-inter font-semibold transition"
          >Reset & Reborn (2 TON)</button>
        </div>
      </div>
    </div>
  );
}
