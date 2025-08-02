// файл: src/screens/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRightCircle, FiImage, FiZap, FiUsers } from 'react-icons/fi';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white flex flex-col">
      {/* Отступ сверху под NavBar */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold font-montserrat">
            Welcome to the Order of Ash
          </h1>
          <p className="text-lg md:text-xl font-inter text-gray-300">
            Unleash the ritual, collect all fragments, and unveil the secret phrase.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/burn')}
              className="flex items-center justify-center space-x-2 py-4 bg-[#FF6B6B] hover:bg-[#FF4757] rounded-lg shadow-lg transition-all font-semibold text-lg"
            >
              <FiZap size={24} />
              <span>Burn Yourself</span>
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="flex items-center justify-center space-x-2 py-4 bg-[#4ECDC4] hover:bg-[#48C9B0] rounded-lg shadow-lg transition-all font-semibold text-lg"
            >
              <FiImage size={24} />
              <span>View Gallery</span>
            </button>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/referral')}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-inter text-sm"
            >
              <FiUsers size={18} />
              <span>Invite Friends</span>
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-inter text-sm"
            >
              <FiArrowRightCircle size={18} />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </div>
      {/* Футер-пустышка для NavBar */}
      <div className="h-16"></div>
    </div>
  );
}
