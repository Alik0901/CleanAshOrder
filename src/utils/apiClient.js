// src/utils/apiClient.js

const BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://clean-ash-order.vercel.app'
).replace(/\/+$/, '');

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const err = data.error || response.statusText;
    throw new Error(err);
  }
  return data;
}

const API = {
  init: async ({ tg_id, name, initData, referrer_code }) => {
    const res = await fetch(`${BASE}/api/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_id, name, initData, referrer_code }),
    });
    return handleResponse(res);
  },

  getPlayer: async (tgId) => {
    const res = await fetch(`${BASE}/api/player/${tgId}`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  getFragments: async (tgId) => {
    const res = await fetch(`${BASE}/api/fragments/${tgId}`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  getSignedFragmentUrls: async () => {
    const res = await fetch(`${BASE}/api/fragments/urls`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  createBurn: async (tgId, amount_nano = 500_000_000) => {
    const res = await fetch(`${BASE}/api/burn-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ tg_id: tgId, amount_nano }),
    });
    return handleResponse(res);
  },

  getBurnStatus: async (invoiceId) => {
    const res = await fetch(`${BASE}/api/burn-status/${invoiceId}`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  getReferral: async () => {
    const res = await fetch(`${BASE}/api/referral`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  claimReferral: async () => {
    const res = await fetch(`${BASE}/api/referral/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    return handleResponse(res);
  },

  validateFinal: async (phrase) => {
    const res = await fetch(`${BASE}/api/validate-final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ phrase }),
    });
    return handleResponse(res);
  },

  getFinal: async (tgId) => {
    const res = await fetch(`${BASE}/api/final/${tgId}`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${BASE}/api/stats/total_users`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  deletePlayer: async (tgId) => {
    const res = await fetch(`${BASE}/api/player/${tgId}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  // Дополнительные эндпоинты, если нужны:
  getLeaderboard: async () => {
    const res = await fetch(`${BASE}/api/leaderboard`, { headers: authHeader() });
    return handleResponse(res);
  },

  getDailyQuest: async () => {
    const res = await fetch(`${BASE}/api/daily-quest`, { headers: authHeader() });
    return handleResponse(res);
  },

  claimDailyQuest: async () => {
    const res = await fetch(`${BASE}/api/daily-quest/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    return handleResponse(res);
  },

  getUserStats: async (tgId) => {
    const res = await fetch(`${BASE}/api/stats/${tgId}`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },
};

export default API;
