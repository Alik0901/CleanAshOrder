// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 1) Если нет токена, но мы в Telegram WebApp — пробуем инициализироваться
  useEffect(() => {
    const token = localStorage.getItem('token');
    const tg = window.Telegram?.WebApp;
    if (!token && tg) {
      // Ждём, пока WebApp будет готов
      tg.ready();
      // Берём «unsafe» данные, где лежит user
      const initUnsafe = tg.initDataUnsafe || {};
      const tgUser = initUnsafe.user;
      // Только если нашли Telegram-юзера
      if (tgUser?.id) {
        API.init({
          tg_id: tgUser.id,
          name: tgUser.first_name,
          initData: tg.initData,        // туда же можно передать initDataUnsafe
          referrer_code: null,
        })
          .then(({ user: freshUser, token: freshToken }) => {
            login(freshUser, freshToken);
          })
          .catch(err => {
            console.warn('Telegram re-init failed:', err.message);
            // не делаем logout — оставляем гостевой режим
          });
      }
    }
  }, []);

  // 2) Один раз при старте, если токен есть, подтягиваем актуальный user
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    const initUser = saved ? JSON.parse(saved) : null;

    if (token && initUser?.tg_id) {
      API.getPlayer(initUser.tg_id)
        .then(data => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(e => {
          const msg = (e.message || '').toLowerCase();
          // логаутим и показываем логин, если токен устарел или игрок пропал из БД
         if (
           msg.includes('invalid token') ||
           msg.includes('no token provided') ||
           msg.includes('player not found')
         ) {
            logout();
           // при желании — перенаправить на /login
           // navigate('/login');
           }
          // иначе — игнорируем временные ошибки
        });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
