import React from 'react';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 1) Фоновой слой */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgWelcome})` }}
      />
      {/* 2) Полупрозрачный чёрный оверлей */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />
    </div>
  );
}
