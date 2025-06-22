const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам (берётся tg_id из JWT)
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{refCode: string|null, invitedCount: number, rewardIssued: boolean}>}
 */
export async function fetchReferral(token) {
  const res = await fetch(`${BACKEND}/api/referral`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    }
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

/**
 * Запрос на получение бесплатного фрагмента
 * @param {string} token — JWT из localStorage
 * @returns {Promise<{ok: boolean, fragment: number|null}>}
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
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}
