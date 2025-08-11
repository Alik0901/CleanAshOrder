import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';

// Простой инлайн-таймер без внешних зависимостей
function CountdownInline({ to, onDone }) {
  const [ms, setMs] = useState(() => Math.max(0, new Date(to) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, new Date(to) - Date.now());
      setMs(left);
      if (left === 0) {
        clearInterval(id);
        onDone && onDone();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [to, onDone]);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <span>{hh}:{mm}:{ss}</span>;
}

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Статусы: idle -> pending(ожидание оплаты) -> inQuest -> completed / error
  const [status, setStatus] = useState('idle');
  const [invoiceId, setInvoiceId] = useState(null);
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Проклятие: блокируем кнопку
  const hasActiveCurse =
    user?.is_cursed && user?.curse_expires && new Date(user.curse_expires) > new Date();

  const startBurn = async () => {
    if (hasActiveCurse) return;
    setStatus('pending');
    setError('');
    try {
      // ваш API.createBurn принимает tg_id (второй аргумент игнорится бэком — ок)
      const { invoiceId, paymentUrl, task } = await API.createBurn(user.tg_id, 500_000_000);
      setInvoiceId(invoiceId);
      setTask(task || null);
      // по желанию можно открыть оплату в новой вкладке:
      // window.open(paymentUrl, '_blank');
    } catch (e) {
      setError(e.message || 'Error creating invoice');
      setStatus('error');
      if (String(e.message).toLowerCase().includes('invalid token')) {
        logout();
        navigate('/login');
      }
    }
  };

  // Опрос статуса после создания инвойса → ждём оплаты → получаем квест
  useEffect(() => {
    if (status !== 'pending' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        // Новая серверная логика:
        // до оплаты: { paid:false, task }
        // после оплаты: { paid:true, inQuest:true, task }
        if (res.paid && res.inQuest) {
          clearInterval(timer);
          setTask(res.task);
          setStatus('inQuest');
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

  // Отправка ответа мини-квеста
  const submitAnswer = async () => {
    if (!task) return;
    setError('');
    try {
      const success = String(answer || '').trim() === String(task.params?.answer || '');
      const res = await API.completeBurn(invoiceId, success);
      if (!res.success) {
        setError('Wrong answer. Try again.');
        return;
      }
      // Успех: сервер отработал runBurnLogic и вернул { newFragment | cursed, curse_expires, ... }
      setResult(res);
      setStatus('completed');
    } catch (e) {
      setError(e.message || 'Error completing quest');
      setStatus('error');
    }
  };

  // ============ ВЁРСТКА (ваша исходная) + оверлеи ============
  const rarityItems = [
    { key: 'legendary', label: 'Legendary', percent: '5%',    icon: '/images/icons/legendary.png', top: 149 },
    { key: 'rare',      label: 'Rare',      percent: '15%',   icon: '/images/icons/rare.png',      top: 218 },
    { key: 'uncommon',  label: 'Uncommon',  percent: '30%',   icon: '/images/icons/uncommon.png',  top: 287 },
    { key: 'common',    label: 'Common',    percent: '50%',   icon: '/images/icons/common.png',    top: 356 },
  ];

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
        disabled={status !== 'idle' || hasActiveCurse}
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
          cursor: hasActiveCurse ? 'not-allowed' : 'pointer',
          opacity: status !== 'idle' || hasActiveCurse ? 0.7 : 1,
        }}
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

      {/* Подсказка / Проклятие */}
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
        {hasActiveCurse ? (
          <>
            You are cursed. Wait:&nbsp;
            <CountdownInline to={user.curse_expires} />
          </>
        ) : (
          'Please ensure you send exactly 0.5 TON when making your payment. Transactions for any other amount may be lost.'
        )}
      </p>

      {/* Оверлеи */}
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

      {status === 'inQuest' && task && (
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
            color: '#fff',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: 8 }}>Mini-quest ({task.rarity})</h2>
          <p>{task.params?.question}</p>
          <div style={{ marginTop: 12 }}>
            {Array.isArray(task.params?.options) && task.params.options.length > 0 ? (
              task.params.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(opt)}
                  style={{
                    margin: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #999',
                    background: answer === opt ? '#444' : '#222',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))
            ) : (
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #aaa',
                  width: 260,
                  textAlign: 'center',
                }}
              />
            )}
          </div>
          <button
            onClick={submitAnswer}
            disabled={!answer}
            style={{
              marginTop: 12,
              padding: '10px 18px',
              borderRadius: 18,
              border: 'none',
              color: '#fff',
              background: '#28a745',
              cursor: !answer ? 'not-allowed' : 'pointer',
            }}
          >
            Submit
          </button>
          {error && <p style={{ color: 'tomato', marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {status === 'completed' && result && (
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
            color: '#fff',
          }}
        >
          {result.cursed ? (
            <>
              <p style={{ marginBottom: 8 }}>You are cursed!</p>
              <p style={{ marginBottom: 12 }}>
                Expires in: <CountdownInline to={result.curse_expires} />
              </p>
            </>
          ) : (
            <p style={{ marginBottom: 12 }}>
              Congratulations! You got fragment #{result.newFragment}.
            </p>
          )}
          <button onClick={() => navigate('/gallery')} style={{ padding: '8px 16px' }}>
            View Gallery
          </button>
        </div>
      )}

      {status === 'error' && (
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
            color: 'tomato',
          }}
        >
          <span>{error}</span>
          <button onClick={() => setStatus('idle')} style={{ marginTop: 16 }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
