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
        setFragments([1,2,3]); // заглушка
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
      <div className="absolute inset-0 bg-black opacity-30" />

      <div className="relative z-10 mx-auto my-12 w-full max-w-lg bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <h2 className="text-2xl font-bold text-gray-900">Your Fragments</h2>
          {/* Пустой элемент для баланса */}
          <div style={{ width: 32 }} />
        </div>

        {/* Content */}
        {loading && <p className="text-gray-700">Loading fragments...</p>}
        {error   && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }, (_, idx) => {
              const i = idx + 1;
              const got = fragments.includes(i);
              return (
                <div
                  key={i}
                  className="w-24 h-24 flex items-center justify-center rounded-lg border-2
                             bg-gray-100 overflow-hidden
                             transition-colors"
                  style={{
                    borderColor: got ? '#dc2626' : '#9ca3af' /* red-600 or gray-400 */
                  }}
                >
                  {got ? (
                    <img
                      src={`/images/fragments/fragment-${i}.webp`}
                      alt={`Fragment ${i}`}
                      className="object-cover w-full h-full"
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/fragments/placeholder.webp';
                      }}
                    />
                  ) : (
                    <span className="text-gray-500 text-2xl font-bold">?</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/referral')}
            className="flex-1 py-2 mr-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Referral
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 py-2 ml-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
