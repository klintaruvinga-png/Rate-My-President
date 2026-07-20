// RMP API client — typed wrapper around the Express backend (server/).
// Scaffold for RMP-07 (demo <-> backend integration). Components import from here.
// No component is wired to this yet; that is the RMP-07 build step.

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API = `${BASE}/api`;

export interface LeaderboardEntry {
  president_id: string | number;
  name: string;
  likes: number;
  dislikes: number;
  wilson_score: number;
  approval_rate?: number;
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
  createdAt?: string;
  alreadyRegistered?: true;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? body.reason ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // GET /api/leaderboard?window=day|week|all&region=Africa
  getLeaderboard(window: 'day' | 'week' | 'all' = 'all', region?: string): Promise<LeaderboardEntry[]> {
    const q = new URLSearchParams({ window });
    if (region) q.set('region', region);
    return request<LeaderboardEntry[]>(`/leaderboard?${q.toString()}`);
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
  logSwipe(userId: string, cardType: 'home' | 'global', action: 'like' | 'nolike' | 'skip'): Promise<{ allowed: true }> {
    return request<{ allowed: true }>('/swipes/log', {
      method: 'POST',
      body: JSON.stringify({ userId, cardType, action }),
    });
  },

  // POST /api/user/register  { userId }
  registerUser(userId: string): Promise<UserRegisterResponse> {
    return request<UserRegisterResponse>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // POST /api/user/heartbeat  { userId }
  heartbeat(userId: string): Promise<{ success: true; lastSeen: string }> {
    return request<{ success: true; lastSeen: string }>('/user/heartbeat', {
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
