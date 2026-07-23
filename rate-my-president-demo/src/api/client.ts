// RMP API client — typed wrapper around the Express backend (server/).
import type { VoteAction } from '../SwipeCard.types';

// Production API base. Injected at build time via VITE_API_BASE_URL (set in
// .env.production / Vercel). Falls back to the live Railway URL so a deployed
// build always talks to the backend even if the env var is absent. Local dev
// overrides via a .env file (VITE_API_BASE_URL=http://localhost:3001).
const PROD_API_BASE = 'https://rate-my-president-production.up.railway.app';
const BASE = (import.meta.env.VITE_API_BASE_URL ?? PROD_API_BASE).replace(/\/$/, '');
const API = `${BASE}/api`;

export interface ApiLeaderboardEntry {
  president_id: string | number;
  id: string | number;
  name: string;
  country?: string;
  region?: string;
  avatar_url?: string;
  likes: number;
  dislikes: number;
  skips?: number;
  total_votes?: number;
  approval_rate?: number;
  wilson_score?: number;
  rank?: number;
}

// API response shape for GET /api/swipes/status (count/limit/swipes).
export interface SwipeStatusApi {
  count: number;
  limit: number;
  swipes: { cardType: 'home' | 'global'; action: VoteAction }[];
}

// View-model shape the swipe UI consumes (derived from SwipeStatusApi).
export interface SwipeStatusView {
  limit: number;
  used: number;
  remaining: number;
  locked: boolean;
}

// Resolve a backend avatar_url (which may be a relative /avatars/... path) to
// an absolute URL on the FRONTEND origin. The Vercel frontend serves
// /avatars/* statically; the Railway backend does not. If the value is already
// absolute, leave it untouched. PNGs are converted to WebP in the build, so
// rewrite the extension to keep payloads small.
export function resolveAvatar(url?: string): string {
  if (!url) return '';
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;

  // Absolute URL: preserve frontend-host URLs, normalize backend-host URLs
  if (/^https?:\/\//i.test(url)) {
    const frontendOrigin = window.location.origin;
    // If URL is already on the frontend host, return it as-is
    if (url.startsWith(frontendOrigin)) return url;

    // Backend-host URL (e.g. Railway API host): extract the path, normalize
    // to frontend origin, and apply .png->.webp rewrite
    try {
      const urlObj = new URL(url);
      const webp = urlObj.pathname.replace(/\.png$/i, '.webp');
      return `${frontendOrigin}${webp}`;
    } catch {
      // Invalid URL, return as-is
      return url;
    }
  }

  // Relative path (e.g. /avatars/x.png) -> prepend the current frontend origin
  // and prefer the compressed .webp asset.
  const rel = url.startsWith('/') ? url : `/${url}`;
  const webp = rel.replace(/\.png$/i, '.webp');
  return `${window.location.origin}${webp}`;
}


export interface President {
  id: string | number;
  name: string;
  country?: string;
  home_country?: string | null;
  party?: string | null;
  region?: string | null;
  date?: string | null;
  active?: number | null;
  avatarUrl?: string;
}

export interface UserRegisterResponse {
  userId: string;
  token?: string;
}

// Thrown when the backend returns a business-rule 400 (e.g. daily limit
// reached, already voted). Carries the server's `allowed`/`reason` so the UI
// can show the correct message instead of a generic "could not be saved".
export class ApiBusinessError extends Error {
  allowed: boolean;
  reason?: string;
  constructor(message: string, allowed: boolean, reason?: string) {
    super(message);
    this.name = 'ApiBusinessError';
    this.allowed = allowed;
    this.reason = reason;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Business-rule 400s from /api/swipes/log carry { allowed:false, reason }.
    if (res.status === 400 && typeof body.allowed === 'boolean') {
      throw new ApiBusinessError(body.reason ?? 'Action not allowed', body.allowed, body.reason);
    }
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // GET /api/leaderboard?window=day|week|all&region=Africa
  getLeaderboard(window: 'day' | 'week' | 'all' = 'all', region?: string): Promise<ApiLeaderboardEntry[]> {
    const q = new URLSearchParams({ window });
    if (region) q.set('region', region);
    return request<ApiLeaderboardEntry[]>(`/leaderboard?${q.toString()}`);
  },

  // GET /api/presidents
  getPresidents(): Promise<President[]> {
    return request<President[]>('/presidents');
  },

  // GET /api/swipes/status?userId=...
  getSwipeStatus(userId: string): Promise<SwipeStatusApi> {
    return request<SwipeStatusApi>(`/swipes/status?userId=${encodeURIComponent(userId)}`);
  },

  // POST /api/swipes/log  { userId, presidentId, cardType, action }
  // Backend returns { allowed: boolean } (and { allowed:false, reason } on
  // limit). The previous { ok: boolean } type was wrong (Devin review).
  logSwipe(userId: string, presidentId: string, cardType: 'home' | 'global', action: 'like' | 'nolike' | 'skip'): Promise<{ allowed: boolean; reason?: string }> {
    return request<{ allowed: boolean; reason?: string }>('/swipes/log', {
      method: 'POST',
      body: JSON.stringify({ userId, presidentId, cardType, action }),
    });
  },

  // PATCH /api/preferences  { userId, preferences: { home_country, ... } }
  updatePreferences(userId: string, preferences: Record<string, unknown>): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ userId, preferences }),
    });
  },

  // POST /api/user/register  { userId }
  registerUser(deviceId: string): Promise<UserRegisterResponse> {
    return request<UserRegisterResponse>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ userId: deviceId }),
    });
  },

  // POST /api/user/heartbeat  { userId }
  heartbeat(userId: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/user/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // GET /api/geocode?lat=..&lon=..  (proxies Nominatim server-side)
  // Service returns { countryCode } (or null on miss).
  geocode(lat: number, lon: number): Promise<{ countryCode?: string } | null> {
    return request<{ countryCode?: string } | null>(`/geocode?lat=${lat}&lon=${lon}`);
  },
};

export default api;
