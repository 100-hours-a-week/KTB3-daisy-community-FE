import { apiFetch } from './api.js';
import { showToast, openConfirm } from './util.js';

(() => {
  const titleEl = document.querySelector('.post-title');
  const authorEl = document.querySelector('.author');
  const dateEl = document.querySelector('.date');
  const contentEl = document.querySelector('.post-content');
  const imageBox = document.querySelector('.post-image');
  const postAvatarImg = document.querySelector('.post-avatar-img');

  const editBtn = document.querySelector('.edit-btn');
  const deleteBtn = document.querySelector('.delete-btn');

  const likeBtn = document.querySelector('.btn-like');
  const likeCountEl = document.querySelector('.like-count');
  const viewCountEl = document.querySelector('.view-count');
  const commentCountEl = document.querySelector('.comment-count');

  const commentInput = document.querySelector('.comment-input');
  const commentSubmit = document.querySelector('.comment-submit');
  const commentListEl = document.querySelector('.comment-list');

  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  let currentUserId = null;
  let postOwnerId = null;
  let isLiked = false;
  let isLikeSubmitting = false;

  let commentNextCursor = null;
  let commentIsLast = false;
  let commentIsLoading = false;

  if (!postId) {
    showToast('잘못된 접근입니다.', 1500);
    setTimeout(() => {
      window.location.href = 'post-list.html';
    }, 1500);
    return;
  }

  async function loadMe() {
    try {
      const res = await apiFetch('/users/me');
      currentUserId = res.data.id;
    } catch (_) {
      currentUserId = null;
    }
  }

  async function loadPost() {
    try {
      const res = await apiFetch(`/posts/${postId}`);
      const post = res.data;

      postOwnerId = post.userId;

      titleEl.textContent = post.title ?? '';
      authorEl.textContent = post.nickname ?? '익명';
      const profileImage = post.profileImage ?? 'img/default-profile.svg';
      if (postAvatarImg) {
        postAvatarImg.src = profileImage;
      }
      dateEl.textContent = post.createdAt
        ? new Date(post.createdAt).toLocaleString('ko-KR')
        : '';
      viewCountEl.textContent = post.viewCount ?? 0;
      likeCountEl.textContent = post.likeCount ?? 0;
      commentCountEl.textContent = post.commentCount ?? 0;

      const content = post.content ?? '';
      contentEl.innerHTML = content
        .split('\n')
        .map((line) => `<p>${line}</p>`)
        .join('');

      if (post.image) {
        imageBox.style.display = 'block';
        imageBox.style.backgroundImage = `url(${post.image})`;
      } else {
        imageBox.style.display = 'none';
      }

      if (currentUserId && currentUserId === postOwnerId) {
        editBtn.hidden = false;
        deleteBtn.hidden = false;
      } else {
        editBtn.hidden = true;
        deleteBtn.hidden = true;
      }
    } catch (err) {
      console.error('게시글 로딩 실패:', err);
      showToast('게시글을 불러오지 못했습니다.', 1500);
      setTimeout(() => {
        window.location.href = 'post-list.html';
      }, 1500);
    }
  }

  editBtn?.addEventListener('click', () => {
    window.location.href = `post-edit.html?id=${postId}`;
  });

  deleteBtn?.addEventListener('click', () => {
    const doDelete = async () => {
      try {
        await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
        showToast('삭제되었습니다.', 1500);
        setTimeout(() => {
          window.location.href = 'post-list.html';
        }, 1500);
      } catch (err) {
        console.error('게시글 삭제 실패:', err);
        showToast('삭제에 실패했습니다.', 1500);
      }
    };

    openConfirm(
      '게시글을 삭제하시겠습니까?',
      '삭제 후에는 되돌릴 수 없습니다.',
      doDelete
    );
  });

  async function refreshLikeState() {
    try {
      const res = await apiFetch(`/posts/${postId}/likes`, { method: 'GET' });
      const data = res.data || {};
      likeCountEl.textContent = data.likeCount ?? 0;

      isLiked = data.liked;
      likeBtn.classList.toggle('on', isLiked);
      likeBtn.textContent = isLiked ? '♥' : '♡';
    } catch (err) {
      console.error('좋아요 수 로딩 실패:', err);
    }
  }

  likeBtn?.addEventListener('click', async () => {
    if (isLikeSubmitting) return;
    isLikeSubmitting = true;

    try {
      const method = isLiked ? 'DELETE' : 'POST';

      await apiFetch(`/posts/${postId}/likes`, { method });

      await refreshLikeState();
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      showToast('좋아요 처리에 실패했습니다.', 1500);
    } finally {
      isLikeSubmitting = false;
    }
  });

  function appendComments(items) {
    if (!commentListEl) return;

    if (!items || items.length === 0) {
      return;
    }

    const html = items
      .map((c) => {
        const mine = currentUserId && currentUserId === c.userId;
        const createdAt = c.createdAt
          ? new Date(c.createdAt).toLocaleString('ko-KR')
          : '';
        const profileImage = c.profileImage ?? 'img/default-profile.svg';

        return `
          <li data-comment-id="${c.id}">
            <img src="${profileImage}" alt="작성자" class="avatar" />
            <div class="comment-body">
              <div class="comment-head">
                <p class="author">${c.nickname ?? '익명'}</p>
                <p class="date">${createdAt}</p>
                ${
                  mine
                    ? `<div class="actions">
                         <button class="chip comment-edit">수정</button>
                         <button class="chip comment-delete">삭제</button>
                       </div>`
                    : ''
                }
              </div>
              <p class="text">${c.content ?? ''}</p>
            </div>
          </li>`;
      })
      .join('');

    commentListEl.insertAdjacentHTML('beforeend', html);
  }

  async function loadComments({ reset = false } = {}) {
    if (commentIsLoading) return;
    if (!reset && commentIsLast) return;

    commentIsLoading = true;

    try {
      let url =
        reset || commentNextCursor == null
          ? `/posts/${postId}/comments`
          : `/posts/${postId}/comments?cursor=${commentNextCursor}`;

      const res = await apiFetch(url);
      const data = res.data || {};
      const items = data.items || [];
      const newCursor = data.nextCursor;
      const last = !!data.last;

      if (reset) {
        commentListEl.innerHTML = '';
      }

      appendComments(items);

      commentNextCursor = newCursor ?? null;
      commentIsLast = last;
    } catch (err) {
      console.error('댓글 로딩 실패:', err);
      showToast('댓글을 불러오지 못했습니다.', 1500);
    } finally {
      commentIsLoading = false;
    }
  }

  function setupCommentInfiniteScroll() {
    window.addEventListener('scroll', () => {
      if (commentIsLoading || commentIsLast) return;

      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadComments();
      }
    });
  }


  function setupCommentEvents() {
    if (!commentListEl) return;

    commentListEl.addEventListener('click', async (event) => {
      const target = event.target;

      if (target.classList.contains('comment-delete')) {
        const li = target.closest('li[data-comment-id]');
        if (!li) return;

        const commentId = li.dataset.commentId;

        openConfirm(
          '댓글을 삭제하시겠습니까?',
          '삭제 후에는 되돌릴 수 없습니다.',
          async () => {
            try {
              await apiFetch(`/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE',
              });

              commentNextCursor = null;
              commentIsLast = false;
              commentListEl.innerHTML = '';
              await loadComments({ reset: true });
              await loadPost();
            } catch (err) {
              console.error('댓글 삭제 실패:', err);
              showToast('댓글 삭제에 실패했습니다.', 1500);
            }
          }
        );
        return;
      }

 
      if (target.classList.contains('comment-edit')) {
        const li = target.closest('li[data-comment-id]');
        if (!li || li.classList.contains('editing')) return;

        li.classList.add('editing');
        const textEl = li.querySelector('.text');
        const original = textEl.textContent;

        textEl.innerHTML = `
          <textarea class="comment-edit-input">${original}</textarea>
          <div class="comment-edit-actions">
            <button class="chip comment-save">저장</button>
            <button class="chip comment-cancel">취소</button>
          </div>
        `;
        return;
      }

      if (target.classList.contains('comment-save')) {
        const li = target.closest('li[data-comment-id]');
        const commentId = li.dataset.commentId;
        const input = li.querySelector('.comment-edit-input');

        const newContent = input.value.trim();
        if (!newContent) {
          showToast('댓글 내용을 입력해주세요.', 1500);
          return;
        }

        try {
          await apiFetch(`/posts/${postId}/comments/${commentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content: newContent }),
          });

          commentNextCursor = null;
          commentIsLast = false;
          commentListEl.innerHTML = '';
          await loadComments({ reset: true });
          await loadPost();
        } catch (err) {
          console.error('댓글 수정 실패:', err);
          showToast('댓글 수정에 실패했습니다.', 1500);
        }
        return;
      }


      if (target.classList.contains('comment-cancel')) {
        const li = target.closest('li[data-comment-id]');
        const textEl = li.querySelector('.text');
        const original = textEl.dataset.original ?? '';

        li.classList.remove('editing');
        textEl.textContent = original;
      }
    });
  }


  commentSubmit?.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text) {
      showToast('댓글을 입력해주세요.', 1500);
      return;
    }

    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });

      commentInput.value = '';
      await loadPost();

      commentNextCursor = null;
      commentIsLast = false;
      commentListEl.innerHTML = '';
      await loadComments({ reset: true });
    } catch (err) {
      console.error('댓글 등록 실패:', err);
      showToast('댓글 등록에 실패했습니다.', 1500);
    }
  });

  (async () => {
    await loadMe();
    await loadPost();
    await refreshLikeState();

    await loadComments({ reset: true });
    setupCommentInfiniteScroll();
    setupCommentEvents();
  })();
})();
