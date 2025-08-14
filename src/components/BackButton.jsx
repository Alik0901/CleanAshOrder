// src/components/BackButton.jsx
import { useEffect } from 'react';

export default function BackButton() {
  // на всякий случай прячем и здесь
  useEffect(() => {
    try {
      const tg = window?.Telegram?.WebApp;
      tg?.BackButton?.hide();
    } catch {}
  }, []);
  return null; // ничего не рисуем
}

