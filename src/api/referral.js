const BACKEND = import.meta.env.VITE_BACKEND_URL
              ?? 'https://ash-backend-production.up.railway.app';

/**
 * Получить сводку по рефералам
 * @param {string} token — JWT
 */
export async function fetchReferral(token) {
  if (!token) throw new Error('Не задан токен авторизации');
  const res  = await fetch(`${BACKEND}/api/referral`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(body.error || `Ошибка ${res.status}`);
  return {
    refCode:      body.refCode ?? null,
    invitedCount: body.invitedCount ?? 0,
    rewardIssued: body.rewardIssued ?? false
  };
}

/**
 * Забрать бесплатный фрагмент
 * @param {string} token — JWT
 */
export async function claimReferral(token) {
  if (!token) throw new Error('Не задан токен авторизации');
  const res  = await fetch(`${BACKEND}/api/referral/claim`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(body.error || `Ошибка ${res.status}`);
  return {
    ok:       body.ok === true,
    fragment: body.fragment ?? null
  };
}
