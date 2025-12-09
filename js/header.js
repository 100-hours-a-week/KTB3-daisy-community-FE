import { apiFetch, setAccessToken, clearAccessToken } from './api.js';
import { openConfirm, showToast } from './util.js';

let initPromise = null;
let isLogged = false; 

async function initHeaderAuth() {
  if (isLogged) return true; 
  try {
    const response = await apiFetch('/users/auth/refresh', { method: 'POST' });
    const tokens = response?.data;
    if (!tokens?.accessToken) throw new Error('Refresh returned no AccessToken');
    setAccessToken(tokens.accessToken);
    isLogged = true;
    isLogged = true;
    return true;
  } catch (e) {
    console.error('Header refresh fail:', e);
    clearAccessToken();
    isLogged = false;
    return false;
  }
}

async function applyHeaderUI() {
  const headerEl = document.querySelector('.site-header');
  if (!headerEl) return;

  const page = document.body.dataset.page;
  const backBtn = headerEl.querySelector('.back-btn');
  const loginBtn = headerEl.querySelector('.login-btn');
  const userBtn = headerEl.querySelector('.userbtn');
  const menu = headerEl.querySelector('.menu');
  const profileImg = headerEl.querySelector('.profile-img');
  const logoutBtn = headerEl.querySelector('#logout'); 

  if (backBtn) {
    if (page === 'post-list' || page === 'login') backBtn.style.display = 'none';
    else {
      backBtn.style.display = 'block';
      backBtn.onclick = () => history.back();
    }
  }

  if (page === 'login' && loginBtn) loginBtn.style.display = 'none';

  const logged = await initHeaderAuth();

  if (!logged) {
    isLogged = false;
    if (loginBtn) {
      loginBtn.hidden = false;
      loginBtn.onclick = () => location.href = '/login.html';
    }
    if (userBtn) userBtn.hidden = true;
  } else {
    isLogged = true;
    if (loginBtn) loginBtn.hidden = true;
    if (userBtn) userBtn.hidden = false;

    try {
      const meRes = await apiFetch('/users/me', { method: 'GET' });
      const user = meRes?.data;
      if (user?.profileImageUrl) profileImg.src = user.profileImageUrl;
      else if (user?.profileImage) profileImg.src = user.profileImage;
    } catch (_) {
      console.warn('profile image load fail');
    }

    if (userBtn && menu) {
      userBtn.onclick = (e) => {
        e.stopPropagation();
        const open = userBtn.getAttribute('aria-expanded') === 'true';
        userBtn.setAttribute('aria-expanded', String(!open));
        menu.hidden = open;
      };
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        openConfirm(
          '로그아웃 하시겠습니까?',
          '현재 세션을 종료합니다.',
          async () => {
            try { await apiFetch('/users/auth/revoke', { method: 'POST' }); }
            catch (_) {}
            finally {
              clearAccessToken();
              location.href = '/login.html';
            }
          }
        );
      };
    }
  }
}

document.addEventListener('includes-loaded', () => {
  if (!initPromise) {
    initPromise = applyHeaderUI()
      .catch(() => isLogged = false)
      .finally(() => { initPromise = null });
  }
});
