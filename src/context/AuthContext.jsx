// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

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
    // При любом логауте мгновенно уводим на логин
    navigate('/login', { replace: true });
  };

  // 1) init через Telegram WebApp если нет токена
  useEffect(() => {
    const token = localStorage.getItem('token');
    const tg = window.Telegram?.WebApp;
    if (!token && tg) {
      tg.ready();
      const unsafe = tg.initDataUnsafe || {};
      const tgUser = unsafe.user;
      if (tgUser?.id) {
        API.init({
          tg_id: tgUser.id,
          name: tgUser.first_name,
          initData: tg.initData,
          referrer_code: null,
        })
          .then(({ user: freshUser, token: freshToken }) => {
            login(freshUser, freshToken);
          })
          .catch(err => {
            console.warn('Telegram re-init failed:', err.message);
            // не вызываем logout(), чтобы не создавать loop
          });
      }
    }
  }, [navigate]);

  // 2) один раз при монтировании подтягиваем user по токену
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
          if (
            msg.includes('invalid token') ||
            msg.includes('no token provided') ||
            msg.includes('player not found')
          ) {
            // если токен испорчен или игрок удалён — логаутим
            logout();
          }
          // иначе — игнорируем временные сбои
        });
    }
  // navigate и logout в зависимостях, чтобы всегда был актуален
  }, [navigate, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
