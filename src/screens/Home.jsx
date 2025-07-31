// src/screens/Home.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate         = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-ash.webp')" }}
    >
      {/* Чёрный полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-black opacity-70" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 bg-opacity-90 rounded-xl shadow-xl p-8 space-y-6 text-center">
        {/* Логотип */}
        <img
          src="/images/logo.png"
          alt="Order of Ash"
          className="h-16 mx-auto"
        />

        {/* Заголовок */}
        <h1 className="text-3xl font-extrabold text-white">
          Order of Ash
        </h1>

        {user ? (
          <>
            <p className="text-gray-300">
              Welcome back, {user.name || user.tg_id}!
            </p>

            {/* Кнопка <Burn> */}
            <button
              onClick={() => navigate('/burn')}
              className="w-full py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              🔥 Burn Yourself
            </button>

            {/* Кнопка Logout */}
            <button
              onClick={logout}
              className="mt-2 text-sm text-gray-400 hover:text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            Start Playing
          </button>
        )}
      </div>
    </div>
  );
}
