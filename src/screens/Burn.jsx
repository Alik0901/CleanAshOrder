import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/apiClient';
import Countdown from 'react-countdown';

export default function Burn() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle, awaiting, inQuest, completed, error
  const [invoiceId, setInvoiceId] = useState(null);
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Check curse
  const isCursed = user.is_cursed && new Date(user.curse_expires) > new Date();

  const startBurn = async () => {
    if (isCursed) return;
    setError('');
    setStatus('awaiting');
    try {
      const { invoiceId, paymentUrl, task } = await API.createBurn(user.tg_id);
      setInvoiceId(invoiceId);
      setTask(task);
      window.open(paymentUrl, '_blank');
    } catch (e) {
      setError(e.message || 'Ошибка создания счёта');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status !== 'awaiting' || !invoiceId) return;
    const timer = setInterval(async () => {
      try {
        const res = await API.getBurnStatus(invoiceId);
        if (res.paid && res.inQuest) {
          clearInterval(timer);
          setStatus('inQuest');
          setTask(res.task);
        }
      } catch (e) {
        clearInterval(timer);
        setError('Ошибка проверки оплаты');
        setStatus('error');
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, invoiceId]);

  const submitAnswer = async () => {
    setError('');
    try {
      const correct = answer.trim() === task.params.answer;
      const res = await API.completeBurn(invoiceId, correct);
      if (!res.success) {
        setError('Неправильный ответ, попробуйте ещё раз.');
      } else {
        setResult(res);
        setStatus('completed');
      }
    } catch (e) {
      setError('Ошибка завершения квеста');
      setStatus('error');
    }
  };

  // Overlay
  const renderOverlay = () => {
    if (status === 'awaiting') {
      return (
        <div style={overlayStyle}>
          <span style={overlayText}>Waiting for payment...</span>
        </div>
      );
    }
    if (status === 'inQuest') {
      return (
        <div style={overlayStyle}>
          <h2 style={overlayTitle}>Mini-Quest ({task.rarity})</h2>
          <p style={overlayText}>{task.params.question}</p>
          <div style={{ margin: '1rem 0' }}>
            {task.params.options.length ? (
              task.params.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setAnswer(opt)}
                  style={answer === opt ? optionSelectedStyle : optionStyle}
                >{opt}</button>
              ))
            ) : (
              <input
                style={inputStyle}
                placeholder="Ваш ответ"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
            )}
          </div>
          <button
            onClick={submitAnswer}
            disabled={!answer}
            style={buttonOverlayStyle}
          >Submit</button>
          {error && <p style={errorStyle}>{error}</p>}
        </div>
      );
    }
    if (status === 'completed') {
      return (
        <div style={overlayStyle}>
          {result.cursed ? (
            <>
              <p style={overlayText}>You are cursed! Expires in:</p>
              <Countdown date={new Date(result.curse_expires)} />
            </>
          ) : (
            <>
              <p style={overlayText}>Congratulations! Fragment #{result.newFragment} received.</p>
              <button
                onClick={() => navigate('/gallery')}
                style={buttonOverlayStyle}
              >Go to Gallery</button>
            </>
          )}
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div style={overlayStyle}>
          <p style={errorStyle}>{error}</p>
        </div>
      );
    }
    return null;
  };

  // Styles
  const overlayStyle = {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
  };
  const overlayText = { fontSize: '1.25rem', margin: '0.5rem 0' };
  const overlayTitle = { fontSize: '2rem', marginBottom: '1rem' };
  const optionStyle = { margin: '0.5rem', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer' };
  const optionSelectedStyle = { ...optionStyle, fontWeight: 'bold', backgroundColor: '#444' };
  const inputStyle = { padding: '0.5rem', fontSize: '1rem', width: '80%' };
  const buttonOverlayStyle = { marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: 20, border: 'none', cursor: 'pointer', background: '#28a745', color: '#fff' };
  const errorStyle = { color: 'tomato', marginTop: '0.5rem' };

  return (
    <div
      style={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden' }}
    >
      {/* Checker */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"url('/images/Checker.webp')", backgroundSize:'cover', backgroundPosition:'center', zIndex:0 }} />
      {/* Burn bg */}
      <div style={{ position:'absolute', inset:0, backgroundImage:"linear-gradient(0deg,rgba(0,0,0,0.56),rgba(0,0,0,0.56)),url('/images/bg-burn.webp')", backgroundSize:'cover', backgroundPosition:'center', zIndex:1 }} />
      {/* Nav & Title */}
      <BackButton style={{ position:'absolute', top:16,left:16,zIndex:5,color:'#fff' }} />
      <h1 style={{ position:'absolute', top:25, left:'50%', transform:'translateX(-50%)', fontFamily:'Tajawal,sans-serif', fontSize:40, color:'#9E9191', zIndex:5 }}>Burn Yourself</h1>
      {/* Burn button */}
      <button
        onClick={startBurn}
        disabled={status!=='idle' || isCursed}
        style={{ position:'absolute', left:65, top:480, width:265, height:76, background:'linear-gradient(90deg,#D81E3D,#D81E5F)', border:'none', borderRadius:40, color:'#fff', fontSize:24, cursor:'pointer', zIndex:5 }}
      >BURN 0.5 TON</button>
      {isCursed && <p style={{ position:'absolute', left:65, top:580, color:'tomato', zIndex:5 }}>Cursed! Wait for expiration.</p>}
      {/* Rarity legend omitted for brevity */}
      {renderOverlay()}
    </div>
  );
}
