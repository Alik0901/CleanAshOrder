import React from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <div className="fixed inset-0">
      {/* Фоновый слой */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: `url(${bgWelcome})` }}
      />
      {/* Оверлей для читаемости */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Контент поверх */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Навбар */}
        <header className="flex items-center justify-between p-4">
          <h1 className="text-white text-xl font-bold">Order of Ash</h1>
          <button className="text-white text-2xl">&#9776;</button>
        </header>

        {/* Герой */}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Добро пожаловать
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
            Испепели себя ради силы, собирай фрагменты и открой тайну Order of Ash.
          </p>
          <Link
            to="/burn"
            className="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full shadow-xl hover:from-red-600 hover:to-pink-600 transition"
          >
            Burn Yourself
          </Link>
        </main>

        {/* Футер */}
        <footer className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/50">
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
        </footer>
      </div>
    </div>
  );
}
