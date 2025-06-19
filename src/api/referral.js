/* src/api/referral.js
   ──────────────────────────────────────────────────────────
   REST-хелперы для получения прогресса и активации награды
   реферальной системы.
*/
const BACKEND =
  import.meta.env.VITE_BACKEND_URL ??
  'https://ash-backend-production.up.railway.app';

/** Получить прогресс приглашений текущего пользователя */
export async function fetchReferral(uid, token) {
  const r = await fetch(`${BACKEND}/api/referral/${uid}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error('referral');
  return r.json();            // { refCode, invitedCount, rewardIssued }
}

/** Активировать («claim») бесплатный фрагмент */
export async function claimReferral(token) {
  const r = await fetch(`${BACKEND}/api/referral/claim`, {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) {
    const j = await r.json();
    throw new Error(j.error || 'claim');
  }
  return r.json();            // { ok:true, fragment:<id> }
}
