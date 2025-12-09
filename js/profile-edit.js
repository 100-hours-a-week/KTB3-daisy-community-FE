import { setError, setOk, showToast, openConfirm } from './util.js';
import { apiFetch } from './api.js';
import { requireLogin, forceLogout } from './auth.js';

(() => {
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatarPreview');

  const form = document.querySelector('.form');
  const emailEl = document.getElementById('emailText');
  const nicknameEl = document.getElementById('nickname');
  const duplicateBtn = document.querySelector('.btn.secondary');
  const editBtn = document.querySelector('.btn.primary');
  const withdrawBtn = document.querySelector('.btn.link');

  let currentUserId = null;
  let isNicknameChecked = false;
  let isSubmitting = false;

  async function loadProfile() {
    try {
      const res = await apiFetch('/users/me', { method: 'GET' });
      const user = res.data || res;

      currentUserId = user.id;

      if (emailEl) {
        emailEl.textContent = user.email || '';
      }
      if (nicknameEl) {
        nicknameEl.value = user.nickname || '';
      }
      if (avatarPreview && (user.profileImageUrl || user.profileImage)) {
        avatarPreview.src = user.profileImageUrl || user.profileImage;
      }
    } catch (err) {
      console.error('프로필 불러오기 실패', err);

      if (err.status === 401 || err.status === 403) {
        showToast('로그인이 필요합니다.', 1500);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
        return;
      }
      showToast('회원 정보를 불러오지 못했습니다.', 2000);
    }
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
      setError(nicknameEl, '닉네임은 최대 10자까지 작성 가능합니다.');
      return false;
    }

    setOk(nicknameEl);
    return true;
  }

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    avatarPreview.src = URL.createObjectURL(file);
  });

  nicknameEl?.addEventListener('input', () => {
    isNicknameChecked = false;

    const isValid = validateNickname();
    if (duplicateBtn) duplicateBtn.disabled = !isValid;
    if (editBtn) {
      editBtn.disabled = true;
      editBtn.style.backgroundColor = '';
      editBtn.style.color = '';
    }
  });

  duplicateBtn?.addEventListener('click', async () => {
    const validNickname = validateNickname();
    if (!validNickname) return;

    const nickname = nicknameEl.value.trim();

    try {
      await apiFetch(
        `/users/check-nickname?nickname=${encodeURIComponent(nickname)}`
      );

      isNicknameChecked = true;
      showToast('사용 가능한 닉네임입니다.', 2000);

      if (editBtn) {
        editBtn.disabled = false;
        editBtn.style.backgroundColor = '#8C5B3F';
        editBtn.style.color = '#FFFFFF';
      }
    } catch (err) {
      console.error('닉네임 중복확인 실패:', err);
      setError(nicknameEl, '이미 사용 중인 닉네임입니다.');
      isNicknameChecked = false;
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validNickname = validateNickname();
    if (!validNickname || !isNicknameChecked) {
      showToast('닉네임 중복확인을 완료해주세요.', 2000);
      return;
    }

    if (!currentUserId) {
      showToast('사용자 정보를 불러오지 못했습니다.', 1500);
      return;
    }

    const nickname = nicknameEl.value.trim();

    try {
      isSubmitting = true;

      await apiFetch(`/users/${currentUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nickname }),
      });

      showToast('수정 완료', 2000);
      setTimeout(() => {
        window.location.href = 'post-list.html';
      }, 2000);
    } catch (err) {
      console.error('프로필 수정 실패', err);
      showToast('수정 실패', 1500);
    } finally {
      isSubmitting = false;
    }
  });

  withdrawBtn?.addEventListener('click', () => {
    openConfirm(
      '회원탈퇴 하시겠습니까?',
      '작성된 게시글과 댓글은 삭제됩니다.',
      async () => {
        try {
          await apiFetch('/users/auth/revoke', { method: 'POST' });
        } catch (_) {}
        showToast('회원탈퇴가 완료되었습니다.', 2000);
        setTimeout(() => {
          forceLogout();
        }, 2000);
      }
    );
  });

  (async () => {
    const ok = await requireLogin();
    if (!ok) {
      showToast('로그인이 필요합니다.', 1500);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }

    await loadProfile();
  })();
})();
