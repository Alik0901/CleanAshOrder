// файл: src/screens/Home.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiZap, FiImage, FiUsers, FiBarChart2, FiUser, FiClock } from 'react-icons/fi';
import NavBar from '../components/NavBar';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { key: 'burn',       label: 'Burn Yourself',    icon: <FiZap size={32} />,        onClick: () => navigate('/burn'),       accent: 'from-[#FF6B6B] to-[#FF4757]' },
    { key: 'gallery',    label: 'Gallery',          icon: <FiImage size={32} />,      onClick: () => navigate('/gallery'),    accent: 'from-[#4ECDC4] to-[#48C9B0]' },
    { key: 'referral',   label: 'Referral',         icon: <FiUsers size={32} />,      onClick: () => navigate('/referral'),   accent: 'from-[#E5A22D] to-[#D18B12]' },
    { key: 'leaderboard',label: 'Leaderboard',      icon: <FiBarChart2 size={32} />,   onClick: () => navigate('/leaderboard'),accent: 'from-[#FF6B6B] to-[#FF4757]' },
    { key: 'profile',    label: 'Profile',          icon: <FiUser size={32} />,       onClick: () => navigate('/profile'),    accent: 'from-[#4ECDC4] to-[#48C9B0]' },
    { key: 'daily',      label: 'Daily Quest',      icon: <FiClock size={32} />,      onClick: () => navigate('/burn'),       accent: 'from-[#E5A22D] to-[#D18B12]' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#10101A] to-[#1A1A2E] text-white">
      {/* Фоновый силуэт Хранителя */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/silhouette.png"
          alt="Guardian Silhouette"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <NavBar />

      <div className="relative pt-20 pb-16 px-4 container mx-auto">
        {/* Главный логотип */}
        <div className="flex justify-center mb-8">
          <img src="/images/logo-order-of-ash.svg" alt="Order of Ash" className="w-48" />
        </div>

        {/* Меню-кнопки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center p-6 bg-gray-800 bg-opacity-60 rounded-xl shadow-lg hover:scale-105 transform transition overflow-hidden border-2 border-transparent hover:border-[#FF6B6B]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-20 rounded-xl`} />
              <div className="relative z-10 flex flex-col items-center space-y-2">
                <div className="text-white">{item.icon}</div>
                <span className="font-montserrat text-lg font-semibold text-center">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full py-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        <div className="flex justify-center space-x-6">
          <a href="#" className="hover:text-[#4ECDC4]">Telegram</a>
          <a href="#" className="hover:text-[#E5A22D]">Docs</a>
          <a href="#" className="hover:text-[#FF6B6B]">Website</a>
        </div>
      </div>
    </div>
  );
}
