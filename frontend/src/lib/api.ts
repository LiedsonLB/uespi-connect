// frontend/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://177.136.252.12';

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  // Garante que o endpoint comece com /api
  let fullEndpoint = endpoint;
  if (!endpoint.startsWith('/api')) {
    fullEndpoint = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  const url = `${API_BASE_URL}${fullEndpoint}`;
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