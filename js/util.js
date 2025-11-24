export function getHelperText(el) {
  let helperText = el.parentElement.querySelector('.helper.auto');

  if (!helperText) {
    helperText = document.createElement('p');
    helperText.className = 'helper auto';
    el.insertAdjacentElement('afterend', helperText);
  }

  return helperText;
}

export function setError(el, message) {
  const helperText = getHelperText(el);
  helperText.textContent = message ?? '';
  helperText.classList.toggle('error', !!message);
  el.setAttribute('aria-invalid', 'true');
}

export function setOk(el) {
  const helperText = getHelperText(el);
  helperText.textContent = '';
  el.removeAttribute('aria-invalid');
}

export function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
  }, duration);
}

export function openConfirm(title, description, onOk) {
  const modal = document.getElementById('confirmModal');

  if (!modal) {
    const ok = window.confirm(`${title}\n\n${description}`);
    if (ok && onOk) onOk();
    return;
  }

  const titleEl = modal.querySelector('.title');
  const descriptionEl = modal.querySelector('.description');
  const okBtn = modal.querySelector('#confirmOk');

  if (titleEl) titleEl.textContent = title;
  if (descriptionEl) descriptionEl.textContent = description;

  okBtn.onclick = () => {
    modal.classList.remove('open');
    if (onOk) onOk();
  };

  modal.addEventListener(
    'click',
    (e) => {
      if (e.target.hasAttribute('data-close')) {
        modal.classList.remove('open');
      }
    },
    { once: true },
  );

  modal.classList.add('open');
}
