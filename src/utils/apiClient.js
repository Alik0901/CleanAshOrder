// src/utils/apiClient.js

// Подхватывает токен из localStorage
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const API = {
  init:          body => fetch('/api/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  }).then(r => r.json()),

  getPlayer:     tgId => fetch(`/api/player/${tgId}`, {
                    headers: authHeader()
                  }).then(r => r.json()),

  getPresigned:  ()   => fetch('/api/fragments/urls', {
                    headers: authHeader()
                  }).then(r => r.json()),

  getFragments:  tgId => fetch(`/api/fragments/${tgId}`, {
                    headers: authHeader()
                  }).then(r => r.json()),

  createBurn:    tgId => fetch('/api/burn-invoice', {
                    method: 'POST',
                    headers: { ...authHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tg_id: tgId })
                  }).then(r => r.json()),

  getBurnStatus: id   => fetch(`/api/burn-status/${id}`)
                    .then(r => r.json()),

  getReferral:   ()   => fetch('/api/referral', {
                    headers: authHeader()
                  }).then(r => r.json()),

  claimReferral: ()   => fetch('/api/referral/claim', {
                    method: 'POST',
                    headers: authHeader()
                  }).then(r => r.json()),

  validateFinal: phrase => fetch('/api/validate-final', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phrase })
                  }).then(r => r.json()),

  getFinal:      tgId => fetch(`/api/final/${tgId}`, {
                    headers: authHeader()
                  }).then(r => r.json()),

  getStats:      ()   => fetch('/api/stats/total_users', {
                    headers: authHeader()
                  }).then(r => r.json()),

  deletePlayer:  tgId => fetch(`/api/player/${tgId}`, {
                    method: 'DELETE',
                    headers: authHeader()
                  }).then(r => r.json()),
};

export default API;
