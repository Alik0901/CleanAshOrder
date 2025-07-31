// src/screens/Home.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate         = useNavigate();

  return (
    <div
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg-ash.webp')" }}
    >
      {/* Чёрный оверлей 50% */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Светлая «карточка» */}
      <div className="relative z-10 mx-auto my-12 w-full max-w-md bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-8 text-center">
        {/* Логотип (убедитесь, что /images/logo.png существует) */}
        <img
          src="/images/logo.png"
          alt="Order of Ash"
          className="h-20 mx-auto mb-4"
        />

        {/* Заголовок */}
        <h1 className="text-4xl font-extrabold text-gray-900">
          Order of Ash
        </h1>

        {user ? (
          <>
            <p className="text-lg text-gray-700">
              Welcome back, <span className="font-semibold">{user.name || user.tg_id}</span>!
            </p>

            <button
              onClick={() => navigate('/burn')}
              className="w-full py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition"
            >
              🔥 Burn Yourself
            </button>

            <button
              onClick={logout}
              className="mt-4 text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition"
          >
            Start Playing
          </button>
        )}
      </div>
    </div>
  );
}
