// Winner API functions for TenderLink
import { API_BASE } from './api.js';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Select a winner for a tender
export async function selectWinner(tenderId, bidId) {
  const res = await fetch(`${API_BASE}/winners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tenderId, bidId }),
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to select winner');
  }
  return res.json();
}

// Get winner for a specific tender
export async function getWinner(tenderId) {
  const res = await fetch(`${API_BASE}/winners/tender/${tenderId}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch winner');
  }
  return res.json();
}

// Get all winners (admin only)
export async function getAllWinners() {
  try {
    const res = await fetch(`${API_BASE}/winners`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    // Handle different response codes
    if (res.status === 404) {
      // No winners yet
      return [];
    }
    
    if (res.status === 500) {
      console.warn("Winners API returned 500 error - endpoint might not be fully implemented");
      return [];
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error("Winners API error:", errorData);
      return [];
    }
    
    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error("Error fetching winners:", err);
    return []; // Return empty array on error to prevent UI crashes
  }
}

// Notify a winner (optional, if supported by backend)
export async function notifyWinner(winnerId) {
  const res = await fetch(`${API_BASE}/winners/notify/${winnerId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to notify winner');
  }
  return res.json();
}
