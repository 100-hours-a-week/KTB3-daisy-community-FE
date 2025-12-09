import { setError, setOk, showToast } from './util.js';
import { apiFetch, setAccessToken, clearAccessToken } from './api.js';

(() => {
  const form = document.querySelector('.form');
  const emailEl = document.getElementById('email');
  const pwEl = document.getElementById('password');
  const loginBtn = form.querySelector('.btn.primary');
  const signupBtn = document.querySelector('.btn.link');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

  let isSubmitting = false;

  function validateEmail() {
    const email = emailEl.value.trim();
    if (email === '') {
      setError(emailEl, '이메일을 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError(emailEl, '올바른 이메일 형식이 아닙니다.');
      return false;
    }
    setOk(emailEl);
    return true;
  }

  function validatePassword() {
    const pw = pwEl.value.trim();
    if (pw === '') {
      setError(pwEl, '비밀번호를 입력해주세요.');
      return false;
    }
    if (!pwRegex.test(pw)) {
      setError(
        pwEl,
        '비밀번호는 8자 이상, 20자 이하이며 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.'
      );
      return false;
    }
    setOk(pwEl);
    return true;
  }

  function updateBtnState() {
    const email = emailEl.value.trim();
    const pw = pwEl.value.trim();
    const enabled = emailRegex.test(email) && pwRegex.test(pw);

    loginBtn.disabled = !enabled;
    loginBtn.classList.toggle('enabled', enabled);
  }

  emailEl.addEventListener('input', () => {
    setOk(emailEl);
    updateBtnState();
  });

  pwEl.addEventListener('input', () => {
    setOk(pwEl);
    updateBtnState();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = emailEl.value.trim();
    const password = pwEl.value.trim();

    if (!validateEmail() || !validatePassword()) {
      updateBtnState();
      return;
    }

    isSubmitting = true;
    updateBtnState();

    try {
      const res = await apiFetch('/users/auth/token', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const payload = res.data || res;
      const newAccessToken = payload?.accessToken || null;

      if (!newAccessToken) throw new Error('토큰 없음');

      setAccessToken(newAccessToken);
      showToast('로그인 되었습니다.', 1500);

      setTimeout(() => {
        location.href = '/post-list.html';
      }, 1500);
    } catch (err) {
      console.error('로그인 실패:', err);
      clearAccessToken();
      setError(emailEl, '이메일 또는 비밀번호를 다시 확인해주세요.');
      setOk(pwEl);
      pwEl.value = '';
      pwEl.focus();
      showToast('로그인에 실패했습니다.', 1500);
    } finally {
      isSubmitting = false;
      updateBtnState();
    }
  });

  signupBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    location.href = '/signup.html';
  });

  updateBtnState();
})();
