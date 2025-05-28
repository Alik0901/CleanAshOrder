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
import { useNavigate } from 'react-router-dom';

export default function Init() {
  const navigate = useNavigate();

  // Telegram-данные
  const [tgExists, setTgExists] = useState(false);
  const [waExists, setWaExists] = useState(false);
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState({});
  const [tgId, setTgId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const raw = wa?.initData || '';
    const unsafe = wa?.initDataUnsafe || {};

    setTgExists(!!tg);
    setWaExists(!!wa);
    setInitDataRaw(raw);
    setInitDataUnsafe(unsafe);

    if (unsafe.user?.id) {
      setTgId(unsafe.user.id.toString());
    }

    if (!tg) {
      setStatusMsg('❌ Telegram не найден');
    } else if (!wa) {
      setStatusMsg('❌ Telegram.WebApp не найден');
    } else if (!raw) {
      setStatusMsg('❌ initData отсутствует');
    } else if (!unsafe.user?.id) {
      setStatusMsg('❌ User ID не найден');
    } else {
      setStatusMsg('✅ Всё готово к регистрации');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMsg('❗ Введите имя');
      return;
    }

    const payload = {
      tg_id: tgId,
      name,
      initData: initDataRaw,
      initDataUnsafe,
    };

    try {
      const res = await fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate('/path');
      } else {
        const err = await res.json();
        setStatusMsg(`⚠️ Ошибка: ${err.error || 'неизвестно'}`);
      }
    } catch (err) {
      setStatusMsg(`⚠️ Сетевая ошибка: ${err.message}`);
    }
  };

  if (!tgExists || !waExists || !initDataRaw || !tgId) {
    return (
      <div style={{
        padding: 20,
        fontFamily: 'Arial, sans-serif',
        color: '#fff',
        backgroundImage: 'url(/bg-init.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 24,
          borderRadius: 8,
          textAlign: 'center',
          maxWidth: 320,
        }}>
          <h2 style={{ marginBottom: 12 }}>Статус инициализации</h2>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 16, lineHeight: 1.5 }}>
            <li>Telegram: {tgExists ? '✅ найден' : '❌ не найден'}</li>
            <li>WebApp: {waExists ? '✅ найден' : '❌ не найден'}</li>
            <li>initData: {initDataRaw ? '✅ получен' : '❌ отсутствует'}</li>
            <li>User ID: {tgId ? `✅ ${tgId}` : '❌ нет'}</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 14 }}>{statusMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundImage: 'url(/bg-init.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 24,
        borderRadius: 8,
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <h1 style={{ margin: 0, fontSize: 24, textAlign: 'center' }}>Enter the Ash</h1>
        <p style={{ margin: '8px 0', fontSize: 14 }}>
          Ваш Telegram ID: <strong>{tgId}</strong>
        </p>
        <label htmlFor="name" style={{ fontSize: 14 }}>Имя для профиля:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Введите имя"
          style={{
            padding: '10px',
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #555',
            backgroundColor: '#222',
            color: '#fff'
          }}
        />
        <button type="submit" style={{
          padding: '12px',
          fontSize: 16,
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: '#f9d342',
          color: '#000',
          fontWeight: 'bold'
        }}>
          Сохранить и продолжить
        </button>
        {statusMsg && (
          <p style={{ margin: 0, fontSize: 14, textAlign: 'center' }}>{statusMsg}</p>
        )}
      </form>
    </div>
  );
}

