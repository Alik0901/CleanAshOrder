import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiImage, FiUsers, FiBarChart2, FiUser, FiClock } from 'react-icons/fi';
import NavBar from '../components/NavBar';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { key: 'burn',       label: 'Burn Yourself', icon: <FiZap size={32} />,      onClick: () => navigate('/burn'),       accent: 'from-[#FF6B6B] to-[#FF4757]' },
    { key: 'gallery',    label: 'Gallery',       icon: <FiImage size={32} />,    onClick: () => navigate('/gallery'),    accent: 'from-[#4ECDC4] to-[#48C9B0]' },
    { key: 'referral',   label: 'Referral',      icon: <FiUsers size={32} />,    onClick: () => navigate('/referral'),   accent: 'from-[#E5A22D] to-[#D18B12]' },
    { key: 'leaderboard',label: 'Leaderboard',   icon: <FiBarChart2 size={32} />,onClick: () => navigate('/leaderboard'),accent: 'from-[#FF6B6B] to-[#FF4757]' },
    { key: 'profile',    label: 'Profile',       icon: <FiUser size={32} />,     onClick: () => navigate('/profile'),    accent: 'from-[#4ECDC4] to-[#48C9B0]' },
    { key: 'daily',      label: 'Daily Quest',   icon: <FiClock size={32} />,    onClick: () => navigate('/burn'),       accent: 'from-[#E5A22D] to-[#D18B12]' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#10101A] to-[#1A1A2E] text-white">
      {/* Optimized background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/converted_minimal.jpg"
          alt="Guardian Silhouette"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <NavBar />

      <div className="relative pt-20 pb-16 px-4 container mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/images/logo-order-of-ash.svg" alt="Order of Ash" className="w-48" />
        </div>

        {/* Menu Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`flex items-center justify-center space-x-2 p-6 rounded-lg shadow-lg transition bg-gradient-to-br ${item.accent}`}
            >
              {item.icon}
              <span className="font-inter font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Secondary Actions */}
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
