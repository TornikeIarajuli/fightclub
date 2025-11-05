import { API_BASE_URL, getAuthHeaders } from '../config/api';

// Get current authenticated user
export async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  return response.json();
}

// Get user by ID
export async function getUserById(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

// Get user's matches
export async function getMatches() {
  const response = await fetch(`${API_BASE_URL}/matches`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }

  return response.json();
}

// Get user's gallery
export async function getUserGallery(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/gallery`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch gallery');
  }

  return response.json();
}

// Swipe on a user
export async function swipeUser(targetUserId, isLike) {
  const response = await fetch(`${API_BASE_URL}/swipe`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      target_user_id: targetUserId,
      is_like: isLike
    })
  });

  if (!response.ok) {
    throw new Error('Failed to swipe');
  }

  return response.json();
}

// Update user profile
export async function updateUserProfile(userData) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}

// Record a fight
export async function recordFight(fightData) {
  const response = await fetch(`${API_BASE_URL}/fights/record`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(fightData)
  });

  if (!response.ok) {
    throw new Error('Failed to record fight');
  }

  return response.json();
}
