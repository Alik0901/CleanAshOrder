// src/screens/Congrats.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Замените на реальный плейсхолдер вашей NFT или URL из API
const NFT_PLACEHOLDER = '/images/final-nft-placeholder.webp';

export default function Congrats() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const handleShare = async () => {
    const shareData = {
      title: 'I completed the Order of Ash',
      text: 'I just forged my final NFT in Order of Ash! 🔥',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        setMessage('Link copied to clipboard!');
      }
    } catch {
      setMessage('Unable to share at this time.');
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-ash.webp')" }}
    >
      {/* Оверлей */}
      <div className="absolute inset-0 bg-black opacity-60" />

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center space-y-8">
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg text-center">
          Congratulations!
        </h2>
        <p className="text-lg text-white/90 text-center max-w-md">
          You have collected all fragments and forged your Final NFT.
        </p>

        <div className="w-64 h-64 bg-gray-800 rounded-xl overflow-hidden shadow-lg">
          <img
            src={NFT_PLACEHOLDER}
            alt="Your Final NFT"
            className="object-cover w-full h-full"
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/fragments/placeholder.webp';
            }}
          />
        </div>

        {message && (
          <p className="text-sm text-yellow-300">{message}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Share Your Victory
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Go to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
