// frontend/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// frontend/src/lib/api.ts
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  console.log('📡 API Fetch:', url);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response;
};