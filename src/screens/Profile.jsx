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
          API.getUserStats(user.tg_id),
          API.getReferral()
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
    if (!window.confirm('Сбросить прогресс и начать заново за 2 TON?')) return;
    try {
      await API.deletePlayer(user.tg_id);
      logout();
      navigate('/login');
    } catch (e) {
      console.error('[Profile] reset error', e);
      setError(e.message);
    }
  };

  if (loading) {
    return <p className="text-white p-6">Loading profile...</p>;
  }
  if (error) {
    return <p className="text-red-500 p-6">{error}</p>;
  }

  return (
    <div className="relative min-h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/images/bg-profile.webp')" }}>
      <div className="absolute inset-0 bg-black opacity-70" />
      <div className="relative z-10 mx-auto max-w-xl p-6 bg-gray-900 bg-opacity-90 rounded-xl space-y-6">
        <BackButton className="text-white" />
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Player Info</h2>
            <p><strong>Name:</strong> {player.name}</p>
            <p><strong>TG ID:</strong> {player.tg_id}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Stats</h2>
            <p><strong>Total Burns:</strong> {stats.totalBurns}</p>
            <p><strong>Total TON:</strong> {stats.totalTon}</p>
            <p><strong>Last Burn:</strong> {new Date(player.last_burn).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Fragments</h2>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(id => (
              <div key={id} className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
                {player.fragments.includes(id)
                  ? <img src={`/fragments/fragment_${id}.jpg?dummy=${Date.now()}`} alt={`Fragment ${id}`} className="object-cover w-full h-full rounded" />
                  : <span className="text-gray-500">?</span>
                }
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Referral</h2>
          <p><strong>Code:</strong> {ref.refCode}</p>
          <p><strong>Invited:</strong> {ref.invitedCount}</p>
          <p><strong>Reward Claimed:</strong> {ref.rewardIssued ? 'Yes' : 'No'}</p>
        </div>

        <button
          onClick={handleReset}
          className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold mt-4"
        >
          Reset & Reborn (2 TON)
        </button>
      </div>
    </div>
  );
}
