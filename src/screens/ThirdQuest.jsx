import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import API from '../utils/apiClient';
import { AuthContext } from '../context/AuthContext';

export default function ThirdQuest() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.getThirdQuest();
        if (!mounted) return;
        if (!res.available) {
          // уже получен #3 — уводим в галерею
          navigate('/gallery', { replace: true });
          return;
        }
        setTask(res.task);
      } catch (e) {
        setError(e.message || 'Failed to load quest');
        if (String(e.message).toLowerCase().includes('invalid token')) {
          logout();
          navigate('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [logout, navigate]);

  const submit = async () => {
    if (!task) return;
    if (!selected) {
      setError('Choose the answer');
      return;
    }
    setError('');
    try {
      const resp = await API.claimThirdQuest(selected);
      if (resp.ok) {
        // получили фрагмент #3
        navigate('/gallery', { replace: true });
      } else {
        setError('Wrong answer');
      }
    } catch (e) {
      setError(e.message || 'Failed to submit');
    }
  };

  if (loading) {
    return (
      <div style={{
        position:'relative', width:'100%', height:'100vh', background:'#000',
        color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden' }}>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:"url('/images/bg-final.webp')",
        backgroundSize:'cover', backgroundPosition:'center'
      }}/>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.56)' }}/>

      <BackButton
        style={{ position:'absolute', top:16, left:16, zIndex:5, color:'#fff' }}
      />

      <h1 style={{
        position:'absolute', top:25, left:'50%', transform:'translateX(-50%)',
        fontFamily:'Tajawal, sans-serif', fontWeight:700, fontSize:40, lineHeight:'48px',
        color:'#D6CEBD', zIndex:5, whiteSpace:'nowrap'
      }}>
        Third Fragment Quest
      </h1>

      <div style={{
        position:'absolute', top:120, left:'50%', transform:'translateX(-50%)',
        width:320, background:'rgba(0,0,0,0.6)', border:'1px solid #9E9191',
        color:'#fff', borderRadius:16, padding:'16px', zIndex:5
      }}>
        {task && (
          <>
            <p style={{ margin:'0 0 12px', fontFamily:'Tajawal, sans-serif', fontWeight:700 }}>
              {task.question}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {Array.isArray(task.options) && task.options.map(opt => (
                <label key={opt} style={{
                  display:'flex', alignItems:'center', gap:8, cursor:'pointer'
                }}>
                  <input
                    type="radio"
                    name="third-q"
                    value={opt}
                    checked={selected === opt}
                    onChange={() => setSelected(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {error && (
              <div style={{ color:'tomato', marginTop:10 }}>{error}</div>
            )}

            <button
              onClick={submit}
              style={{
                marginTop:16, width:'100%', height:40,
                background:'linear-gradient(90deg,#D81E3D 0%, #D81E5F 100%)',
                border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:'pointer'
              }}
            >
              Claim Fragment #3
            </button>
          </>
        )}
      </div>
    </div>
  );
}
