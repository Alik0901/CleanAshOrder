// src/utils/apiClient.js

const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '';

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
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  getPresigned: async () => {
    const res = await fetch(`${BASE}/api/fragments/urls`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  getFragments: async (tgId) => {
    const res = await fetch(`${BASE}/api/fragments/${tgId}`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  getSignedFragmentUrls: async () => {
    const res = await fetch(`${BASE}/api/fragments/urls`, {
      headers: authHeader(),
    });
    return handleResponse(res); // ожидаем { signedUrls: { [name]: url } }
  },

  createBurn: async (tgId) => {
    const res = await fetch(`${BASE}/api/burn-invoice`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_id: tgId }),
    });
    return handleResponse(res);
  },

  getBurnStatus: async (invoiceId) => {
    const res = await fetch(`${BASE}/api/burn-status/${invoiceId}`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  getReferral: async () => {
    const res = await fetch(`${BASE}/api/referral`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  claimReferral: async () => {
    const res = await fetch(`${BASE}/api/referral/claim`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  validateFinal: async (phrase) => {
    const res = await fetch(`${BASE}/api/validate-final`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase }),
    });
    return handleResponse(res);
  },

  getFinal: async (tgId) => {
    const res = await fetch(`${BASE}/api/final/${tgId}`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${BASE}/api/stats/total_users`, {
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },

  deletePlayer: async (tgId) => {
    const res = await fetch(`${BASE}/api/player/${tgId}`, {
      method: 'DELETE',
      headers: { ...authHeader() },
    });
    return handleResponse(res);
  },
};

export default API;
