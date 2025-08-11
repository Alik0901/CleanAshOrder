// src/context/AuthContext.jsx
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import API from '../utils/apiClient';

export const AuthContext = createContext({
  user: undefined,
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

  const tokenRef           = useRef(localStorage.getItem('token') || null);
  const refreshTimerRef    = useRef(null);
  const refreshInFlightRef = useRef(false);
  const lastRefreshedRef   = useRef(0);
  const initRunRef         = useRef(false);

  const MIN_REFRESH_GAP = 10000; // 10s, а таймер тикает раз в 12s

  // ── Singleton guard (на случай двойного монтирования) ────────────────
  const globalKey = '__ASH_AUTH_SINGLETON__';
  const singleton = (window[globalKey] ||= {
    timer: null,
    listeners: false,
  });

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

      // Троттлинг и дедуп
      const now = Date.now();
      if (!force && now - lastRefreshedRef.current < MIN_REFRESH_GAP) return;
      if (refreshInFlightRef.current) return;

      const stored = localStorage.getItem('user');
      const tgId = user?.tg_id || (stored ? JSON.parse(stored).tg_id : undefined);
      if (!tgId) return;

      refreshInFlightRef.current = true;
      lastRefreshedRef.current = now;

      const fresh = await API.getPlayer(tgId);

      const prev = user ? JSON.stringify(user) : null;
      const next = JSON.stringify(fresh);
      if (prev !== next || force) {
        saveSession(fresh, tokenRef.current);
      }
    } catch (e) {
      if (!silent) console.warn('[refreshUser] error:', e);
      const msg = String(e?.message || '').toLowerCase();
      if (
        msg.includes('invalid token') ||
        msg.includes('forbidden') ||
        msg.includes('unauthorized') ||
        msg.includes('not found')
      ) {
        doLogout();
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [user, saveSession, doLogout]);

  // Первый подтяг /player, строго один раз
  useEffect(() => {
    if (initRunRef.current) return;
    initRunRef.current = true;

    if (tokenRef.current) {
      const stored = localStorage.getItem('user');
      if (stored) {
        refreshUser({ silent: true, force: true });
      } else {
        // нет user в storage — считаем как не залогинен
        setUser(null);
      }
    } else {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Фоновый таймер — один на приложение
  useEffect(() => {
    if (!user || !tokenRef.current) return;

    const start = () => {
      if (singleton.timer) return;
      singleton.timer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshUser({ silent: true });
        }
      }, 12000);
    };
    const stop = () => {
      if (singleton.timer) {
        clearInterval(singleton.timer);
        singleton.timer = null;
      }
    };

    start();
    return () => stop();
  }, [user, refreshUser, singleton]);

  // Дебаунс focus/visibility, навешиваем слушатели один раз глобально
  useEffect(() => {
    if (singleton.listeners) return;
    singleton.listeners = true;

    let visDebounce = null;
    let focDebounce = null;

    const onFocus = () => {
      clearTimeout(focDebounce);
      focDebounce = setTimeout(() => refreshUser({ silent: true }), 300);
    };
    const onVis = () => {
      clearTimeout(visDebounce);
      visDebounce = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          refreshUser({ silent: true });
        }
      }, 300);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(visDebounce);
      clearTimeout(focDebounce);
      singleton.listeners = false;
    };
  }, [refreshUser, singleton]);

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

export default AuthProvider;
export { AuthProvider };
