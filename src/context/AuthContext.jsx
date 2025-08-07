// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext({
  user: undefined,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

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

  // 1) При старте приложения проверяем токен + существование пользователя
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    const initUser = saved ? JSON.parse(saved) : null;

    if (!token || !initUser?.tg_id) {
      // если нет токена или user в localStorage — сразу переходим в состояние «неавторизован»
      setUser(null);
      return;
    }

    API.getPlayer(initUser.tg_id)
      .then(data => {
        // игрок найден — обновляем контекст
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      })
      .catch(err => {
        // 401 или «player not found» → разлогиниваем
        const msg = (err.message||'').toLowerCase();
        if (/invalid token|no token provided|player not found/.test(msg)) {
          logout();
        } else {
          // временная сетевая ошибка — всё равно показываем Login, можно перезагрузить
          setUser(null);
        }
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
