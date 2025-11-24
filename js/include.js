document.addEventListener('DOMContentLoaded', async () => {
  const includes = document.querySelectorAll('[data-include]');
  
  await Promise.all(
    Array.from(includes).map(async (el) => {
      const url = el.getAttribute('data-include');
      const res = await fetch(url, { cache: 'no-store' });
      const html = await res.text();
      el.outerHTML = html;
    })
  );
});
