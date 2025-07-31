// src/screens/Gallery.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Gallery() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fragments, setFragments] = useState([]); // собранные фрагменты
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function fetchFragments() {
      setLoading(true);
      setError('');
      try {
        // TODO: заменить на API.getFragments(user.tg_id)
        await new Promise(res => setTimeout(res, 500));
        setFragments([1, 2, 3]); // заглушка
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить фрагменты');
      } finally {
        setLoading(false);
      }
    }
    fetchFragments();
  }, [user]);

  useEffect(() => {
    if (!loading && fragments.length >= 8) {
      navigate('/final');
    }
  }, [loading, fragments, navigate]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-path.webp')" }}
    >
      {/* более лёгкий оверлей */}
      <div className="absolute inset-0 bg-black opacity-30" />

      <div className="relative z-10 mx-auto my-12 w-full max-w-lg bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-xl p-6 space-y-6">
        {/* Шапка с Back */}
        <div className="flex items-center justify-between">
          <BackButton />
          <h2 className="text-2xl font-bold text-gray-900">Your Fragments</h2>
          {/* пустой блок для выравнивания заголовка */}
          <div style={{ width: 32 }} />
        </div>

        {loading && <p className="text-gray-700">Loading fragments...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* Сетка 4×2 */}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, idx) => {
              const i = idx + 1;
              const collected = fragments.includes(i);
              return (
                <div
                  key={i}
                  className={`relative w-full pb-full rounded-lg overflow-hidden border-2 ${
                    collected ? 'border-red-600' : 'border-gray-400'
                  }`}
                >
                  {collected ? (
                    <img
                      src={`/images/fragments/fragment-${i}.webp`}
                      alt={`Fragment ${i}`}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/fragments/placeholder.webp'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                      ?
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Нижние кнопки */}
        <div className="flex justify-around mt-4">
          <button
            onClick={() => navigate('/referral')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Referral
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
