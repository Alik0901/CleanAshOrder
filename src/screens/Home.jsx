import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';
import logo from '../assets/images/logo_trimmed_optimized.png';

// Кнопки-таблички
import galleryBtn from '../assets/images/gallery.png';
import leaderboardBtn from '../assets/images/leaderboard.png';
import referralBtn from '../assets/images/referral.png';
import profileBtn from '../assets/images/profile.png';

export default function Home() {
  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  return (
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
      {/* Фон */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgWelcome})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // 30% оверлей
        }}
      />

      {/* Хедер с логотипом по центру */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(10,10,10,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <button
          style={{
            position: 'absolute',
            left: '1rem',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
        <img
          src={logo}
          alt="Order of Ash logo"
          style={{ height: '3rem', objectFit: 'contain' }}
        />
      </header>

      {/* Основной контент */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '0 1rem',
          marginTop: '4rem',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>
          Welcome to Order of Ash
        </h2>
        <p style={{ fontSize: '1.125rem', margin: '0 0 2rem', maxWidth: '600px' }}>
          Burn yourself for power, collect the fragments, and uncover the secrets of the Order of Ash.
        </p>
        <Link
          to="/burn"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(to right, #ef4444, #ec4899)',
            color: 'white',
            borderRadius: '9999px',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Burn Yourself
        </Link>
      </main>

      {/* Кнопки-таблички: два ряда внизу */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 20,
        }}
      >
        {/* Верхний ряд */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/gallery">
            <img src={galleryBtn} alt="Gallery" style={{ height: '2rem' }} />
          </Link>
          <Link to="/leaderboard">
            <img src={leaderboardBtn} alt="Leaderboard" style={{ height: '2rem' }} />
          </Link>
        </div>
        {/* Нижний ряд */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/referral">
            <img src={referralBtn} alt="Referral" style={{ height: '2rem' }} />
          </Link>
          <Link to="/profile">
            <img src={profileBtn} alt="Profile" style={{ height: '2rem' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
