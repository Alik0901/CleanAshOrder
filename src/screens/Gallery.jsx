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
      {/* Тёмный оверлей */}
      <div className="absolute inset-0 bg-black opacity-60" />

      {/* Контейнер */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        {/* Тёмная панель */}
        <div className="mx-auto max-w-lg bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl p-6 space-y-6">
          {/* Заголовок */}
          <h2 className="text-white text-3xl font-bold text-center drop-shadow">
            Your Fragments
          </h2>

          {/* Статусы */}
          {loading && <p className="text-gray-300 text-center">Loading fragments…</p>}
          {error   && <p className="text-red-400 text-center">{error}</p>}

          {/* Сетка 4×2 */}
          {!loading && !error && (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, idx) => {
                const i = idx + 1;
                const got = fragments.includes(i);
                return (
                  <div
                    key={i}
                    className={`w-20 h-20 flex items-center justify-center rounded-lg border-2 ${
                      got ? 'border-red-500' : 'border-gray-600'
                    } bg-gray-700`}
                  >
                    {got ? (
                      <img
                        src={`/images/fragments/fragment-${i}.webp`}
                        alt={`Fragment ${i}`}
                        className="object-cover w-full h-full rounded"
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/fragments/placeholder.webp';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-2xl font-bold">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/referral')}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Referral
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
