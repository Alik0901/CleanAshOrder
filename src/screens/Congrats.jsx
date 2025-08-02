// файл: src/screens/Congrats.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Congrats() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Загружаем подписанный URL для финального изображения (NFT)
    API.getPresigned()
      .then(data => {
        const url = data.signedUrls['final-image.jpg'];
        setImageUrl(url);
      })
      .catch(err => {
        const msg = err.message || 'Не удалось загрузить изображение';
        setError(msg);
        if (msg.toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        }
      });
  }, [logout, navigate]);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/images/bg-final.webp')" }}
    >
      <div className="absolute inset-0 bg-black opacity-70" />
      <div className="relative z-10 mx-auto max-w-lg p-6 bg-gray-900 bg-opacity-90 rounded-xl space-y-6">
        <BackButton className="text-white" />
        <h1 className="text-3xl font-bold text-center">Congratulations!</h1>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Final Puzzle"
            className="w-full rounded-lg shadow-lg"
          />
        )}

        {!imageUrl && !error && (
          <p className="text-center">Generating your NFT...</p>
        )}

        {error && (
          <p className="text-red-500 text-center">{error}</p>
        )}

        <button
          onClick={() => navigate('/profile')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white"
        >
          Go to Profile
        </button>
      </div>
    </div>
  );
}
