import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

// Ensure "MedievalSharp" font is loaded in index.html:
// <link href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap" rel="stylesheet">

export default function Home() {
  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/referral', label: 'Referral' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/profile', label: 'Profile' },
  ];

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
      {/* Background image */}
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

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Header: only title and burger */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '1rem 2rem',
          backgroundColor: 'rgba(10, 10, 10, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
        <h1
          style={{
            color: 'white',
            fontFamily: '"MedievalSharp", cursive',
            fontSize: '1.75rem',
            margin: 0,
          }}
        >
          Order of Ash
        </h1>
        <div style={{ width: '1.5rem' }} /> {/* placeholder for right-alignment */}
      </header>

      {/* Main content */}
      <div
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
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>Добро пожаловать</h2>
        <p style={{ fontSize: '1.125rem', margin: '0 0 2rem', maxWidth: '600px' }}>
          Испепели себя ради силы, собирай фрагменты и открой тайну Order of Ash.
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
            cursor: 'pointer',
          }}
        >
          Burn Yourself
        </Link>
      </div>

      {/* Footer navigation */}
      <nav
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1rem',
          zIndex: 20,
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
