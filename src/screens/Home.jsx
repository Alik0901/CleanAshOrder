import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Фоновый слой */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgWelcome})` }}
      />
      {/* Полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Контент поверх */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Навбар с фоном */}
        <header className="w-full bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white fixed top-0 left-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg font-bold">Order of Ash</h1>
            <button className="text-2xl">&#9776;</button>
          </div>
        </header>

        {/* Герой */}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-16">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Добро пожаловать
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
            Испепели себя ради силы, собирай фрагменты и открой тайну Order of Ash.
          </p>
          <Link
            to="/burn"
            className="mt-2 px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full shadow-xl hover:from-red-600 hover:to-pink-600 transition"
          >
            Burn Yourself
          </Link>
        </main>

        {/* Футер с навигацией */}
        <footer className="w-full bg-black/50 py-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
            {[
              { to: '/gallery', label: 'Gallery' },
              { to: '/referral', label: 'Referral' },
              { to: '/leaderboard', label: 'Leaderboard' },
              { to: '/profile', label: 'Profile' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="py-3 text-center text-white font-medium hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}