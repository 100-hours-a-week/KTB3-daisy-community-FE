const API_BASE = 'http://localhost:8080';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
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
