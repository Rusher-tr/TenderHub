// src/api.js
// Centralized API service for TenderLink frontend

const API_BASE = '/api'; // This will use the proxy configuration from vite.config.js
export { API_BASE }; // Export the API_BASE constant

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function login(payload) {
  if (!payload.role) {
    throw new Error('Role is required for login');
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  if (!data.token || !data.role || data.role !== payload.role) {
    throw new Error('Invalid response from server');
  }
  
  sessionStorage.setItem('auth_token', data.token);
  sessionStorage.setItem('user_role', data.role);
  return data;
}

export async function signup(payload) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Validate stored auth token without full login
export async function validateToken(token) {
  // If no token provided, try to get from sessionStorage
  if (!token) {
    token = sessionStorage.getItem('auth_token');
    if (!token) return false;
  }
  
  try {
    // Check if backend is available first
    const isBackendAvailable = await checkBackendConnection().catch(() => false);
    
    // If backend is not available, use cached auth state
    if (!isBackendAvailable) {
      console.warn('Backend unavailable during token validation, using cached auth state');
      // During development, we'll consider the token valid if it exists
      return !!token;
    }
    
    // Check token validity with the server
    const res = await fetch(`${API_BASE}/auth/validate-token`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    return res.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    // For development, return true to allow frontend testing without backend
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Simulating successful auth');
      return true;
    }
    return false;
  }
}

// Add a utility function to check if backend is connected
export async function checkBackendConnection() {
  try {
    // First try a health check endpoint
    const response = await fetch(`${API_BASE}/health-check`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout to quickly determine if backend is available
      signal: AbortSignal.timeout(1500)
    });
    
    if (response.ok) return true;
    
    // If the health check fails, try a simpler endpoint
    const fallbackResponse = await fetch(`${API_BASE}`, {
      method: 'GET',
      signal: AbortSignal.timeout(1500)
    });
    
    return fallbackResponse.ok;
  } catch (error) {
    console.warn('Backend connection check failed:', error);
    return false;
  }
}

// Tenders
export async function fetchTenders() {
  const token = sessionStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendConnection().catch(() => false);
    
    if (!isBackendAvailable && process.env.NODE_ENV === 'development') {
      console.warn('Backend unavailable, using mock data for development');
      return getMockTenders();
    }
    
    const res = await fetch(`${API_BASE}/tenders/my-tenders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching tenders:', error);
    
    // In development mode, return mock data to allow frontend testing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock data for development');
      return getMockTenders();
    }
    
    throw error;
  }
}

// Add mock data for development when backend is unavailable
function getMockTenders() {
  return [
    {
      tender_id: 1,
      title: 'Mock Project 1',
      description: 'This is a mock tender for development purposes.',
      issue_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Published',
      buyer_name: 'Mock Buyer',
      bids: []
    },
    {
      tender_id: 2,
      title: 'Mock Project 2',
      description: 'Another mock tender for testing the UI.',
      issue_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Pending Approval',
      buyer_name: 'Test Organization',
      bids: []
    },
    {
      tender_id: 3,
      title: 'Mock Completed Project',
      description: 'A mock tender with completed status.',
      issue_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Archived',
      buyer_name: 'Mock Company',
      bids: []
    }
  ];
}

export async function createTender(tender) {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const res = await fetch(`${API_BASE}/tenders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tender),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create tender error:', errorText);
    throw new Error(errorText);
  }

  return res.json();
}

// Fetch published tenders for bidders
export async function fetchPublishedTenders() {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendConnection().catch(() => false);
    
    if (!isBackendAvailable && process.env.NODE_ENV === 'development') {
      console.warn('Backend unavailable, using mock published tenders for development');
      return getMockPublishedTenders();
    }
    
    console.log('Fetching published tenders for bidder');
    
    const res = await fetch(`${API_BASE}/tenders/my-tenders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      // In development mode, fall back to mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to fetch from backend, using mock data');
        return getMockPublishedTenders();
      }
      
      // Regular error handling for production
      let errorMessage = 'Failed to fetch published tenders';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const allTenders = await res.json();
    const publishedTenders = allTenders.filter(tender => tender.status === 'Published');
    
    console.log('Published tenders fetched:', publishedTenders.length);
    return publishedTenders;
  } catch (error) {
    console.error('Error fetching published tenders:', error);
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock published tenders for development');
      return getMockPublishedTenders();
    }
    
    throw error;
  }
}

// Mock published tenders for development
function getMockPublishedTenders() {
  return [
    {
      tender_id: 101,
      title: 'Office Supplies Procurement',
      description: 'Seeking vendor for quarterly office supplies including stationery, paper, and printer materials.',
      issue_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Published',
      buyer_name: 'ABC Corporation',
      bids: []
    },
    {
      tender_id: 102,
      title: 'IT Infrastructure Upgrade',
      description: 'Looking for service provider to upgrade network infrastructure and server systems.',
      issue_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Published',
      buyer_name: 'Tech Solutions Inc',
      bids: []
    },
    {
      tender_id: 103,
      title: 'Catering Services',
      description: 'Catering service needed for company events scheduled throughout the year.',
      issue_date: new Date().toISOString(),
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Published',
      buyer_name: 'EventHost Ltd',
      bids: []
    }
  ];
}

// Bids
export async function placeBid(tenderId, amount) {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    console.log(`Placing bid of $${amount} on tender ${tenderId}`);
    
    const res = await fetch(`${API_BASE}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ tenderId, amount }),
    });

    // Log response for debugging
    console.log(`Bid placement response code: ${res.status}`);
    
    if (!res.ok) {
      let errorMessage = 'Failed to place bid';
      
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If parsing JSON fails, use status text
        errorMessage = res.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    console.log('Bid placed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
}

export async function fetchBidHistory() {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const res = await fetch(`${API_BASE}/bids/my-bids`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch bid history');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching bid history:', error);
    throw error;
  }
}

export async function fetchTenderBids(tenderId) {
  const res = await fetch(`${API_BASE}/bids/tender/${tenderId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Evaluations
export async function scoreBid(bidId, score) {
  const res = await fetch(`${API_BASE}/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ bidId, score }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchBidEvaluations(bidId) {
  const res = await fetch(`${API_BASE}/evaluations/bid/${bidId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Admin
// PATCH endpoint for updating tender status
export async function updateTenderStatus(tenderId, status) {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    console.log(`Updating tender ${tenderId} status to ${status}`);
    
    // Simple POST request with minimal error handling for robustness
    const res = await fetch(`${API_BASE}/tenders/${tenderId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    // Log response for debugging
    console.log(`Status update response code: ${res.status}`);
    
    // Check for specific error status codes
    if (res.status === 400) {
      const error = await res.json();
      throw new Error(error.error || "Invalid status value");
    }
    
    if (res.status === 404) {
      throw new Error("Tender not found");
    }
    
    if (res.status === 500) {
      throw new Error("Server error - please try again later");
    }
    
    if (!res.ok) {
      throw new Error(`Failed to update status: ${res.statusText}`);
    }
    
    // Process successful response
    const data = await res.json();
    console.log('Update success:', data);
    return data;
  } catch (error) {
    console.error('Error updating tender status:', error);
    throw error;
  }
}

// Admin - Get all tenders (admin only)
export async function fetchAllTenders() {
  const token = sessionStorage.getItem('auth_token');
  const userRole = sessionStorage.getItem('user_role');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  if (userRole !== 'Admin') {
    throw new Error('Admin access required');
  }
  
  const res = await fetch(`${API_BASE}/tenders/admin/all-tenders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }
  
  return res.json();
}

// Select a winning bid (Admin only)
export async function selectWinningBid(tenderId, bidId) {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const res = await fetch(`${API_BASE}/winners`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({ tenderId, bidId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to select winning bid');
  }
  return res.json();
}

// Get all winners (Admin only)
export async function fetchAllWinners() {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // First check if backend is available
    const isBackendAvailable = await checkBackendConnection().catch(() => false);
    
    if (!isBackendAvailable) {
      console.warn('Backend server unavailable when fetching winners, returning empty array');
      // Return empty array to allow UI testing
      return [];
    }
    
    const res = await fetch(`${API_BASE}/winners`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      },
      credentials: 'include',
      // Add timeout to prevent hanging when backend is slow
      signal: AbortSignal.timeout(5000)
    });

    // Handle common error codes gracefully
    if (res.status === 404) {
      return [];
    }
    
    if (res.status === 500) {
      console.warn('Winners API error - returning empty array for now');
      return [];
    }
    
    if (!res.ok) {
      return []; // Just return empty array instead of breaking
    }
    
    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error("Winner fetch error:", err);
    return []; // Return empty array instead of throwing
  }
}

// Get winner for a specific tender
export async function fetchTenderWinner(tenderId) {
  const res = await fetch(`${API_BASE}/winners/tender/${tenderId}`, {
    headers: { ...getAuthHeaders() },
    credentials: 'include'
  });

  if (!res.ok) {
    if (res.status === 404) {
      // No winner selected yet, return null instead of throwing
      return null;
    }
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch tender winner');
  }
  return res.json();
}
