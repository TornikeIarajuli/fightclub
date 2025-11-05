// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fightmatch-backend.onrender.com';

// Helper function to get auth headers
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Helper function to make authenticated API calls
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = options.headers || getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}
