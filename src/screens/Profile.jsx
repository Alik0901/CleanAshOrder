// src/screens/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats]         = useState({ totalBurns: 0, referrals: 0 });
  const [fragments, setFragments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        // TODO: заменить на реальные вызовы API.getStats и API.getFragments
        await new Promise(res => setTimeout(res, 500));
        setStats({ totalBurns: 5, referrals: 2 });
        setFragments([1,2,3,4,5,6,7,8]); // все фрагменты для примера
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Если все фрагменты собраны, отображаем финальную NFT
  const allCollected = fragments.length >= 8;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/profile-bg.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        <div className="mx-auto max-w-lg bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Profile</h2>

          {loading && <p className="text-gray-700 text-center">Loading profile...</p>}
          {error   && <p className="text-red-600 text-center">{error}</p>}

          {!loading && !error && (
            <>
              <div className="space-y-2">
                <p><span className="font-semibold">Telegram ID:</span> {user.tg_id}</p>
                <p><span className="font-semibold">Name:</span> {user.name}</p>
                <p><span className="font-semibold">Total Burns:</span> {stats.totalBurns}</p>
                <p><span className="font-semibold">Referrals:</span> {stats.referrals}</p>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Your Fragments</h3>
                {allCollected ? (
                  <img
                    src="/images/final-nft-placeholder.webp"
                    alt="Final NFT"
                    className="w-full rounded-lg shadow-md"
                  />
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, idx) => {
                      const i = idx + 1;
                      const got = fragments.includes(i);
                      return (
                        <div
                          key={i}
                          className={`w-16 h-16 flex items-center justify-center rounded border ${
                            got ? 'border-red-600' : 'border-gray-400'
                          } bg-gray-100`}
                        >
                          {got ? (
                            <img
                              src={`/images/fragments/fragment-${i}.webp`}
                              alt={`Fragment ${i}`}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-400">?</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={logout}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Logout
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
