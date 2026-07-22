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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
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
  geocode(lat: number, lon: number): Promise<{ country_code?: string }> {
    return request<{ country_code?: string }>(`/geocode?lat=${lat}&lon=${lon}`);
  },
};

export default api;
