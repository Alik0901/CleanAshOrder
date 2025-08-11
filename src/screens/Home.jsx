import React, { useEffect, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';
import logo from '../assets/images/logo_trimmed_optimized.png';
import galleryBtn from '../assets/images/gallery.png';
import leaderboardBtn from '../assets/images/leaderboard.png';
import referralBtn from '../assets/images/referral.png';
import profileBtn from '../assets/images/profile.png';
import { AuthContext } from '../context/AuthContext';

// Простой таймер
function CountdownInline({ to }) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(to) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, new Date(to) - Date.now());
      setMs(left);
    }, 1000);
    return () => clearInterval(id);
  }, [to]);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <>{hh}:{mm}:{ss}</>;
}

export default function Home() {
  const { user } = useContext(AuthContext);

  const curse = useMemo(() => {
    if (!user?.is_cursed || !user?.curse_expires) return null;
    const active = new Date(user.curse_expires) > new Date();
    return active ? user.curse_expires : null;
  }, [user]);

  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, left: 0,
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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
        <div
          style={{
            position: 'absolute',
            right: '1rem',
            width: '1.5rem',
            height: 0,
          }}
        />
      </header>

      {/* Баннер проклятия (если активно) */}
      {curse && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid #9E9191',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 12,
            zIndex: 30,
            whiteSpace: 'nowrap',
          }}
        >
          You are cursed. Time left: <CountdownInline to={curse} />
        </div>
      )}

      {/* Основной контент */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          color: 'white',
          padding: '0 1rem',
          marginTop: '4rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px',
            marginLeft: 0,
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: '"MedievalSharp", serif', margin: '0 0 1rem' }}>
              Welcome to Order of Ash
            </h2>
            <p style={{ fontSize: '1.125rem', margin: 0 }}>
              Burn yourself for power, collect the fragments, and uncover the secrets of the Order of Ash.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              marginLeft: '1rem',
              opacity: curse ? 0.6 : 1,
              pointerEvents: curse ? 'none' : 'auto',
            }}
            title={curse ? 'Cursed — wait for the timer' : undefined}
          >
            <Link
              to="/burn"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #ef4444, #ec4899)',
                color: 'white',
                borderRadius: '9999px',
                fontWeight: 'bold',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Burn Yourself
            </Link>
          </div>
        </div>
      </main>

      {/* Кнопки-таблички */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/gallery">
            <img src={galleryBtn} alt="Gallery" style={{ height: '2.5rem' }} />
          </Link>
          <Link to="/leaderboard">
            <img src={leaderboardBtn} alt="Leaderboard" style={{ height: '2.5rem' }} />
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/referral">
            <img src={referralBtn} alt="Referral" style={{ height: '2.5rem' }} />
          </Link>
          <Link to="/profile">
            <img src={profileBtn} alt="Profile" style={{ height: '2.5rem' }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
