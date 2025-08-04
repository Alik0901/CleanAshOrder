import React from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';

export default function Home() {
  return (
    <>
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
        {/* 3) Текстовый контент поверх */}
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
          }}
        >
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Добро пожаловать
          </h1>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', maxWidth: '600px' }}>
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
            }}
          >
            Burn Yourself
          </Link>
        </div>
      </div>
    </>
  );
}
