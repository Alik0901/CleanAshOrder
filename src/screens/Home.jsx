import React from 'react';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <>
      {/* Обёртка для фонового изображения и оверлея */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          overflow: 'hidden',
        }}
      >
        {/* 1) Фоновый слой */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgWelcome})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* 2) Полупрозрачный чёрный оверлей */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        />
      </div>
    </>
  );
}
