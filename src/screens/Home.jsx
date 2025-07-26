// src/screens/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  // TODO: заменить заглушку реальными данными из API
  const collected = 0;
  const total = 8;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Ash Bot</h1>
      <p className="mb-4">
        Fragments collected: {collected} / {total}
      </p>
      <Link
        to="/burn"
        className="inline-block bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        🔥 Burn Yourself (Free)
      </Link>
      <div className="mt-6 bg-gray-100 p-3 rounded">
        <p className="mb-1">Invite friends → +1 guaranteed fragment</p>
        <Link to="/referral" className="text-blue-600 text-sm">
          Invite Friends
        </Link>
      </div>
    </div>
  );
}
