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
        // Подгружаем все подписанные URL
        const presigned = await API.getSignedFragmentUrls();
        setSignedUrls(presigned.signedUrls || {});
        // Подгружаем owned фрагменты
        const fragData = await API.getFragments(user.tg_id);
        setFragments(fragData.fragments || []);
      } catch (e) {
        console.error('[Gallery] load error', e);
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

  // Автопереход, если все фрагменты получены
  useEffect(() => {
    if (!loading && fragments.length >= 8) {
      navigate('/final');
    }
  }, [loading, fragments, navigate]);

  if (loading) return <p className="text-white p-6">Loading gallery...</p>;
  if (error)   return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/images/bg-path.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <BackButton className="text-white mb-4" />
        <h2 className="text-3xl font-bold font-montserrat mb-6 text-center">Your Fragments</h2>

        {/* Горизонтальная прокручиваемая полоса фрагментов */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {Array.from({ length: 8 }, (_, idx) => {
            const id = idx + 1;
            const owned = fragments.includes(id);
            const filename = FRAGMENT_FILES[id];
            const url = signedUrls[filename];
            return (
              <div
                key={id}
                className="flex-shrink-0 w-24 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-4 transition-transform hover:scale-105"
                style={owned ? { borderColor: '#FF6B6B' } : { borderColor: '#4A4A4A' }}
              >
                {owned && url ? (
                  <img
                    src={`${url}&dummy=${Date.now()}`} // prevent caching
                    alt={`Fragment ${id}`}
                    className="object-cover w-full h-full"
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholder.jpg';
                    }}
                  />
                ) : (
                  <button
                    onClick={() => navigate('/burn')}
                    className="w-full h-full flex items-center justify-center text-3xl text-gray-500 font-bold hover:text-gray-200"
                  >
                    ?
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col space-y-4 mt-8">
          <button
            onClick={() => navigate('/referral')}
            className="w-full py-3 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-lg font-inter font-semibold transition"
          >
            Referral
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full py-3 bg-[#FF6B6B] hover:bg-[#FF4757] rounded-lg font-inter font-semibold transition"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
