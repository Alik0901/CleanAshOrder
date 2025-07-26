// src/utils/apiClient.js

export async function getReferral() {
  const res = await fetch('/api/referral');
  if (!res.ok) throw new Error('Failed to fetch referral info');
  return res.json(); // { ref_code, invitedCount, referral_reward_issued }
}

export async function claimReferral() {
  const res = await fetch('/api/referral/claim', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to claim referral reward');
  return res.json();
}

export async function getLeaderboard(scope = 'global') {
  const res = await fetch(`/api/leaderboard?scope=${scope}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json(); // пример: [{ tg_id: '123', name: 'Alice', fragmentsCount: 5 }, ...]
}

export async function getFinalWindow() {
  const res = await fetch('/api/final-window');
  if (!res.ok) throw new Error('Failed to load final window');
  return res.json(); 
  // должно вернуть { msLeft: number, canSubmit: boolean }
}

export async function submitFinalPhrase(phrase) {
  const res = await fetch('/api/validate-final', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase }),
  });
  if (!res.ok) throw new Error('Failed to submit phrase');
  const { success } = await res.json(); // { success: true/false }
  return success;
}