const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.data?.accessToken) {
          throw new Error(body.message || 'You are not allowed to access this resource');
        }
        localStorage.setItem('accessToken', body.data.accessToken);
        return body.data.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const request = (token: string | null) => fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: ['Bearer', token].join(' ') } : {}),
      ...(options.headers || {}),
    },
  });
  let response = await request(localStorage.getItem('accessToken'));
  if (response.status === 401 && !path.startsWith('/auth/')) {
    try {
      await refreshAccessToken();
      response = await request(localStorage.getItem('accessToken'));
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'The request could not be completed');
  return body.data as T;
}

export { API_URL };
