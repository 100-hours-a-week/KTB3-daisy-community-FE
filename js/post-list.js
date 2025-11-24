import { showToast, openConfirm } from './util.js';
import { apiFetch } from './api.js';

(() => {
  const userBtn = document.querySelector('.userbtn');
  const menu = document.querySelector('.menu');
  const logoutBtn = document.getElementById('logout');
  const postsEl = document.querySelector('.posts');
  const writeBtn = document.getElementById('writeBtn');

  let nextCursor = null;
  let isLast = false;
  let isLoading = false;

  function toggleMenu() {
    if (!userBtn || !menu) return;
    const isOpen = userBtn.getAttribute('aria-expanded') === 'true';

    userBtn.removeAttribute('aria-expanded', !isOpen);
    if (isOpen) {
      userBtn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('hidden', '');
    } else {
      userBtn.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('hidden');
    }
  }

  writeBtn?.addEventListener('click', () => {
    window.location.href = 'post-edit.html';
  });

  async function appendPosts(items) {
      if (!postsEl) return;

      if (!items || items.length === 0 && !postsEl.hasChildNodes()) {
        postsEl.innerHTML = `
          <li class="post empty">아직 게시글이 없습니다.</li>
        `;
        return;
      }

      if (!items || items.length === 0) {
        return;
      }

      const html = items
        .map((post) => {
          const title = post.title ?? '';
          const nickname = post.nickname ?? '익명';
          const profileImage = post.profileImage ?? 'img/default-profile.svg';
          const createdAt = post.createdAt
            ? new Date(post.createdAt).toLocaleString('ko-KR')
            : '';
          const viewCount = post.viewCount ?? 0;
          const likeCount = post.likeCount ?? 0;
          const commentCount = post.commentCount ?? 0;

          return `
            <li class="post">
              <a href="post-detail.html?id=${post.id}">
                <div class="post-header">
                  <span class="title">${title}</span>
                </div>

                <div class="post-info">
                  <div class="post-info-left">
                    <span>좋아요 ${likeCount}</span>
                    <span>댓글 ${commentCount}</span>
                    <span>조회수 ${viewCount}</span>
                  </div>
                  <span class="date">${createdAt}</span>
                </div>

                <div class="post-divider"></div>

                <div class="post-writer">
                  <img src="${profileImage}" alt="작성자" class="avatar" />
                  <span>${nickname}</span>
                </div>
              </a>
            </li>
          `;
        })
        .join('');

        postsEl.insertAdjacentHTML('beforeend', html);
  }

  async function loadPosts() {
  if (isLoading || isLast) return;
  isLoading = true;

  try {
    const url =
      nextCursor != null
        ? `/posts?cursor=${nextCursor}`
        : `/posts`;

    console.log('[loadPosts] 요청:', { url, nextCursor, isLast });

    const res = await apiFetch(url);
    const data = res.data || {};
    const items = data.items || [];
    const newCursor = data.nextCursor;
    const last = !!data.last;

    console.log('[loadPosts] 응답:', {
      itemsLength: items.length,
      newCursor,
      last,
    });

    appendPosts(items);

    nextCursor = newCursor ?? null;
    isLast = last;
  } catch (err) {
    console.error('게시글 로딩 실패: ', err);
    showToast('게시글을 불러오지 못했습니다.', 1500);
  } finally {
    isLoading = false;
  }
}

function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    console.log('[scroll] fired', { isLoading, isLast, nextCursor });

    if (isLoading || isLast) return;

    const { scrollTop, scrollHeight, clientHeight } =
      document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      console.log('[scroll] 바닥 근처 → loadPosts 호출');
      loadPosts();
    }
  });
}


  logoutBtn?.addEventListener('click', () => {
    openConfirm('로그아웃 하시겠습니까?', '다시 로그인해야 합니다.', async () => {
      try {
        await apiFetch('/users/auth/revoke', {
          method: 'POST',
        });
      } catch (_) {}
      location.href = '/login.html';
    });
  });

  userBtn?.addEventListener('click', toggleMenu);

  loadPosts();
  setupInfiniteScroll();
})();
