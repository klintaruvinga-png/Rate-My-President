// RMP API client — typed wrapper around the Express backend (server/).
// Scaffold for RMP-07 (demo <-> backend integration). Components import from here.
// No component is wired to this yet; that is the RMP-07 build step.

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
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

export interface SwipeStatus {
  userId: string;
  date: string;
  limit: number;
  used: number;
  remaining: number;
  locked: boolean;
  nextResetAt?: string;
}

export interface President {
  id: string | number;
  name: string;
  country?: string;
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
  getSwipeStatus(userId: string): Promise<SwipeStatus> {
    return request<SwipeStatus>(`/swipes/status?userId=${encodeURIComponent(userId)}`);
  },

  // POST /api/swipes/log  { userId, cardType, action }
  logSwipe(userId: string, cardType: string, action: 'approve' | 'disapprove' | 'skip'): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/swipes/log', {
      method: 'POST',
      body: JSON.stringify({ userId, cardType, action }),
    });
  },

  // POST /api/user/register  { deviceId }
  registerUser(deviceId: string): Promise<UserRegisterResponse> {
    return request<UserRegisterResponse>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
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
