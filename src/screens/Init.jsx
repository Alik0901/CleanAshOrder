/* import { useEffect, useState } from 'react';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [debug, setDebug] = useState('');
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState('');
  const [telegramDump, setTelegramDump] = useState('');

  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const initData = wa?.initData || '';
    const initDataUnsafeObj = wa?.initDataUnsafe || {};

    setInitDataRaw(initData || '—');
    setInitDataUnsafe(JSON.stringify(initDataUnsafeObj, null, 2) || '—');

    try {
      const dump = JSON.stringify({
        tgExists: !!tg,
        waExists: !!wa,
        initData: initData,
        initDataUnsafe: initDataUnsafeObj,
        user: initDataUnsafeObj?.user,
      }, null, 2);

      setTelegramDump(dump);
    } catch (e) {
      setTelegramDump('Failed to parse Telegram object');
    }

    if (initDataUnsafeObj?.user?.id) {
      setTgId(initDataUnsafeObj.user.id.toString());
      setDebug('✅ initDataUnsafe.user.id получен');
    } else {
      setDebug('❌ initDataRaw not found or no user ID');
    }
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', color: '#f9d342', backgroundColor: '#0f1218', minHeight: '100vh' }}>
      <h2 style={{ color: '#f9d342' }}>Enter the Ash</h2>
      <p>TG ID: {tgId || '—'}</p>
      <p>Debug: {debug}</p>

      <div style={{ marginTop: 16 }}>
        <p><strong>window.Telegram.WebApp.initData:</strong></p>
        <textarea readOnly value={initDataRaw} style={{ width: '100%', height: 100 }} />

        <p><strong>initDataUnsafe:</strong></p>
        <textarea readOnly value={initDataUnsafe} style={{ width: '100%', height: 100 }} />

        <p><strong>window.Telegram dump:</strong></p>
        <textarea readOnly value={telegramDump} style={{ width: '100%', height: 200 }} />
      </div>
    </div>
  );
}
 */

import { useEffect, useState } from 'react';

export default function Init() {
  const [tgId, setTgId] = useState('');
  const [debug, setDebug] = useState('');
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState('');
  const [telegramDump, setTelegramDump] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const initData = wa?.initData || '';
    const initDataUnsafeObj = wa?.initDataUnsafe || {};

    setInitDataRaw(initData || '—');
    setInitDataUnsafe(JSON.stringify(initDataUnsafeObj, null, 2));

    try {
      const dump = JSON.stringify({
        tgExists: !!tg,
        waExists: !!wa,
        initData,
        initDataUnsafe: initDataUnsafeObj,
        user: initDataUnsafeObj?.user,
      }, null, 2);
      setTelegramDump(dump);
    } catch {
      setTelegramDump('Failed to parse Telegram object');
    }

    if (initDataUnsafeObj?.user?.id) {
      setTgId(initDataUnsafeObj.user.id.toString());
      setDebug('✅ initDataUnsafe.user.id получен');
    } else {
      setDebug('❌ initDataUnsafe.user.id не найден');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus('Введите, пожалуйста, имя');
      return;
    }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tgId, name }),
      });
      if (res.ok) {
        setStatus('Имя успешно сохранено!');
      } else {
        const err = await res.text();
        setStatus(`Ошибка: ${err}`);
      }
    } catch (err) {
      setStatus(`Сетевая ошибка: ${err.message}`);
    }
  };

  // Если tgId ещё не получен — показываем отладку
  if (!tgId) {
    return (
      <div style={{
        padding: 20,
        fontFamily: 'monospace',
        color: '#f9d342',
        backgroundColor: '#0f1218',
        minHeight: '100vh'
      }}>
        <h2>Идёт инициализация...</h2>
        <p>Debug: {debug}</p>
        <pre style={{ color: '#ccc' }}>{telegramDump}</pre>
      </div>
    );
  }

  // Основной UI
  return (
    <div style={{
      padding: 20,
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundImage: 'url(/background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ marginBottom: 20 }}>Enter the Ash</h1>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 20,
        borderRadius: 8,
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <label htmlFor="name" style={{ fontSize: 14 }}>Ваше имя для профиля:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Имя"
          style={{
            padding: '8px',
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #444',
            backgroundColor: '#222',
            color: '#fff'
          }}
        />

        <button type="submit" style={{
          padding: '10px',
          fontSize: 16,
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: '#f9d342',
          color: '#000',
          fontWeight: 'bold'
        }}>
          Отправить
        </button>

        {status && <p style={{ marginTop: 8, fontSize: 14 }}>{status}</p>}
      </form>
    </div>
  );
}

