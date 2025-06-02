// src/screens/Init.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://ash-backend-production.up.railway.app';

const NAME_REGEX = /^[A-Za-z ]+$/;

export default function Init() {
  const navigate = useNavigate();

  // Telegram/WebApp data
  const [tgId, setTgId] = useState('');
  const [initDataRaw, setInitDataRaw] = useState('');
  const [status, setStatus] = useState('Проверяем Telegram…');
  const [checking, setChecking] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const validName = name.trim().length > 0 && NAME_REGEX.test(name);

  // 1) Читаем tgId и initData
  useEffect(() => {
    const tg = window.Telegram;
    const wa = tg?.WebApp;
    const raw = wa?.initData || '';
    const unsafe = wa?.initDataUnsafe || {};

    setInitDataRaw(raw);

    if (!tg) {
      setStatus('❌ Telegram не найден');
      return;
    }
    if (!wa) {
      setStatus('❌ Telegram.WebApp не найден');
      return;
    }
    if (!raw) {
      setStatus('❌ initData отсутствует');
      return;
    }
    if (!unsafe.user?.id) {
      setStatus('❌ User ID не найден');
      return;
    }

    setTgId(String(unsafe.user.id));
  }, []);

  // 2) Как только tgId установлен, попробуем «автоматически» проверить, 
  //    зарегистрирован ли пользователь:
  useEffect(() => {
    if (!tgId) return;

    (async () => {
      setStatus('Проверяем существующего игрока…');
      try {
        // 2.1) Сначала пытаемся получить профиль (GET /api/player/:tg_id)
        const res = await fetch(`${BACKEND_URL}/api/player/${tgId}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          // 2.2) Если профиль найден, сразу запрашиваем POST /api/init,
          //       чтобы получить JWT (имя уже хранится в БД, name-параметр мы передаём пустым)
          const initRes = await fetch(`${BACKEND_URL}/api/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg_id: tgId,
              name: '',         // сервер при существующем профиле не перезапишет имя
              initData: initDataRaw,
            }),
          });
          const initData = await initRes.json();
          if (initRes.ok && initData.token) {
            localStorage.setItem('token', initData.token);
            navigate('/profile');
            return;
          }
        }
        // Если пришёл 404 (или любой не-OK), считаем, что игрок новый
        setStatus('✅ Готов к регистрации');
        setChecking(false);
      } catch {
        // Сетевая ошибка, но всё равно показываем форму
        setStatus('⚠️ Ошибка сети, но вы можете зарегистрироваться');
        setChecking(false);
      }
    })();
  }, [tgId, initDataRaw, navigate]);

  // 3) Обработка отправки формы регистрации
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validName) {
      setStatus('❗ Имя должно содержать только латинские буквы и пробелы');
      return;
    }
    setStatus('⏳ Отправляем данные…');
    try {
      const res = await fetch(`${BACKEND_URL}/api/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: tgId,
          name: name.trim(),
          initData: initDataRaw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`⚠️ ${data.error || 'Неизвестная ошибка'}`);
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/path');
      }
    } catch {
      setStatus('⚠️ Сетевая ошибка');
    }
  };

  // 4) Если идёт проверка, показываем просто статус
  if (checking) {
    return (
      <div style={styles.container}>
        <p style={styles.status}>{status}</p>
      </div>
    );
  }

  // 5) Форма регистрации для нового игрока
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Enter the Ash</h1>
        <p style={styles.info}>
          Ваш Telegram ID: <strong>{tgId}</strong>
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя (A–Z only)"
          style={styles.input}
        />

        <button
          type="submit"
          disabled={!validName}
          style={{
            ...styles.button,
            opacity: validName ? 1 : 0.5,
          }}
        >
          Save and Continue
        </button>

        {status && <p style={styles.status}>{status}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundImage: 'url("/bg-init.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif',
    color: '#f9d342',
  },
  form: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 8,
    width: '90%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: { margin: 0, fontSize: 24, textAlign: 'center' },
  info: { fontSize: 14, textAlign: 'center', margin: '4px 0 12px' },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #555',
    backgroundColor: '#222',
    color: '#fff',
  },
  button: {
    padding: 12,
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#f9d342',
    color: '#000',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  status: { marginTop: 12, fontSize: 14, textAlign: 'center' },
};
