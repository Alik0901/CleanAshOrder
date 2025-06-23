// src/api/referral.js

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам (tg_id — из JWT).
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{ refCode: string|null, invitedCount: number, rewardIssued: boolean }>}
 */
export async function fetchReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral`, {
    method:  'GET',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Невалидный JSON: HTTP ${res.status}`);
  }

  if (!res.ok) {
    // если сервер прислал { error: '...' }
    throw new Error(data.error || `Ошибка ${res.status}`);
  }

  return {
    refCode:      data.refCode      ?? null,
    invitedCount: data.invitedCount ?? 0,
    rewardIssued: data.rewardIssued ?? false
  };
}

/**
 * Запрос на получение бесплатного фрагмента по рефералке.
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{ ok: true, fragment: number|null }>}
 */
export async function claimReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral/claim`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Невалидный JSON: HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }

  // data = { ok: true, fragment: <number|null> }
  return {
    ok:       data.ok === true,
    fragment: data.fragment ?? null
  };
}
