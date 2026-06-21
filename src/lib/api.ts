const API_BASE = 'http://localhost:3001/api';

// Token management
export const tokenManager = {
  get: () => localStorage.getItem('jailbreak_token'),
  set: (token: string) => localStorage.setItem('jailbreak_token', token),
  remove: () => localStorage.removeItem('jailbreak_token'),
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const token = tokenManager.get();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (err) {
    return { error: 'Network error. Is the server running?' };
  }
}

// Auth API
export const authApi = {
  register: (email: string, username: string, password: string, displayName?: string) =>
    apiRequest<{ user: User; token: string; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, displayName }),
    }),

  login: (email: string, password: string) =>
    apiRequest<{ user: User; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiRequest<{ user: User }>('/auth/me'),

  updateProfile: (updates: Partial<User>) =>
    apiRequest<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Posts API
export const postsApi = {
  getAll: (limit = 50, offset = 0) =>
    apiRequest<{ posts: PostWithUser[] }>(`/posts?limit=${limit}&offset=${offset}`),

  create: (content: string, replyToId?: string) =>
    apiRequest<{ post: PostWithUser; message: string }>('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, replyToId }),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),

  like: (id: string) =>
    apiRequest<{ message: string; liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),

  unlike: (id: string) =>
    apiRequest<{ message: string; liked: boolean }>(`/posts/${id}/like`, { method: 'DELETE' }),
};

// Users API
export const usersApi = {
  getAll: () => apiRequest<{ users: User[] }>('/users'),

  getByUsername: (username: string) =>
    apiRequest<{ user: User }>(`/users/${username}`),

  getPosts: (username: string) =>
    apiRequest<{ posts: PostWithUser[]; user: User }>(`/users/${username}/posts`),

  follow: (username: string) =>
    apiRequest<{ message: string; following: boolean }>(`/users/${username}/follow`, {
      method: 'POST',
    }),

  unfollow: (username: string) =>
    apiRequest<{ message: string; following: boolean }>(`/users/${username}/follow`, {
      method: 'DELETE',
    }),

  // Bot verification
  setBotStatus: (username: string, isBot: boolean, botDescription?: string) =>
    apiRequest<{ user: User; message: string }>(`/users/${username}/bot`, {
      method: 'POST',
      body: JSON.stringify({ isBot, botDescription }),
    }),

  getBotStatus: (username: string) =>
    apiRequest<{ isBot: boolean; botVerified: boolean; botDescription?: string }>(
      `/users/${username}/bot`
    ),
};

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isBot?: boolean;
  botVerified?: boolean;
  botDescription?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  replyToId?: string | null;
  createdAt: string;
  likesCount: number;
  repliesCount?: number;
}

export interface PostWithUser extends Post {
  user: User;
}
