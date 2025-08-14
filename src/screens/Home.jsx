// src/screens/Home.jsx
import { Link } from 'react-router-dom';
import bgWelcome from '../assets/images/converted_minimal.jpg';
import logo from '../assets/images/logo_trimmed_optimized.png';
import galleryBtn from '../assets/images/gallery.png';
import leaderboardBtn from '../assets/images/leaderboard.png';
import referralBtn from '../assets/images/referral.png';
import profileBtn from '../assets/images/profile.png';
import { AuthContext } from '../context/AuthContext';

// Простой инлайн-таймер до даты
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
  const { user, refreshUser } = useContext(AuthContext);

  // Текущие фрагменты игрока
  const frags = Array.isArray(user?.fragments) ? user.fragments.map(Number) : [];
  const has1 = frags.includes(1);
  const has2 = frags.includes(2);
  const has3 = frags.includes(3);
  const mandatoryDone = has1 && has2 && has3;

  // Активное проклятие
  const curse = useMemo(() => {
    if (!user?.is_cursed || !user?.curse_expires) return null;
    const active = new Date(user.curse_expires) > new Date();
    return active ? user.curse_expires : null;
  }, [user]);

  // Модалка «получен #1» (поддерживаем оба ключа флага)
  const [showInitModal, setShowInitModal] = useState(false);
  useEffect(() => {
    const flagA = localStorage.getItem('showInitialAward');
    const flagB = localStorage.getItem('showFirstFragmentNotice');
    const shouldShow = flagA === '1' || flagA === 'true' || flagB === 'true';
    if (shouldShow && has1) {
      setShowInitModal(true);
      localStorage.removeItem('showInitialAward');
      localStorage.removeItem('showFirstFragmentNotice');
    }
  }, [has1]);

  // Мгновенный рефреш при заходе на экран
  useEffect(() => {
    if (typeof refreshUser === 'function') {
      refreshUser({ silent: true, force: true });
    }
  }, [refreshUser]);

  // 🔁 Поллинг до тех пор, пока не собраны 1–3 или активно проклятие.
  // Нужен для случаев, когда фрагменты меняются «в обход» (ручное редактирование БД, клейм на другом экране и т.п.)
  useEffect(() => {
    if (mandatoryDone && !curse) return; // всё ок — опрос не нужен
    const id = setInterval(() => {
      if (typeof refreshUser === 'function') {
        refreshUser({ silent: true });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [mandatoryDone, curse, refreshUser]);

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

      {/* Хедер */}
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
        <div style={{ position: 'absolute', right: '1rem', width: '1.5rem', height: 0 }} />
      </header>

      {/* Баннер проклятия */}
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

      {/* Баннер — собери 1–3 до старта (адаптивный) */}
      {!mandatoryDone && (
        <div
          style={{
            position: 'absolute',
            top: curse ? 110 : 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,

            // контейнер
            width: 'calc(100% - 32px)',
            maxWidth: 414,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid rgba(157,157,157,0.7)',
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              color: '#D6CEBD',
              fontWeight: 700,
              fontSize: 'clamp(13px, 3.8vw, 16px)',
              lineHeight: 1.35,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              hyphens: 'auto',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Collect fragments #1–#3 to unlock the burn. Invite friends to claim #2,
            and complete the Third Quest for #3.
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <Link
              to="/referral"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 44,
                borderRadius: 12,
                border: '1px solid #9D9D9D',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Invite friends
            </Link>

            <Link
              to="/third"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
                cursor: 'pointer',
              }}
            >
              Claim #3
            </Link>
          </div>
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
              opacity: curse || !mandatoryDone ? 0.6 : 1,
              pointerEvents: curse || !mandatoryDone ? 'none' : 'auto',
            }}
            title={
              curse ? 'Cursed — wait for the timer'
                : (!mandatoryDone ? 'Collect 1–3 first' : undefined)
            }
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

      {/* Нижние кнопки */}
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

      {/* Модалка «получен фрагмент #1» */}
      {showInitModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#111',
              color: '#fff',
              border: '1px solid #9E9191',
              padding: '16px 20px',
              borderRadius: 12,
              width: 320,
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 8px' }}>Welcome, Initiate</h3>
            <p style={{ margin: '0 0 12px' }}>
              You received your first fragment <b>#1</b>.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => setShowInitModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #666',
                  background: '#222',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <Link
                to="/gallery"
                onClick={() => setShowInitModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#D81E5F',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
