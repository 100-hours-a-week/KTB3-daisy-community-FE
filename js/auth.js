import { apiFetch, setAccessToken, clearAccessToken } from './api.js';

let initPromise = null;  
let isLoggedIn = false;  

async function initAuthInternal() {
  try {
    const res = await apiFetch('/users/auth/refresh', { method: 'POST' });
    const payload = res.data || res;

    const newAccessToken =
      payload?.accessToken || payload?.token || payload?.access_token || null;

    if (!newAccessToken) throw new Error('토큰 없음');

    setAccessToken(newAccessToken);
    isLoggedIn = true;
  } catch (e) {
    console.error('Refresh 실패:', e);
    clearAccessToken();
    isLoggedIn = false;
  }
}

export async function requireLogin() {
  if (!initPromise) {
    initPromise = initAuthInternal(); 
  }
  return initPromise.then(() => isLoggedIn);
}

export function forceLogout() {
  clearAccessToken();
  isLoggedIn = false;
  initPromise = null;
  window.location.href = '/login.html';
}
