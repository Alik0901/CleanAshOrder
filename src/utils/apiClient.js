// src/utils/apiClient.js
// Unified API client for the Order of Ash frontend.
// Notes:
// - Consistent shapes are returned by methods (defensive defaults)
// - getPlayer has in-flight dedup + 5s throttle to prevent storms
// - Alias getRunesUrls → getRuneUrls kept for backward compatibility

/* ────────────────────────────────────────────────────────────────────
 * Base URL
 * ────────────────────────────────────────────────────────────────── */

// IMPORTANT: BASE should point to the backend origin hosting `/api/*`.
// If VITE_API_BASE_URL is not set, we fall back to the existing default.
const BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://clean-ash-order.vercel.app'
).replace(/\/+$/, '');

/* ────────────────────────────────────────────────────────────────────
 * Utilities
 * ────────────────────────────────────────────────────────────────── */

/** Returns Authorization header if JWT is present. */
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Low-level fetch wrapper with JSON handling and error surfacing.
 * Optionally supports a timeout (defaults to 15s).
 */
async function fetchJSON(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });

    // Try to parse JSON; if body is empty and OK, return empty object
    let data = null;
    try { data = await res.json(); } catch (_) { /* ignore parse errors */ }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || res.statusText || 'Request failed';
      throw new Error(msg);
    }

    return data ?? {};
  } catch (err) {
    // Normalize error message
    if (err?.name === 'AbortError') throw new Error('Request timeout');
    throw new Error(err?.message || 'Network error');
  } finally {
    clearTimeout(t);
  }
}

/** Coerces array of IDs into CSV query string (e.g., ids=1,2,3). */
function idsToQuery(ids = []) {
  const list = Array.isArray(ids) ? ids : [];
  return list.length ? `?ids=${list.join(',')}` : '';
}

/* ────────────────────────────────────────────────────────────────────
 * getPlayer throttling & in-flight dedup (avoid request storms)
 * ────────────────────────────────────────────────────────────────── */

let _gpInFlight = null;
let _gpLastTs = 0;
let _gpCache = null;
const GP_MIN_GAP = 5000; // 1 call / 5s

/* ────────────────────────────────────────────────────────────────────
 * API surface
 * ────────────────────────────────────────────────────────────────── */

const API = {
  /* ── Auth / Init ──────────────────────────────────────────────── */
  async init({ tg_id, name, initData, referrer_code }) {
    return fetchJSON(`${BASE}/api/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tg_id, name, initData, referrer_code }),
    });
  },

  /* ── Player ───────────────────────────────────────────────────── */
  async getPlayer(tgId) {
    const now = Date.now();
    if (_gpInFlight) return _gpInFlight;
    if (_gpCache && now - _gpLastTs < GP_MIN_GAP) return _gpCache;

    const doFetch = async () => {
      const data = await fetchJSON(`${BASE}/api/player/${tgId}`, {
        headers: { ...authHeader() },
      });
      _gpCache = data;
      _gpLastTs = Date.now();
      return data;
    };

    _gpInFlight = doFetch().finally(() => {
      _gpInFlight = null;
    });
    return _gpInFlight;
  },

  /* ── Fragments ───────────────────────────────────────────────── */
  async getFragments(tgId) {
    return fetchJSON(`${BASE}/api/fragments/${tgId}`, {
      headers: { ...authHeader() },
    });
  },

  async getSignedFragmentUrls() {
    return fetchJSON(`${BASE}/api/fragments/urls`, {
      headers: { ...authHeader() },
    });
  },

  /* ── Burn flow ───────────────────────────────────────────────── */
  async createBurn(tgId, amount_nano = 500_000_000) {
    const data = await fetchJSON(`${BASE}/api/burn-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ tg_id: tgId, amount_nano }),
    });
    // Normalize shape
    return {
      invoiceId: data.invoiceId,
      paymentUrl: data.paymentUrl,
      tonspaceUrl: data.tonspaceUrl,
      task: data.task || null,
      paid: !!data.paid,
    };
  },

  async getBurnStatus(invoiceId) {
    const data = await fetchJSON(`${BASE}/api/burn-status/${invoiceId}`, {
      headers: { ...authHeader() },
    });
    return {
      paid: !!data.paid,
      processed: !!data.processed,
      task: data.task || null,
      result: data.result || null,
    };
  },

  async completeBurn(invoiceId, success = true, payload = {}) {
    return fetchJSON(`${BASE}/api/burn-complete/${invoiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ success, payload }),
    });
  },

  /* ── Referral ─────────────────────────────────────────────────── */
  async getReferral() {
    return fetchJSON(`${BASE}/api/referral`, {
      headers: { ...authHeader() },
    });
  },

  async claimReferral() {
    return fetchJSON(`${BASE}/api/referral/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
  },

  /* ── Final phrase ─────────────────────────────────────────────── */
  async validateFinal(phrase) {
  return fetchJSON(`${BASE}/api/validate-final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ phrase }),
  });
  },

  async getFinal(tgId) {
  try {
    const { fragments } = await fetchJSON(`${BASE}/api/fragments/${tgId}`, {
      headers: { ...authHeader() },
    });
    const list = Array.isArray(fragments) ? fragments : [];
    return { enabled: list.length >= 8, fragments: list };
  } catch {
    return { enabled: false, fragments: [] };
  }
  },
  // If the backend exposes a final info endpoint later, enable this:
  // async getFinal(tgId) {
  //   return fetchJSON(`${BASE}/api/final/${tgId}`, {
  //     headers: { ...authHeader() },
  //   });
  // },

  /* ── Third Fragment Quest ─────────────────────────────────────── */
  async getThirdQuest() {
    return fetchJSON(`${BASE}/api/third-quest`, {
      headers: { ...authHeader() },
    });
  },

  async claimThirdQuest(answer) {
    return fetchJSON(`${BASE}/api/third-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ answer }),
    });
  },

  /* ── Stats / Misc ─────────────────────────────────────────────── */
  async deletePlayer(tgId) {
    return fetchJSON(`${BASE}/api/player/${tgId}`, {
      method: 'DELETE',
      headers: { ...authHeader() },
    });
  },

  async getLeaderboard() {
    return fetchJSON(`${BASE}/api/leaderboard`, {
      headers: { ...authHeader() },
    });
  },

  async getDailyQuest() {
    return fetchJSON(`${BASE}/api/daily-quest`, {
      headers: { ...authHeader() },
    });
  },

  async claimDailyQuest() {
    return fetchJSON(`${BASE}/api/daily-quest/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
  },

  async getUserStats(tgId) {
    return fetchJSON(`${BASE}/api/stats/${tgId}`, {
      headers: { ...authHeader() },
    });
  },

  /* ── Cipher / Runes ───────────────────────────────────────────── */
  async getCipherAll(includeUrls = false) {
    const q = includeUrls ? '?includeUrls=1' : '';
    const bust = `${q ? '&' : '?'}_=${Date.now()}`;
    return fetchJSON(`${BASE}/api/cipher/all${q}${bust}`, {
    headers: { ...authHeader() },
  });
  },

  async getCipher(fragId) {
    return fetchJSON(`${BASE}/api/cipher/${fragId}`, {
      headers: { ...authHeader() },
    });
  },

  async answerCipher(fragId, chosenNumber) {
    return fetchJSON(`${BASE}/api/cipher-answer/${fragId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ chosenNumber }),
    });
  },

  // Backward compatibility for Gallery calls that use plural naming
  async getRunesUrls(ids = []) {
    return fetchJSON(`${BASE}/api/runes/urls${idsToQuery(ids)}`, {
      headers: { ...authHeader() },
    });
  },

  async getRuneUrls(ids = []) {
    return fetchJSON(`${BASE}/api/runes/urls${idsToQuery(ids)}`, {
      headers: { ...authHeader() },
    });
  },
};

// Keep the alias available (both names point to the same implementation)
API.getRunesUrls = API.getRuneUrls;

export default API;
