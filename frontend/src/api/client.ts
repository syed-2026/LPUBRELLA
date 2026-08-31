import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '@/types';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!baseURL) {
  // Fail loudly at startup rather than silently hitting a wrong/relative URL.
  console.error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and set it to your backend URL.'
  );
}

export const apiClient = axios.create({
  baseURL: baseURL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// A normalized, human-friendly application error thrown from every API call.
export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, code: string, status: number, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function friendlyMessageFor(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return fallback || 'That request could not be processed. Please check the details and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return fallback || 'We could not find what you were looking for.';
    case 409:
      return fallback || 'This conflicts with the current state - it may have just changed.';
    case 422:
      return fallback || 'Some of the information provided is invalid.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    default:
      return 'Something went wrong on our end. Please try again shortly.';
  }
}

function normalizeError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data;
  const code = body?.error?.code || (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
  const rawMessage = body?.error?.message;

  if (status === 0) {
    return new ApiError(
      'Could not reach the server. Check your connection or that the backend is running.',
      'NETWORK_ERROR',
      0
    );
  }

  return new ApiError(rawMessage || friendlyMessageFor(status, ''), code, status, body?.error?.details);
}

// ---- Refresh-token-on-401 handling ----
// A single in-flight refresh is shared across concurrent 401s so we don't
// fire multiple refresh requests for one expired token.
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string; refreshToken: string }>(
        `${baseURL || '/api/v1'}/auth/refresh`,
        { refreshToken }
      )
      .then((res) => {
        setTokens(res.data.accessToken, res.data.refreshToken);
        return res.data.accessToken;
      })
      .catch(() => {
        clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

let onUnauthorized: (() => void) | null = null;
// Called once from AuthContext so this module can trigger a logout/redirect
// without importing React context logic here.
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      const newToken = await attemptRefresh();
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient(original);
      }
      clearTokens();
      onUnauthorized?.();
    } else if (status === 401 && isAuthEndpoint) {
      // Login/refresh itself failed - nothing to retry, just surface it.
    } else if (status === 401) {
      clearTokens();
      onUnauthorized?.();
    }

    return Promise.reject(normalizeError(error));
  }
);
