// src/screens/Gallery.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Gallery() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fragments, setFragments] = useState([]);      // массив ID или путей собранных фрагментов
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // 1) Получаем список фрагментов
  useEffect(() => {
    async function fetchFragments() {
      setLoading(true);
      setError('');
      try {
        // TODO: заменить на реальный вызов API.getFragments(user.tg_id)
        // const data = await API.getFragments(user.tg_id);
        // setFragments(data.fragments);

        // Заглушка: имитируем, что игрок собрал 3 фрагмента с ID 1,2,3
        await new Promise(res => setTimeout(res, 500));
        setFragments([1, 2, 3]);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить фрагменты');
      } finally {
        setLoading(false);
      }
    }
    fetchFragments();
  }, [user]);

  // 2) Если собрано 8, переходим на FinalPhrase
  useEffect(() => {
    if (!loading && fragments.length >= 8) {
      navigate('/final');
    }
  }, [loading, fragments, navigate]);

  // 3) Отрисовка 4×2 сетки
  const renderGrid = () => {
    const cells = [];
    for (let i = 1; i <= 8; i++) {
      const collected = fragments.includes(i);
      cells.push(
        <div
          key={i}
          className={`w-24 h-24 m-2 rounded-lg overflow-hidden border-2 ${
            collected ? 'border-red-600' : 'border-gray-400'
          }`}
        >
          {collected ? (
            <img
              src={`/images/fragments/fragment-${i}.webp`}
              alt={`Fragment ${i}`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
              ?
            </div>
          )}
        </div>
      );
    }
    return <div className="flex flex-wrap justify-center">{cells}</div>;
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center pt-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-path.webp')" }}
    >
      {/* Полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-black opacity-50" />

      <div className="relative z-10 w-full max-w-lg bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6 text-center">
        <BackButton />

        <h2 className="text-2xl font-bold text-gray-900">Your Fragments</h2>

        {loading && <p className="text-gray-700">Loading fragments...</p>}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && renderGrid()}

        <div className="flex justify-around mt-4">
          <button
            onClick={() => navigate('/referral')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Referral
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
