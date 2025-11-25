import { setOk, setError, showToast, openConfirm } from './util.js';
import { apiFetch } from './api.js';

(() => {
  const backBtn = document.querySelector('.back');
  const form = document.querySelector('.form');
  const titleEl = document.getElementById('title');
  const contentEl = document.getElementById('content');
  const imageInput = document.getElementById('image');
  const editBtn = document.querySelector('.btn.primary');

  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  let isSubmitting = false;

  function validateTitle() {
    const title = titleEl.value.trim();

    if (title === '') {
      setError(titleEl, '제목을 입력해주세요.');
      return false;
    }
    if (title.length > 26) {
      setError(titleEl, '제목은 최대 26자까지 작성 가능합니다.');
      return false;
    }
    setOk(titleEl);
    return true;
  }

  function validateContent() {
    const content = contentEl.value.trim();

    if (content === '') {
      setError(contentEl, '내용을 입력해주세요.');
      return false;
    }
    setOk(contentEl);
    return true;
  }

  async function loadPostEdit() {
    if (!postId) return;

    try {
      const res = await apiFetch(`/posts/${postId}`);
      const post = res.data;

      if (titleEl) titleEl.value = post.title ?? '';
      if (contentEl) contentEl.value = post.content ?? '';

      editBtn.textContent = '수정하기';
      updateBtnState();
    } catch (err) {
      console.error('게시글 불러오기 실패:', err);

      if (err.status === 401 || err.status === 403) {
        showToast('다시 로그인해주세요.', 1500);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
        return;
      }

      if (err.status === 400) {
        showToast('게시글을 찾을 수 없습니다.', 1500);
      } else {
        showToast('게시글을 불러오지 못했습니다.', 1500);
      }

      setTimeout(() => {
        window.location.href = 'post-list.html';
      }, 1500);
    }
  }

  function updateBtnState() {
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    if (title && content) {
      editBtn.style.backgroundColor = '#8C5B3F';
      editBtn.style.color = '#FFFFFF';
    } else {
      editBtn.style.backgroundColor = '#E2D6C8';
      editBtn.style.color = '#A39385';
    }
  }

  titleEl?.addEventListener('input', () => {
    validateTitle();
    updateBtnState();
  });

  contentEl?.addEventListener('input', () => {
    validateContent();
    updateBtnState();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validTitle = validateTitle();
    const validContent = validateContent();

    if (!validTitle || !validContent) {
      showToast('제목과 내용을 모두 작성해주세요.', 2000);
      return;
    }

    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    try {
      isSubmitting = true;
      updateBtnState();

      if (postId) {
        await apiFetch(`/posts/${postId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, content, image: null }),
        });
        showToast('게시글이 수정되었습니다.', 1500);
      } else {
        await apiFetch('/posts', {
          method: 'POST',
          body: JSON.stringify({ title, content, image: null }),
        });
        showToast('게시글이 등록되었습니다.', 1500);
      }

      setTimeout(() => {
        window.location.href = 'post-list.html';
      }, 1500);
    } catch (err) {
      console.error('게시글 저장 실패:', err);

      if (err.status === 401 || err.status === 403) {
        showToast('다시 로그인해주세요.', 1500);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
        return;
      }

      showToast('게시글 저장에 실패했습니다.', 1500);
    } finally {
      isSubmitting = false;
      updateBtnState();
    }
  });

  backBtn?.addEventListener('click', () => {
    window.location.href = 'post-list.html';
  });

  (async () => {
    await loadPostEdit();
  })();
})();
