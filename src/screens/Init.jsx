import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Init() {
  const [name, setName] = useState('');
  const [tgId, setTgId] = useState('');
  const [debug, setDebug] = useState('waiting...');
  const [raw, setRaw] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const initDataRaw = wa?.initDataRaw || '';
    const initDataUnsafe = wa?.initDataUnsafe || {};

    setRaw(initDataRaw);

    if (!initDataRaw) {
      setDebug('No initDataRaw found');
      return;
    }

    fetch(`${API_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: initDataRaw }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setTgId(data.user.id.toString());
          setDebug('✅ Valid');
        } else {
          setDebug(`❌ ${data.error || 'Validation failed'}`);
        }
      })
      .catch(err => {
        setDebug('❌ Network error');
        console.error(err);
      });
  }, []);

  const handleSubmit = async () => {
    if (!tgId || !name.trim()) return;
    const res = await fetch(`${API_URL}/api/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_id: tgId, name: name.trim() }),
    });
    const data = await res.json();
    if (res.ok) navigate('/path');
    else alert(data.error || 'Something went wrong');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', color: '#d4af37' }}>
      <h2>Enter the Ash</h2>
      <p>TG ID: {tgId || '—'}</p>
      <p>Debug: {debug}</p>
      <textarea value={raw} readOnly style={{ width: '100%', height: 100 }} />
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginTop: 16, width: '100%', padding: 8 }}
      />
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !tgId}
        style={{
          marginTop: 12,
          padding: 10,
          backgroundColor: '#d4af37',
          color: '#000',
          border: 'none',
          width: '100%',
        }}
      >
        Enter the Ash
      </button>
    </div>
  );
}
