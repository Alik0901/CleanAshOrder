// src/screens/Home.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-ash.webp')" }}
    >
      {/* Градиентный оверлей сверху и снизу */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />

      {/* Контент */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-16">
        {/* Логотип и заголовок */}
        <div className="text-center space-y-4">
          <img
            src="/images/logo.png"
            alt="Order of Ash"
            className="h-24 mx-auto drop-shadow-lg"
          />
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
            Order of Ash
          </h1>
          {user && (
            <p className="text-lg text-white/80">
              Welcome back, <span className="font-semibold">{user.name || user.tg_id}</span>
            </p>
          )}
        </div>

        {/* Кнопки */}
        <div className="w-full max-w-xs space-y-4">
          {user ? (
            <>
              <button
                onClick={() => navigate('/burn')}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition"
              >
                🔥 Burn Yourself
              </button>
              <button
                onClick={logout}
                className="w-full py-3 bg-transparent border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition"
            >
              Start Playing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
