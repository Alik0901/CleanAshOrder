// src/api/referral.js

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам (tg_id определяется из JWT)
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{ refCode: string|null, invitedCount: number, rewardIssued: boolean }>}
 */
export async function fetchReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Ошибка разбора ответа: HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(body.error || `Ошибка ${res.status}`);
  }

  return {
    refCode: body.refCode ?? null,
    invitedCount: body.invitedCount ?? 0,
    rewardIssued: body.rewardIssued ?? false
  };
}

/**
 * Запрос на получение бесплатного фрагмента
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{ ok: boolean, fragment: number|null }>}
 */
export async function claimReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral/claim`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Ошибка разбора ответа: HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(body.error || `Ошибка ${res.status}`);
  }

  return {
    ok: body.ok === true,
    fragment: body.fragment ?? null
  };
}
