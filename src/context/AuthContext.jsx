// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext({
  user: undefined,          // undefined = инициализация; null = не залогинен; object = залогинен
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const tokenRef = useRef(localStorage.getItem('token') || null);
  const refreshTimerRef = useRef(null);

  const saveSession = useCallback((u, token) => {
    if (token) {
      tokenRef.current = token;
      localStorage.setItem('token', token);
    }
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const login = useCallback((u, token) => {
    saveSession(u, token);
  }, [saveSession]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    tokenRef.current = null;
    setUser(null);
  }, []);

  const refreshUser = useCallback(async ({ silent = true, force = false } = {}) => {
    try {
      if (!tokenRef.current) return;
      // если не знаем tg_id — пробовать нечего
      const tgId = user?.tg_id || (JSON.parse(localStorage.getItem('user') || '{}').tg_id);
      if (!tgId) return;

      const fresh = await API.getPlayer(tgId);
      // только если реально есть изменения — обновим локально
      const prev = user ? JSON.stringify(user) : null;
      const next = JSON.stringify(fresh);
      if (prev !== next || force) {
        saveSession(fresh, tokenRef.current);
      }
    } catch (e) {
      if (!silent) console.warn('[refreshUser] error:', e);
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('invalid token') || msg.includes('forbidden') || msg.includes('unauthorized')) {
        logout();
      }
    }
  }, [user, saveSession, logout]);

  // При первом монтировании: если есть токен — подтянем свежего /player
  useEffect(() => {
    if (tokenRef.current && user?.tg_id) {
      refreshUser({ silent: true, force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Авто-обновление каждые 8 сек, пока есть юзер и вкладка активна
  useEffect(() => {
    if (!user || !tokenRef.current) return;

    const start = () => {
      if (refreshTimerRef.current) return;
      refreshTimerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshUser({ silent: true });
        }
      }, 8000);
    };
    const stop = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    start();
    return () => stop();
  }, [user, refreshUser]);

  // Мгновенный рефреш при возвращении фокуса/видимости
  useEffect(() => {
    const onFocus = () => refreshUser({ silent: true });
    const onVis   = () => document.visibilityState === 'visible' && refreshUser({ silent: true });
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refreshUser]);

  // Синхронизация между вкладками
  useEffect(() => {
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel('ash-session') : null;
    bc?.addEventListener('message', (e) => {
      if (e.data?.type === 'logout') logout();
      if (e.data?.type === 'login' && e.data?.payload) {
        const { user: u, token } = e.data.payload;
        saveSession(u, token);
      }
      if (e.data?.type === 'refresh') refreshUser({ silent: true, force: true });
    });
    return () => bc?.close();
  }, [logout, saveSession, refreshUser]);

  const value = {
    user,
    login: (u, t) => {
      // расшарим другим вкладкам
      try {
        const bc = new BroadcastChannel('ash-session');
        bc.postMessage({ type: 'login', payload: { user: u, token: t } });
        bc.close();
      } catch {}
      login(u, t);
    },
    logout: () => {
      try {
        const bc = new BroadcastChannel('ash-session');
        bc.postMessage({ type: 'logout' });
        bc.close();
      } catch {}
      logout();
    },
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
