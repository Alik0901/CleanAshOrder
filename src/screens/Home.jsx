import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Countdown from 'react-countdown';
import { AuthContext } from '../contexts/AuthContext';
import bgWelcome from '../assets/images/converted_minimal.jpg';
import logo from '../assets/images/logo_trimmed_optimized.png';

// Кнопки-таблички
import galleryBtn from '../assets/images/gallery.png';
import leaderboardBtn from '../assets/images/leaderboard.png';
import referralBtn from '../assets/images/referral.png';
import profileBtn from '../assets/images/profile.png';

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    console.log('🏠 Home mounted, bgWelcome =', bgWelcome);
  }, []);

  // Обновляем текущее время каждую секунду для таймера
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Вычисляем, активно ли проклятие
  const curseExpiresAt = user?.curse_expires ? new Date(user.curse_expires).getTime() : 0;
  const isCursedActive = user?.is_cursed && now < curseExpiresAt;

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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />

      {/* Оверлей проклятия */}
      {isCursedActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            color: 'white',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Вы прокляты!</h2>
          <Countdown
            date={curseExpiresAt}
            renderer={({ hours, minutes, seconds, completed }) =>
              completed ? (
                <span style={{ fontSize: '2rem' }}>Проклятие снято</span>
              ) : (
                <span style={{ fontSize: '2rem' }}>
                  {hours.toString().padStart(2, '0')}:
                  {minutes.toString().padStart(2, '0')}:
                  {seconds.toString().padStart(2, '0')}
                </span>
              )
            }
          />
        </div>
      )}

      {/* Хедер с логотипом */}
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
          zIndex: 30,
        }}
      >
        <h1 style={{ color: 'white', fontSize: '1.5rem' }}>Order of Ash</h1>
      </header>

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
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontFamily: '"MedievalSharp", serif',
                margin: '0 0 1rem',
              }}
            >
              Welcome to Order of Ash
            </h2>
            <p style={{ fontSize: '1.125rem', margin: 0 }}>
              Burn yourself for power, collect the fragments, and uncover the
              secrets of the Order of Ash.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginLeft: '1rem' }}>
            {isCursedActive ? (
              <button
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#444',
                  color: 'white',
                  borderRadius: '9999px',
                  fontWeight: 'bold',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                }}
                disabled
              >
                Проклятие активно
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </main>

      {/* Кнопки-таблички: два ряда внизу */}
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
          zIndex: 30,
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