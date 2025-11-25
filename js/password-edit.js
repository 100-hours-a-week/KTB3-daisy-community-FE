import { setOk, setError, showToast, openConfirm } from './util.js';
import { apiFetch } from './api.js';

(() => {
  const form = document.querySelector('.form');
  const pwEl = document.getElementById('pw');
  const pwConfirmEl = document.getElementById('pwConfirm');
  const editBtn = document.querySelector('.btn.primary');

  const pwRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

  let currentUserId = null;
  let isSubmitting = false;

  async function loadProfile() {
    try {
      const res = await apiFetch('/users/me');
      const user = res.data;
      currentUserId = user.id;
    } catch (err) {
      console.error('현재 사용자 정보를 불러오기 실패: ', err);

      if (err.status === 401 || err.status === 403) {
        showToast('로그인이 필요합니다.', 1500);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
        return;
      }

      showToast('사용자 정보를 불러오지 못했습니다.', 2000);
    }
  }

  loadProfile();


  function validatePassword() {
    const pw = pwEl.value.trim();

    if (pw === '') {
      setError(pwEl, '비밀번호를 입력해주세요.');
      return false;
    }

    if (!pwRegex.test(pw)) {
      setError(
        pwEl,
        '비밀번호는 8자 이상, 20자 이하이며 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.',
      );
      return false;
    }

    setOk(pwEl);
    return true;
  }

  function validatePwConfirm() {
    const pw = pwEl.value.trim();
    const pwConfirm = pwConfirmEl.value;

    if (pwConfirm === '') {
      setError(pwConfirmEl, '비밀번호를 입력해주세요.');
      return false;
    }

    if (pw && pw !== pwConfirm) {
      setError(pwConfirmEl, '비밀번호가 다릅니다.');
      return false;
    }

    setOk(pwConfirmEl);
    return true;
  }

  function updateBtnState() {
    const pw = pwEl.value.trim();
    const pwConfirm = pwConfirmEl.value.trim();

    if (pwRegex.test(pw) && pw && pw === pwConfirm) {
      editBtn.style.backgroundColor = '#8C5B3F';
      editBtn.style.color = '#FFFFFF';
    } else {
      editBtn.style.backgroundColor = '#E2D6C8';
      editBtn.style.color = '#A39385';
    }
  }


  pwEl?.addEventListener('input', () => {
    setOk(pwEl);
    updateBtnState();
  });

  pwConfirmEl?.addEventListener('input', () => {
    setOk(pwConfirmEl);
    updateBtnState();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validPw = validatePassword();
    const validPwConfirm = validatePwConfirm();

    if (!validPw || !validPwConfirm) {
      updateBtnState();
      return;
    }

    if (!currentUserId) {
      showToast('사용자 정보를 불러오지 못했습니다.', 1500);
      return;
    }

    const pw = pwEl.value.trim();
    const pwConfirm = pwConfirmEl.value.trim();

    try {
      isSubmitting = true;
      updateBtnState();

      await apiFetch(`/users/${currentUserId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({
          password: pw,
          passwordConfirm: pwConfirm,
        }),
      });

      showToast('비밀번호가 수정되었습니다.', 1500);

      setTimeout(() => {
        window.location.href = 'post-list.html';
      }, 1500);
    } catch (err) {
      console.error('비밀번호 수정 실패: ', err);

      if (err.status === 401 || err.status === 403) {
        showToast('다시 로그인해주세요.', 1500);
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
        return;
      }

      showToast('비밀번호 수정에 실패했습니다.', 1500);
    } finally {
      isSubmitting = false;
      updateBtnState();
    }
  });
})();
