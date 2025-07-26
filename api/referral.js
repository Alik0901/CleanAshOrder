// src/api/referral.js

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам
 * (refCode, сколько приглашено, выдан ли reward)
 */
export async function fetchReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral`, {
    method: 'GET',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return {
    refCode:      body.refCode      ?? null,
    invitedCount: body.invitedCount ?? 0,
    rewardIssued: body.rewardIssued ?? false
  };
}

/**
 * Запрос на получение бесплатного фрагмента
 * (POST /api/referral/claim с пустым JSON)
 */
export async function claimReferral(token) {
  if (!token) {
    throw new Error('Не задан токен авторизации');
  }

  const res = await fetch(`${BACKEND}/api/referral/claim`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({})
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return {
    ok:       body.ok === true,
    fragment: body.fragment ?? null
  };
}
