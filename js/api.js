const API_BASE = 'http://localhost:8080';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const err = new Error(data?.message || 'API Error');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
