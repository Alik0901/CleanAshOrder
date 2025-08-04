import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 1. Фон */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgWelcome})` }}
      />
      {/* 2. Полупрозрачный оверлей */}
      <div className="absolute inset-0 bg-black/60" />
      {/* 🚫 пока ничего больше */}
    </div>
  );
}