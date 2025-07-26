import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // При монтировании проверяем, есть ли токен, и подгружаем профиль
  useEffect(() => {
    if (user?.tg_id && localStorage.getItem('token')) {
      API.getPlayer(user.tg_id).then(data => {
        setUser({ ...data });
        localStorage.setItem('user', JSON.stringify(data));
      }).catch(() => {
        // если токен просрочен — выходим
        logout();
      });
    }
  }, []);

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
