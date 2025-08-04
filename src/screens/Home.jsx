import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  return (
    <div
      className="w-full h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${bgWelcome})` }}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Навбар */}
        <header className="p-4">
          <h1 className="text-white text-xl font-bold">Order of Ash</h1>
        </header>

        {/* Герой */}
        <main className="flex-grow flex items-center justify-center text-center px-4">
          <h2 className="text-5xl font-extrabold text-white">
            Добро пожаловать
          </h2>
          <Link
            to="/burn"
            className="mt-6 px-8 py-4 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition"
          >
            Burn Yourself
          </Link>
        </main>
      </div>
    </div>
  );
}
