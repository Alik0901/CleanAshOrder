import React from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
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
      {/* Header with semi-transparent background */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '1rem',
          backgroundColor: 'rgba(10, 10, 10, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <nav style={{ position: 'absolute', left: '1rem' }}>
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
        </nav>
        <h1
          style={{
            color: 'white',
            fontSize: '1.75rem',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          Order of Ash
        </h1>
      </header>

      {/* Background image layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `url(${bgWelcome})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Semi-transparent overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Textual content */}
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
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>
          Добро пожаловать
        </h1>
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
    </div>
  );
}
