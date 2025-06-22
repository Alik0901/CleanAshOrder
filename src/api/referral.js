// src/api/referral.js
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам
 * @param {string|number} uid  — Telegram ID игрока
 * @param {string} token      — JWT из localStorage
 */
export async function fetchReferral(uid, token) {
  const res = await fetch(`${BACKEND}/api/referral/${uid}`, {
    headers: {
      'Content-Type': 'application/json',
      // если токена нет — передаём пустую строку, так не будет `undefined`
      Authorization: token ? `Bearer ${token}` : ''
    }
  });

  if (!res.ok) {
    // попробуем достать текст ошибки из JSON
    let errText = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errText = body.error || errText;
    } catch { /* игнор */ }
    throw new Error(`Не удалось загрузить рефералку: ${errText}`);
  }

  return res.json(); // { refCode, invitedCount, rewardIssued }
}

/**
 * Запрос на получение бесплатного фрагмента
 * @param {string} token — JWT из localStorage
 */
export async function claimReferral(token) {
  const res = await fetch(`${BACKEND}/api/referral/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    }
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Ошибка claimReferral: HTTP ${res.status}`);
  }

  return body; // { ok: true, fragment: число }
}
