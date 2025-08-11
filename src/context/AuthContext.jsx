// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext({
  user: undefined,          // undefined = инициализация; null = не залогинен; object = залогинен
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

function AuthProvider({ children }) {
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

  const doLogin = useCallback((u, token) => {
    saveSession(u, token);
  }, [saveSession]);

  const doLogout = useCallback(() => {
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
      const tgId = user?.tg_id || (JSON.parse(localStorage.getItem('user') || '{}').tg_id);
      if (!tgId) return;

      const fresh = await API.getPlayer(tgId);
      const prev = user ? JSON.stringify(user) : null;
      const next = JSON.stringify(fresh);
      if (prev !== next || force) {
        saveSession(fresh, tokenRef.current);
      }
    } catch (e) {
      if (!silent) console.warn('[refreshUser] error:', e);
      const msg = String(e?.message || '').toLowerCase();

      // 🔴 КЛЮЧЕВОЕ: если игрок удалён -> /player/:tg_id вернёт 404 {error:"not found"}
      // в этом случае сразу выходим из сессии, чтобы показать /login
      if (
        msg.includes('invalid token') ||
        msg.includes('forbidden') ||
        msg.includes('unauthorized') ||
        msg.includes('not found')
      ) {
        doLogout();
        return;
      }

      // На всякий случай: при любой другой фатальной ошибке, где сессия невалидна,
      // тоже выходим (можешь убрать, если не нужно)
      if (!silent) doLogout();
    }
  }, [user, saveSession, doLogout]);

  // Инициализация: если есть токен и tg_id — подтягиваем свежего юзера
  useEffect(() => {
    if (tokenRef.current && (user?.tg_id || localStorage.getItem('user'))) {
      refreshUser({ silent: true, force: true });
    } else if (!tokenRef.current) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Авто-рефреш каждые 8 сек при активной вкладке
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

  // Мгновенный рефреш при возврате фокуса/видимости
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
      if (e.data?.type === 'logout') doLogout();
      if (e.data?.type === 'login' && e.data?.payload) {
        const { user: u, token } = e.data.payload;
        saveSession(u, token);
      }
      if (e.data?.type === 'refresh') refreshUser({ silent: true, force: true });
    });
    return () => bc?.close();
  }, [doLogout, saveSession, refreshUser]);

  const value = {
    user,
    login: (u, t) => {
      try {
        const bc = new BroadcastChannel('ash-session');
        bc.postMessage({ type: 'login', payload: { user: u, token: t } });
        bc.close();
      } catch {}
      doLogin(u, t);
    },
    logout: () => {
      try {
        const bc = new BroadcastChannel('ash-session');
        bc.postMessage({ type: 'logout' });
        bc.close();
      } catch {}
      doLogout();
    },
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider as default, AuthProvider };
