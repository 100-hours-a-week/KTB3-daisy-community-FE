import { setOk, setError, showToast, openConfirm } from './util.js';
import { apiFetch } from './api.js';

(() => {
  const avatarInput = document.getElementById('avatar');
  const avatarLabel = document.querySelector('.avatar');
  const avaterPreview = document.getElementById('avatarPreview'); 
  const plusBtn = document.querySelector('.plus');

  const form = document.querySelector('.form');
  const emailEl = document.getElementById('email');
  const pwEl = document.getElementById('password');
  const pwConfirmEl = document.getElementById('pwConfirm');
  const nicknameEl = document.getElementById('nickname');

  const backBtn = document.querySelector('.back');
  const signinBtn = document.querySelector('.btn.primary');
  const loginBtn = document.querySelector('.btn.link');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const pwRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

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

  function validatePw() {
    const pw = pwEl.value.trim();

    if (pw === '') {
      setError(pwEl, '비밀번호를 입력해주세요.');
      return false;
    }

    if (!pwRegex.test(pw)) {
      setError(
        pwEl,
        '비밀번호는 8자 이상, 20자 이하이며 대문자, 소문자,숫자, 특수문자를 각각 최소 1개 포함해야 합니다.',
      );
      return false;
    }

    setOk(pwEl);
    return true;
  }

  function validateNickname() {
    if (!nicknameEl) return true;

    const nickname = nicknameEl.value.trim();

    if (nickname === '') {
      setError(nicknameEl, '닉네임을 입력해주세요.');
      return false;
    }

    if (/\s/.test(nickname)) {
      setError(nicknameEl, '띄어쓰기를 없애주세요.');
      return false;
    }

    if (nickname.length > 10) {
      setError(
        nicknameEl,
        '닉네임은 최대 10자까지 작성 가능합니다.',
      );
      return false;
    }

    setOk(nicknameEl);
    return true;
  }

  function validatePwConfirm() {
    const pw = pwEl.value.trim();
    const pwConfirm = pwConfirmEl.value.trim();

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
    const email = emailEl.value.trim();
    const pw = pwEl.value.trim();
    const pwConfirm = pwConfirmEl.value.trim();
    const nickname = nicknameEl.value.trim();

    if (email && pw && pwConfirm && nickname) {
      signinBtn.style.backgroundColor = '#7F6AEE';
    } else {
      signinBtn.style.backgroundColor = '';
    }
  }

  emailEl?.addEventListener('input', () => {
    validateEmail();
    updateBtnState();
  });

  pwEl?.addEventListener('input', () => {
    validatePw();
    updateBtnState();
  });

  pwConfirmEl.addEventListener('input', () => {
    validatePwConfirm();
    updateBtnState();
  });

  nicknameEl.addEventListener('input', () => {
    validateNickname();
    updateBtnState();
  });

  backBtn.addEventListener('click', () => {
    window.location.href = 'post-list.html';
  });

  loginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    avaterPreview.src = URL.createObjectURL(file);
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const validatedEmail = validateEmail();
    const validatedPw = validatePw();
    const validatedPwConfirm = validatePwConfirm();
    const validatedNickname = validateNickname();

    if (
      !validatedEmail ||
      !validatedPw ||
      !validatedPwConfirm ||
      !validatedNickname
    ) {
      showToast('입력한 내용을 다시 확인해주세요.', 2000);
      return;
    }
    const email = emailEl.value.trim();
    const password = pwEl.value.trim();
    const nickname = nicknameEl.value.trim();
    const passwordConfirm = pwConfirmEl.value.trim();

    const body = {
      email,
      password,
      passwordConfirm,
      nickname,
      profileImage: null,
    };
    
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showToast('회원가입이 완료되었습니다.', 1500);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      console.error('회원가입 실패: ', err);

      if (err.status === 409) {
        showToast('이미 사용 중인 이메일입니다.', 1500);
        setError(emailEl, '이미 사용 중인 이메일입니다.');
        return
      }
      if (err.status === 400) {
        showToast(err.data?.message || '입력 값을 다시 확인해주세요.', 1500);
      } else {
        showToast('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.', 1500);
      }
    }  
  });
})();
