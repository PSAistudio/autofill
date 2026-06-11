import type { ApiResponse, AuthResponse, Profile, FormAnalysis, ClassificationResult, AnalyticsSummary, UserSettings } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const authApi = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const profilesApi = {
  list: () => request<Profile[]>('/profiles'),

  get: (id: string) => request<Profile>(`/profiles/${id}`),

  create: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  update: (id: string, profile: Partial<Profile>) =>
    request<Profile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  delete: (id: string) =>
    request<void>(`/profiles/${id}`, { method: 'DELETE' }),
};

export const formsApi = {
  analyze: (formData: Record<string, string>) =>
    request<FormAnalysis>('/forms/analyze', {
      method: 'POST',
      body: JSON.stringify({ fields: formData }),
    }),
};

export const aiApi = {
  classify: (fields: { name: string; label: string; type: string }[]) =>
    request<ClassificationResult>('/AI/classify', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    }),
};

export const analyticsApi = {
  getSummary: () => request<AnalyticsSummary>('/analytics'),

  track: (event: string, metadata: Record<string, unknown> = {}) =>
    request<void>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event, metadata }),
    }),
};

export const settingsApi = {
  get: () => request<UserSettings>('/settings'),

  update: (settings: Partial<UserSettings>) =>
    request<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
