// src/screens/Gallery.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

const FRAGMENT_FILES = {
  1: 'fragment_1_the_whisper.jpg',
  2: 'fragment_2_the_number.jpg',
  3: 'fragment_3_the_language.jpg',
  4: 'fragment_4_the_mirror.jpg',
  5: 'fragment_5_the_chain.jpg',
  6: 'fragment_6_the_hour.jpg',
  7: 'fragment_7_the_mark.jpg',
  8: 'fragment_8_the_gate.jpg',
};

export default function Gallery() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fragments, setFragments] = useState([]);   // собранные фрагменты
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function fetchFragments() {
      setLoading(true);
      setError('');
      try {
        const { fragments: fetched } = await API.getFragments(user.tg_id);
        setFragments(fetched || []);
      } catch (e) {
        console.error('[Gallery] getFragments error', e);
        setError(e.message || 'Не удалось загрузить фрагменты');
      } finally {
        setLoading(false);
      }
    }
    fetchFragments();
  }, [user]);

  // Авто-переход на финальный экран, когда все 8 фрагментов
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
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <BackButton />

        <div className="mx-auto max-w-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 space-y-6 text-white">
          <h2 className="text-2xl font-bold text-center">Your Fragments</h2>

          {loading && <p className="text-gray-300 text-center">Loading fragments…</p>}
          {error   && <p className="text-red-400 text-center">{error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, idx) => {
                const id = idx + 1;
                const owned = fragments.includes(id);
                return (
                  <div
                    key={id}
                    className={`w-20 h-20 flex items-center justify-center rounded-lg border-2 ${
                      owned ? 'border-red-500' : 'border-gray-600'
                    } bg-gray-700`}
                  >
                    {owned ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/fragments/${FRAGMENT_FILES[id]}`}
                        alt={`Fragment ${id}`}
                        className="object-cover w-full h-full rounded"
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/fragments/placeholder.jpg';
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

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/referral')}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Referral
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
