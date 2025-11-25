import { apiFetch } from './api.js';
import { openConfirm } from './util.js';

async function setupHeader() {
  const headerEl = document.querySelector('.site-header');
  if (!headerEl) return;

  const page = document.body.dataset.page;

  const backBtnEl = headerEl.querySelector('.back-btn');
  const loginBtnEl = headerEl.querySelector('.login-btn');
  const userBtnEl = headerEl.querySelector('.userbtn');
  const menu = headerEl.querySelector('.menu');
  const profileImgEl = headerEl.querySelector('.profile-img');

  if(backBtnEl) {
    if (page === 'post-list' || page === 'login') {
      backBtnEl.style.display = 'none';
    } else {
      backBtnEl.addEventListener('click', () => {
        history.back();
      })
    }
  }

  if (page === 'login') {
    if (loginBtnEl) loginBtnEl.style.display = 'none';
  }

  const token = localStorage.getItem('accessToken');

  if (!token) {
    loginBtnEl.hidden = false;
    userBtnEl.hidden = true;
    loginBtnEl.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  } else {
    loginBtnEl.hidden = true;
    userBtnEl.hidden = false;

    apiFetch('/users/me').then(user => {
      if (user.profileImageUrl)
        profileImgEl.src = user.profileImageUrl;
    }).catch(() => {});
    

    userBtnEl.addEventListener('click', () => {
      const open = userBtnEl.getAttribute('aria-expanded') === 'true';
      userBtnEl.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });

    headerEl.querySelector('#logout').addEventListener('click', () => {
      localStorage.removeItem('accessToken');
      window.location.href = 'login.html';
    });
  }

  document.addEventListener('click', (e) => {
    if (!headerEl.contains(e.target)) {
      menu.hidden = true;
      userBtnEl.setAttribute('aria-expanded', 'false');
    }
  });
}

document.addEventListener('includes-loaded', setupHeader);
