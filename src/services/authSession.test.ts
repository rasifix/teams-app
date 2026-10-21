import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearSessionAndRedirectToLogin,
  isAuthenticationFailure,
  isJwtExpired,
  LOGGED_OUT_LOGIN_PATH,
} from './authSession';

const expiredToken = 'header.eyJleHAiOjEwMDB9.signature';
const validToken = 'header.eyJleHAiOjQwMDAwMDAwMDB9.signature';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isJwtExpired', () => {
  it('detects an expired token', () => {
    expect(isJwtExpired(expiredToken, 1_500_000, 0)).toBe(true);
  });

  it('keeps a token whose expiration is in the future', () => {
    expect(isJwtExpired(validToken, 1_500_000, 0)).toBe(false);
  });

  it('does not classify malformed or expiry-less tokens as expired', () => {
    expect(isJwtExpired('not-a-jwt', 1_500_000, 0)).toBe(false);
    expect(isJwtExpired('header.e30.signature', 1_500_000, 0)).toBe(false);
  });
});

describe('isAuthenticationFailure', () => {
  it('treats every unauthorized response as an authentication failure', () => {
    expect(isAuthenticationFailure(401, validToken, 1_500_000)).toBe(true);
  });

  it('treats a forbidden response as an authentication failure only for an expired token', () => {
    expect(isAuthenticationFailure(403, expiredToken, 1_500_000)).toBe(true);
    expect(isAuthenticationFailure(403, validToken, 1_500_000)).toBe(false);
    expect(isAuthenticationFailure(403, null, 1_500_000)).toBe(false);
  });

  it('does not treat unrelated response statuses as authentication failures', () => {
    expect(isAuthenticationFailure(500, expiredToken, 1_500_000)).toBe(false);
  });
});

it('uses a stable login URL for logged-out redirects', () => {
  expect(LOGGED_OUT_LOGIN_PATH).toBe('/login?reason=logged-out');
});

it('clears the token and redirects to login', () => {
  const removeItem = vi.fn();
  const assign = vi.fn();
  vi.stubGlobal('localStorage', { removeItem });
  vi.stubGlobal('window', { location: { pathname: '/activities', assign } });

  clearSessionAndRedirectToLogin();

  expect(removeItem).toHaveBeenCalledWith('token');
  expect(assign).toHaveBeenCalledWith(LOGGED_OUT_LOGIN_PATH);
});
