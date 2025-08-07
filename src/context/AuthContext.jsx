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

  // 1) При монтировании: если в localStorage нет токена, но мы в Telegram WebApp —
  //    инициализируемся заново через /api/init
  useEffect(() => {
    const token = localStorage.getItem('token');
    // WebApp-инстанс
    const tg = window.Telegram?.WebApp;
    if (!token && tg) {
      const { user: tgUser, initDataUnsafe } = tg;
      API.init({
        tg_id: tgUser.id,
        name: tgUser.first_name,
        initData: initDataUnsafe,
        referrer_code: null,
      })
        .then(({ user: freshUser, token: freshToken }) => {
          login(freshUser, freshToken);
        })
        .catch(err => {
          console.warn('Telegram re-init failed:', err.message);
          // здесь не делаем logout — просто оставляем гостевой режим
        });
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
          if (msg.includes('invalid token') || msg.includes('no token provided')) {
            // при реально устаревшем токене — сбрасываем
            logout();
          }
          // при сетевых/других ошибках — ничего не делаем
        });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
