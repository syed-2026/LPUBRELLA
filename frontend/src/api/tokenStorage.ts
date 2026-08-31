// Centralized so it's the only place that touches localStorage for auth.
// Access tokens are short-lived (15m per backend default); refresh tokens
// are used only to silently mint a new access token (see api/client.ts).

const ACCESS_TOKEN_KEY = 'lpu_umbrella_access_token';
const REFRESH_TOKEN_KEY = 'lpu_umbrella_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
