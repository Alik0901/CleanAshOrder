import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | pending | inQuest | success | error | blocked
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [task, setTask] = useState(null);       // квест после оплаты
  const [answer, setAnswer] = useState('');     // ответ для легендарного ввода
  const [result, setResult] = useState({});     // ответ с бэка после complete
  const [error, setError] = useState('');

  const BASE_AMOUNT_NANO = 500_000_000; // 0.5 TON

  const startBurn = async () => {
    setStatus('pending');
    setError('');
    try {
      const { invoiceId, paymentUrl } = await API.createBurn(user.tg_id, BASE_AMOUNT_NANO);
      setInvoiceId(invoiceId);
      setPaymentUrl(paymentUrl);
    } catch (e) {
      // обработка запрета до 1–3
      const msg = e.message || 'Error creating invoice';
      if (msg === 'burn_not_allowed' || msg.includes('need_fragments_1_2_3')) {
        setStatus('blocked');
        setError('Collect fragments #1–#3 to start burning.');
        return;
      }
      setError(msg);
      setStatus('error');
      if (msg.toLowerCase().includes('invalid token')) {
        logout();
        navigate('/login');
      }
    }
  };

  // Поллинг оплаты → получение квеста
  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        if (!res.paid) return; // ждём оплату
        clearInterval(timer);
        if (res.task) {
          setTask(res.task);
          setStatus('inQuest');
        } else {
          // fallback: если квест не прилетел — сразу успешное завершение
          const done = await API.completeBurn(invoiceId, true);
          setResult(done);
          setStatus('success');
        }
      } catch (e) {
        clearInterval(timer);
        setError(e.message || 'Error checking payment');
        setStatus('error');
        if (String(e.message).toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId, logout, navigate]);

  // Сабмит квеста
  const submitQuest = async (selected) => {
    if (!task) return;
    try {
      let success = false;
      if (task.type === 'quiz') {
        // варианты или ручной ввод
        if (task.params?.options?.length) {
          success = (selected === task.params.answer);
        } else {
          success = (answer === task.params?.answer);
        }
      } else {
        success = true;
      }

      const done = await API.completeBurn(invoiceId, !!success);
      setResult(done);
      setStatus('success');
    } catch (e) {
      setError(e.message || 'Failed to complete quest');
      setStatus('error');
    }
  };

  const rarityItems = [
    { key: 'legendary', label: 'Legendary', percent: '5%',    icon: '/images/icons/legendary.png', top: 149 },
    { key: 'rare',      label: 'Rare',      percent: '15%',   icon: '/images/icons/rare.png',      top: 218 },
    { key: 'uncommon',  label: 'Uncommon',  percent: '80%',   icon: '/images/icons/uncommon.png',  top: 287 },
    { key: 'common',    label: 'Common',    percent: '-',     icon: '/images/icons/common.png',    top: 356 },
  ];

  const mandatoryNotReady = !Array.isArray(user?.fragments) ||
    !user.fragments.map(Number).includes(1) ||
    !user.fragments.map(Number).includes(2) ||
    !user.fragments.map(Number).includes(3);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Checker background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/Checker.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Burn background + gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "linear-gradient(0deg, rgba(0,0,0,0.56), rgba(0,0,0,0.56)), url('/images/bg-burn.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
      />

      {/* Навигация */}
      <BackButton
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 5,
          color: '#ffffff',
        }}
      />

      {/* Заголовок */}
      <h1
        style={{
          position: 'absolute',
          top: 25,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 40,
          lineHeight: '48px',
          color: '#9E9191',
          whiteSpace: 'nowrap',
          zIndex: 5,
        }}
      >
        Burn&nbsp;Yourself
      </h1>

      {/* Элемент редкости */}
      <h3
        style={{
          position: 'absolute',
          left: 46,
          top: 90,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          lineHeight: '24px',
          color: '#9E9191',
          zIndex: 5,
        }}
      >
        Element rarity
      </h3>

      {/* Ряды редкостей */}
      {rarityItems.map(({ key, label, percent, icon, top }) => (
        <React.Fragment key={key}>
          <div
            style={{
              position: 'absolute',
              left: 26,
              top,
              width: 58,
              height: 58,
              backgroundImage: `url('${icon}')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 102,
              top,
              width: 193,
              height: 58,
              border: '1px solid #979696',
              borderRadius: 16,
              zIndex: 5,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 152,
              top: top + 21,
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '24px',
              color: '#9E9191',
              zIndex: 5,
            }}
          >
            {label}
          </span>
          <span
            style={{
              position: 'absolute',
              left: 316,
              top: top + 21,
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '24px',
              color: '#9E9191',
              zIndex: 5,
            }}
          >
            {percent}
          </span>
        </React.Fragment>
      ))}

      {/* Кнопка */}
      <button
        onClick={startBurn}
        disabled={mandatoryNotReady}
        style={{
          position: 'absolute',
          left: 65,
          top: 480,
          width: 265,
          height: 76,
          backgroundImage: 'linear-gradient(90deg, #D81E3D 0%, #D81E5F 100%)',
          boxShadow: '0px 6px 6px rgba(0,0,0,0.87)',
          border: 'none',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          cursor: mandatoryNotReady ? 'not-allowed' : 'pointer',
          opacity: mandatoryNotReady ? 0.6 : 1,
        }}
        title={mandatoryNotReady ? 'Collect fragments #1–#3 first' : undefined}
      >
        <span
          style={{
            fontFamily: 'Tajawal, sans-serif',
            fontWeight: 700,
            fontSize: 24,
            lineHeight: '29px',
            color: '#FFFFFF',
          }}
        >
          BURN&nbsp;0,5&nbsp;TON
        </span>
      </button>

      {/* Подсказка */}
      <p
        style={{
          position: 'absolute',
          left: 42,
          top: 594,
          width: 318,
          fontFamily: 'Tajawal, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          lineHeight: '18px',
          color: '#9E9191',
          textAlign: 'center',
          zIndex: 5,
        }}
      >
        Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.
      </p>

      {/* Overlay: ожидание оплаты */}
      {status === 'pending' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#fff', fontSize: 18 }}>Waiting for payment...</span>
        </div>
      )}

      {/* Overlay: квест после оплаты */}
      {status === 'inQuest' && task && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 11,
          }}
        >
          <div style={{
            width: 320, background:'#111', border:'1px solid #9E9191', color:'#fff',
            padding:16, borderRadius:12
          }}>
            <h3 style={{ marginTop:0, marginBottom:8, fontFamily:'Tajawal, sans-serif' }}>
              Mini-quest ({task.rarity})
            </h3>
            <p style={{ margin:'0 0 12px' }}>{task.params?.question || task.question}</p>

            {/* варианты ответа */}
            {Array.isArray(task.params?.options) && task.params.options.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {task.params.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => submitQuest(opt)}
                    style={{
                      height:36, borderRadius:8, border:'1px solid #666',
                      background:'#222', color:'#fff', cursor:'pointer'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type answer…"
                  style={{
                    flex:1, height:36, borderRadius:8, border:'1px solid #666',
                    background:'#222', color:'#fff', padding:'0 10px'
                  }}
                />
                <button
                  onClick={() => submitQuest(answer)}
                  style={{
                    height:36, borderRadius:8, border:'none',
                    background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                    color:'#fff', padding:'0 12px', cursor:'pointer'
                  }}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay: успех (фрагмент или проклятие, или fail квеста) */}
      {status === 'success' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 12,
            color: '#fff',
          }}
        >
          {result.cursed ? (
            <>
              <span style={{ fontSize:18, marginBottom:12 }}>You are cursed.</span>
              <button onClick={() => navigate('/')} style={{ marginTop: 8 }}>
                Back to Home
              </button>
            </>
          ) : typeof result.newFragment === 'number' ? (
            <>
              <span style={{ fontSize:18, marginBottom:12 }}>
                Congratulations! You got fragment #{result.newFragment}.
              </span>
              <button onClick={() => navigate('/gallery')} style={{ marginTop: 8 }}>
                View Gallery
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize:18, marginBottom:12 }}>
                Quest failed — better luck next time.
              </span>
              <button onClick={() => setStatus('idle')} style={{ marginTop: 8 }}>
                Close
              </button>
            </>
          )}
        </div>
      )}

      {/* Overlay: ошибка/блокировка */}
      {(status === 'error' || status === 'blocked') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: status === 'blocked' ? '#fff' : 'tomato',
            textAlign:'center',
            padding:'0 20px'
          }}
        >
          <span>{error}</span>
          {status === 'blocked' ? (
            <div style={{ marginTop: 16, display:'flex', gap:12 }}>
              <Link to="/referral" style={{ color:'#fff', textDecoration:'underline' }}>Invite friends</Link>
              <Link to="/third" style={{ color:'#fff', textDecoration:'underline' }}>Claim fragment #3</Link>
            </div>
          ) : (
            <button onClick={() => setStatus('idle')} style={{ marginTop: 16 }}>
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
