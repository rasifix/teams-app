export const LOGGED_OUT_REASON = 'logged-out';
export const LOGGED_OUT_LOGIN_PATH = `/login?reason=${LOGGED_OUT_REASON}`;

interface JwtPayload {
  exp?: number;
}

export function isJwtExpired(token: string, now = Date.now(), clockSkewMs = 30_000): boolean {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return false;
    }

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedBase64)) as JwtPayload;

    return typeof payload.exp === 'number' && payload.exp * 1000 <= now + clockSkewMs;
  } catch {
    return false;
  }
}

export function isAuthenticationFailure(status: number, token: string | null, now = Date.now()): boolean {
  return status === 401 || (status === 403 && !!token && isJwtExpired(token, now));
}

export function clearSessionAndRedirectToLogin(): void {
  localStorage.removeItem('token');

  if (window.location.pathname !== '/login') {
    window.location.assign(LOGGED_OUT_LOGIN_PATH);
  }
}
