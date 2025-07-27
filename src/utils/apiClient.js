// src/utils/apiClient.js

const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API = {
  init: body =>
    fetch(`${BASE}/api/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(res => res.json()),

  getPlayer: tgId =>
    fetch(`${BASE}/api/player/${tgId}`, {
      headers: authHeader(),
    }).then(res => res.json()),

  getPresigned: () =>
    fetch(`${BASE}/api/fragments/urls`, {
      headers: authHeader(),
    }).then(res => res.json()),

  getFragments: tgId =>
    fetch(`${BASE}/api/fragments/${tgId}`, {
      headers: authHeader(),
    }).then(res => res.json()),

  createBurn: tgId =>
    fetch(`${BASE}/api/burn-invoice`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_id: tgId }),
    }).then(res => res.json()),

  getBurnStatus: id =>
    fetch(`${BASE}/api/burn-status/${id}`, {
      headers: authHeader(),
    }).then(res => res.json()),

  getReferral: () =>
    fetch(`${BASE}/api/referral`, {
      headers: authHeader(),
    }).then(res => res.json()),

  claimReferral: () =>
    fetch(`${BASE}/api/referral/claim`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    }).then(res => res.json()),

  validateFinal: phrase =>
    fetch(`${BASE}/api/validate-final`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase }),
    }).then(res => res.json()),

  getFinal: tgId =>
    fetch(`${BASE}/api/final/${tgId}`, {
      headers: authHeader(),
    }).then(res => res.json()),

  getStats: () =>
    fetch(`${BASE}/api/stats/total_users`, {
      headers: authHeader(),
    }).then(res => res.json()),

  deletePlayer: tgId =>
    fetch(`${BASE}/api/player/${tgId}`, {
      method: 'DELETE',
      headers: authHeader(),
    }).then(res => res.json()),
};

export default API;
