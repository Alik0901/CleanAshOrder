// src/components/Timer.jsx
import React, { useState, useEffect } from 'react';

/**
 * Отображает часы:минуты:секунды от переданного количества миллисекунд.
 * Пересчитывает каждую секунду.
 */
export default function Timer({ msLeft, onExpire }) {
  const [remaining, setRemaining] = useState(msLeft);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(id);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const format = ms => {
    const totalSec = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return <span className="font-mono">{format(remaining)}</span>;
}
