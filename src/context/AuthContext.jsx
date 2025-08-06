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

  // При первом монтировании проверяем, есть ли токен + сохранённый user, и разово подтягиваем данные
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
          // логаут только если токен реально невалиден или отсутствует
          if (msg.includes('invalid token') || msg.includes('no token provided')) {
            logout();
          }
          // иначе—игнорируем временные ошибки
        });
    }
  }, []); // пустой массив зависимостей → выполняется один раз

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
