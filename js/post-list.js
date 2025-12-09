import { showToast } from './util.js';
import { apiFetch } from './api.js';
import { requireLogin } from './auth.js';

(() => {
  const postsEl = document.querySelector('.posts');
  const writeBtn = document.getElementById('writeBtn');

  let nextCursor = null;
  let isLast = false;
  let isLoading = false;

  writeBtn?.addEventListener('click', () => {
    window.location.href = 'post-edit.html';
  });

  async function appendPosts(items) {
    if (!postsEl) return;

    if ((!items || items.length === 0) && !postsEl.hasChildNodes()) {
      postsEl.innerHTML = `<li class="post empty">아직 게시글이 없습니다.</li>`;
      return;
    }

    if (!items || items.length === 0) return;

    const html = items
      .map(
        (post) => `
      <li class="post">
        <a href="post-detail.html?id=${post.id}">
          <div class="post-header">
            <span class="title">${post.title ?? ''}</span>
          </div>
          <div class="post-info">
            <div class="post-info-left">
              <span>좋아요 ${post.likeCount ?? 0}</span>
              <span>댓글 ${post.commentCount ?? 0}</span>
              <span>조회수 ${post.viewCount ?? 0}</span>
            </div>
            <span class="date">${
              post.createdAt
                ? new Date(post.createdAt).toLocaleString('ko-KR')
                : ''
            }</span>
          </div>
          <div class="post-divider"></div>
          <div class="post-writer">
            <img src="${
              post.profileImage ?? 'img/default-profile.svg'
            }" alt="작성자" class="avatar" />
            <span>${post.nickname ?? '익명'}</span>
          </div>
        </a>
      </li>
    `,
      )
      .join('');

    postsEl.insertAdjacentHTML('beforeend', html);
  }

  async function loadPosts() {
    if (isLoading || isLast) return;
    isLoading = true;

    try {
      const url = nextCursor != null ? `/posts?cursor=${nextCursor}` : `/posts`;

      const res = await apiFetch(url);
      const data = res.data || {};
      const items = data.items || [];

      appendPosts(items);

      nextCursor = data.nextCursor ?? null;
      isLast = !!data.last;
    } catch (err) {
      console.error(err);
      showToast('게시글을 불러오지 못했습니다.', 1500);
    } finally {
      isLoading = false;
    }
  }

  function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      if (isLoading || isLast) return;

      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadPosts();
      }
    });
  }

  (async () => {
    const ok = await requireLogin();
    if (!ok) return;

    await loadPosts();
    setupInfiniteScroll();
  })();
})();
