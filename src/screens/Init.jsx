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

// src/Init.jsx
// src/Init.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Если окружение не поставлено, используется ваш Railway URL
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

export default function Init() {
  const navigate = useNavigate();

  // Telegram WebApp state
  const [tgExists, setTgExists] = useState(false);
  const [waExists, setWaExists] = useState(false);
  const [initDataRaw, setInitDataRaw] = useState('');
  const [initDataUnsafe, setInitDataUnsafe] = useState({});
  const [tgId, setTgId] = useState('');
  const [name, setName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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
      setTgId(String(unsafe.user.id));
      setStatusMsg('✅ Всё готово к регистрации');
    } else if (!tg) {
      setStatusMsg('❌ Telegram не найден');
    } else if (!wa) {
      setStatusMsg('❌ Telegram.WebApp не найден');
    } else if (!raw) {
      setStatusMsg('❌ initData отсутствует');
    } else {
      setStatusMsg('❌ User ID не найден');
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
      const res = await fetch(`${BACKEND_URL}/api/init`, {
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

  // Если WebApp не готов — показываем только статус
  if (!tgExists || !waExists || !initDataRaw || !tgId) {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.overlayBox}>
          <h2 style={styles.title}>Статус инициализации</h2>
          <ul style={styles.statusList}>
            <li>Telegram: {tgExists ? '✅ найден' : '❌ не найден'}</li>
            <li>WebApp: {waExists ? '✅ найден' : '❌ не найден'}</li>
            <li>initData: {initDataRaw ? '✅ получен' : '❌ отсутствует'}</li>
            <li>User ID: {tgId ? `✅ ${tgId}` : '❌ нет'}</li>
          </ul>
          <p style={styles.statusMsg}>{statusMsg}</p>
        </div>
      </div>
    );
  }

  // Экран ввода имени
  return (
    <div style={styles.fullscreen}>
      <form onSubmit={handleSubmit} style={styles.formBox}>
        <h1 style={styles.header}>Enter the Ash</h1>
        <p style={styles.telegramId}>
          Ваш Telegram ID: <strong>{tgId}</strong>
        </p>
        <label htmlFor="name" style={styles.label}>
          Имя для профиля:
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введите имя"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Сохранить и продолжить
        </button>
        {statusMsg && <p style={styles.statusMsg}>{statusMsg}</p>}
      </form>
    </div>
  );
}

const styles = {
  fullscreen: {
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
  },
  overlayBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 8,
    textAlign: 'center',
    maxWidth: 320,
  },
  title: { marginBottom: 12 },
  statusList: { listStyle: 'none', padding: 0, fontSize: 16, lineHeight: 1.5 },
  statusMsg: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  formBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: { margin: 0, fontSize: 24, textAlign: 'center' },
  telegramId: { margin: '8px 0', fontSize: 14 },
  label: { fontSize: 14 },
  input: {
    padding: '10px',
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #555',
    backgroundColor: '#222',
    color: '#fff',
  },
  button: {
    padding: '12px',
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#f9d342',
    color: '#000',
    fontWeight: 'bold',
  },
};

