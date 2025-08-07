import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../contexts/AuthContext';
import API from '../utils/apiClient';
import Countdown from 'react-countdown';

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle');
  const [invoiceId, setInvoiceId] = useState(null);
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  // Timer for curse
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const curseExpiresAt = user?.curse_expires ? new Date(user.curse_expires).getTime() : 0;
  const isCursed = user?.is_cursed && now < curseExpiresAt;

  const startBurn = async () => {
    if (isCursed) return;
    setStatus('creating'); setError('');
    try {
      const { invoiceId, paymentUrl, task } = await API.createBurn(user.tg_id);
      setInvoiceId(invoiceId);
      setTask(task);
      window.open(paymentUrl, '_blank');
      setStatus('awaiting');
    } catch (e) {
      setError(e.message || 'Ошибка создания счёта');
      setStatus('error');
      if (e.message.toLowerCase().includes('invalid token')) {
        logout(); navigate('/login');
      }
    }
  };

  // Poll payment
  useEffect(() => {
    if (status !== 'awaiting' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        if (res.paid && res.task) {
          clearInterval(timer);
          setTask(res.task);
          setStatus('quest');
        }
      } catch (e) {
        clearInterval(timer);
        setError('Ошибка проверки оплаты'); setStatus('error');
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [status, invoiceId]);

  const submitQuest = async () => {
    setError('');
    try {
      const success = answer.trim() === task.params.answer;
      const res = await API.completeBurn(invoiceId, success);
      if (res.success === false) {
        setError('Квест провален — повышен pity. Попробуйте снова.');
      } else {
        setResult(res);
        setStatus('result');
      }
    } catch (e) {
      setError('Ошибка завершения квеста'); setStatus('error');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Checker BG */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/images/Checker.webp')", backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      {/* Burn BG + gradient */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"linear-gradient(0deg,rgba(0,0,0,0.56),rgba(0,0,0,0.56)),url('/images/bg-burn.webp')", backgroundSize:'cover', backgroundPosition:'center', zIndex:1 }} />

      {/* Back & Title */}
      <BackButton style={{ position:'absolute', top:16, left:16, zIndex:5, color:'#fff' }} />
      <h1 style={{ position:'absolute', top:25, left:'50%', transform:'translateX(-50%)', fontFamily:'Tajawal, sans-serif', fontSize:40, color:'#9E9191', zIndex:5 }}>Burn Yourself</h1>

      {/* Quest or Burn Flow */}
      {status === 'idle' && (
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', zIndex:5 }}>
          {isCursed && (
            <div><p>Вы прокляты! До снятия:</p><Countdown date={curseExpiresAt} /></div>
          )}
          <button onClick={startBurn} disabled={isCursed} style={{ marginTop:20, padding:'1rem 2rem', background:'linear-gradient(90deg,#D81E3D,#D81E5F)', color:'#fff', border:'none', borderRadius:40, fontSize:18, cursor:isCursed?'not-allowed':'pointer' }}>BURN 0,5 TON</button>
          {error && <p style={{ color:'tomato' }}>{error}</p>}
        </div>
      )}

      {status === 'awaiting' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', color:'#fff', zIndex:5 }}>
          Ожидание оплаты...
        </div>
      )}

      {status === 'quest' && task && (
        <div style={{ position:'absolute', inset:0, padding:20, zIndex:5, background:'rgba(0,0,0,0.7)', color:'#fff' }}>
          <h2>Мини-квест ({task.rarity.toUpperCase()})</h2>
          <p>{task.params.question}</p>
          {task.params.options.length > 0 ? (
            task.params.options.map(opt => (
              <button key={opt} onClick={() => setAnswer(opt)} style={{ margin:5, padding:'0.5rem 1rem', fontWeight:answer===opt?'bold':'normal' }}>{opt}</button>
            ))
          ) : (
            <input placeholder="Ответ" value={answer} onChange={e=>setAnswer(e.target.value)} style={{ padding:'0.5rem', width:'100%' }} />
          )}
          <div style={{ marginTop:20 }}>
            <button onClick={submitQuest} disabled={!answer} style={{ padding:'0.75rem 1.5rem', background:'#28a745', color:'#fff', border:'none', borderRadius:8 }}>Submit</button>
          </div>
          {error && <p style={{ color:'tomato' }}>{error}</p>}
        </div>
      )}

      {status === 'result' && result && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', color:'#fff', zIndex:5 }}>
          {result.cursed ? (
            <><p>Вас прокляли!</p><Countdown date={result.curse_expires} /></>
          ) : (
            <><p>Поздравляем! Получен фрагмент #{result.newFragment}.</p><button onClick={()=>navigate('/gallery')} style={{ marginTop:20, padding:'0.75rem 1.5rem',background:'#007bff',color:'#fff',border:'none',borderRadius:8 }}>View Gallery</button></>
          )}
        </div>
      )}

      {status === 'error' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', color:'tomato', zIndex:5 }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
