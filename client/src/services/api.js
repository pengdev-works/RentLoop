const API_BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('rentloop_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (profileData) => apiRequest('/auth/profile', { method: 'PUT', body: profileData }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: data }),

  // User & Identity
  verifyIdentity: (formData) => apiRequest('/users/verify-identity', { method: 'POST', body: formData }),
  getPublicProfile: (userId) => apiRequest(`/users/${userId}/public-profile`),

  // Categories
  getCategories: () => apiRequest('/categories'),
  createCategory: (data) => apiRequest('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: data }),

  // Items
  getItems: (params = '') => apiRequest(`/items${params ? `?${params}` : ''}`),
  getItemById: (id) => apiRequest(`/items/${id}`),
  getItemBookedDates: (id) => apiRequest(`/items/${id}/booked-dates`),
  getMyItems: () => apiRequest('/items/my/listings'),
  createItem: (itemData) => apiRequest('/items', { method: 'POST', body: itemData }),
  updateItem: (id, itemData) => apiRequest(`/items/${id}`, { method: 'PUT', body: itemData }),
  deleteItem: (id) => apiRequest(`/items/${id}`, { method: 'DELETE' }),

  // Rentals
  createRentalRequest: (data) => apiRequest('/rentals/requests', { method: 'POST', body: data }),
  getRenterRequests: () => apiRequest('/rentals/my/renter-requests'),
  getOwnerRequests: () => apiRequest('/rentals/my/owner-requests'),
  approveRequest: (id) => apiRequest(`/rentals/requests/${id}/approve`, { method: 'PUT' }),
  rejectRequest: (id, reason) => apiRequest(`/rentals/requests/${id}/reject`, { method: 'PUT', body: { reason } }),
  cancelRequest: (id) => apiRequest(`/rentals/requests/${id}/cancel`, { method: 'PUT' }),
  getRentalById: (id) => apiRequest(`/rentals/${id}`),
  confirmHandover: (id, data) => apiRequest(`/rentals/${id}/handover`, { method: 'POST', body: data }),
  confirmReturn: (id) => apiRequest(`/rentals/${id}/return`, { method: 'POST' }),

  // Conditions
  submitConditionReport: (formData) => apiRequest('/conditions/reports', { method: 'POST', body: formData }),
  verifyConditionReport: (id) => apiRequest(`/conditions/reports/${id}/verify`, { method: 'PUT' }),

  // Reviews
  createReview: (reviewData) => apiRequest('/reviews', { method: 'POST', body: reviewData }),

  // Reports
  createReport: (reportData) => apiRequest('/reports', { method: 'POST', body: reportData }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'PUT' }),

  // Admin
  getAdminStats: () => apiRequest('/admin/dashboard-stats'),
  getAdminUsers: () => apiRequest('/admin/users'),
  updateUserStatus: (id, data) => apiRequest(`/admin/users/${id}/status`, { method: 'PUT', body: data }),
  getAdminVerifications: (params = '') => apiRequest(`/admin/verifications${params ? `?${params}` : ''}`),
  reviewVerification: (id, data) => apiRequest(`/admin/verifications/${id}/review`, { method: 'PUT', body: data }),
  getAdminRentals: () => apiRequest('/admin/rentals'),
  getAdminReports: () => apiRequest('/admin/reports'),
  resolveAdminReport: (id, data) => apiRequest(`/admin/reports/${id}/resolve`, { method: 'PUT', body: data }),
  getAdminAuditLogs: () => apiRequest('/admin/audit-logs')
};

