// файл: src/screens/Gallery.jsx
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
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [signedUrls, setSignedUrls] = useState({});
  const [fragments, setFragments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        // 1) Получаем подписанные URL фрагментов
        const presigned = await API.getSignedFragmentUrls();
        setSignedUrls(presigned.signedUrls || {});

        // 2) Получаем, какие фрагменты у игрока
        const fragData = await API.getFragments(user.tg_id);
        setFragments(fragData.fragments || []);
      } catch (e) {
        console.error('[Gallery] error loading fragments', e);
        if (e.message.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        } else {
          setError(e.message || 'Ошибка загрузки фрагментов');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user.tg_id, logout, navigate]);

  // Авто-переход на финальный экран, когда все 8 фрагментов у пользователя
  useEffect(() => {
    if (!loading && fragments.length >= 8) {
      navigate('/final');
    }
  }, [loading, fragments, navigate]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/images/bg-path.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <BackButton className="text-white mb-4" />

        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center font-montserrat">Your Fragments</h2>

          {loading && (
            <p className="text-gray-300 text-center">Loading fragments…</p>
          )}
          {error && (
            <p className="text-red-400 text-center">{error}</p>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, idx) => {
                const id = idx + 1;
                const owned = fragments.includes(id);
                const filename = FRAGMENT_FILES[id];
                const url = signedUrls[filename];

                return (
                  <div
                    key={id}
                    className={`relative w-full pb-full rounded-lg overflow-hidden shadow-lg transition-transform ${
                      owned ? 'border-2 border-[#FF6B6B]' : 'border-2 border-gray-600'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                      {owned && url ? (
                        <img
                          src={`${url}&dummy=${Date.now()}`}  // предотвращаем кеш
                          alt={`Fragment ${id}`}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-3xl font-bold">?</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 pt-6">
            <button
              onClick={() => navigate('/referral')}
              className="flex-1 py-3 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-lg font-inter font-semibold transition"
            >
              Referral
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex-1 py-3 bg-[#FF6B6B] hover:bg-[#FF4757] rounded-lg font-inter font-semibold transition"
            >
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
