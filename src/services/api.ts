
const API_BASE_URL = 'http://localhost:3001/api';

export function setAuthToken(token: string) {
  localStorage.setItem('pz-erp-token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('pz-erp-token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('pz-erp-token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data as T;
}
