'use client';

/**
 * Small client-side API helper.
 *
 * - `NEXT_PUBLIC_API_BASE_URL` lets the Capacitor/static builds talk to a
 *   deployed backend instead of `capacitor://localhost/api`.
 * - Adds the stored bearer token when present. The admin cookie is httpOnly, so
 *   same-origin browser requests also authenticate without JavaScript access.
 */

export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export function getStoredToken(key = 'chalao_token'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null, key = 'chalao_token'): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(key, token);
    else localStorage.removeItem(key);
  } catch {
    /* storage may be unavailable in private mode */
  }
}

export async function apiFetch(path: string, init: RequestInit = {}, tokenKey = 'chalao_token'): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredToken(tokenKey);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
}
