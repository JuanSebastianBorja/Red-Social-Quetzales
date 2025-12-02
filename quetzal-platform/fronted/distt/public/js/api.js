// ============================================
// API.JS - Cliente HTTP para backend Quetzal
// ============================================
import config from './config.js';

const API_BASE_URL = config.api.baseUrl;

function getAuthToken() {
  return localStorage.getItem('quetzal_token');
}

function setAuthToken(token) {
  if (token) localStorage.setItem('quetzal_token', token); else localStorage.removeItem('quetzal_token');
}

function getCurrentUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const cfg = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
      ...(options.headers || {})
    }
  };
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  if (options.body) {
    cfg.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
    if (options.body instanceof FormData) delete cfg.headers['Content-Type'];
  }
  const res = await fetch(url, cfg);
  if (res.status === 204) return null;
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const API = {
  // Auth
  async register(userData) {
    const result = await request('/auth/register', { method: 'POST', body: userData });
    const token = result?.data?.token || result?.token;
    const user = result?.data?.user || result?.user;
    if (token) setAuthToken(token);
    if (user) setCurrentUser(user);
    return result;
  },
  async login(credentials) {
    const result = await request('/auth/login', { method: 'POST', body: credentials });
    const token = result?.data?.token || result?.token;
    const user = result?.data?.user || result?.user;
    if (token) setAuthToken(token);
    if (user) setCurrentUser(user);
    return result;
  },
  // Eliminado: flujo de Supabase ya no se usa
  
  async logout() { await request('/auth/logout', { method: 'POST' }); setAuthToken(null); setCurrentUser(null); },
  async verifyToken() { return request('/auth/verify'); },

  // Users
  async getProfile() { return request('/users/profile'); },
  async updateProfile(profileData) { return request('/users/profile', { method: 'PUT', body: profileData }); },
  async getUser(userId) { return request(`/users/${userId}`); },

  // Services
  async getServices(filters = {}) { const q = new URLSearchParams(filters).toString(); return request(`/services?${q}`); },
  async getService(id) { return request(`/services/${id}`); },
  async createService(data) { return request('/services', { method: 'POST', body: data }); },
  async uploadServiceImages(formData) { return request('/services/upload-images', { method: 'POST', body: formData }); },
  async updateService(id, data) { return request(`/services/${id}`, { method: 'PUT', body: data }); },
  async deleteService(id) { return request(`/services/${id}`, { method: 'DELETE' }); },
  async getMyServices() { return request('/services/my-services'); },

  // Wallet & PSE & ePayco
  async getWalletSummary() { return request('/wallet/summary'); },
  async getTransactions(params = {}) { const q = new URLSearchParams(params).toString(); return request(`/wallet/summary?${q}`); },
  async getPseBanks() { return request('/wallet/pse/banks'); },
  async initPsePayment(data) { return request('/wallet/pse/init', { method: 'POST', body: data }); },
  async initEpaycoPayment(data) { return request('/wallet/epayco/init', { method: 'POST', body: data }); },
  async getPseStatus(reference) { return request(`/wallet/pse/status/${reference}`); },
  async processPseCallback(callbackData) { return request('/wallet/pse/callback', { method: 'POST', body: callbackData }); },

  // Contracts
  async createContract(data) { return request('/contracts', { method: 'POST', body: data }); },
  async getContract(id) { return request(`/contracts/${id}`); },
  async updateContractStatus(id, update) { return request(`/contracts/${id}/status`, { method: 'PUT', body: update }); },
  async getMyPurchases(params = {}) { const q = new URLSearchParams(params).toString(); return request(`/contracts/my/purchases?${q}`); },
  async getMySales(params = {}) { const q = new URLSearchParams(params).toString(); return request(`/contracts/my/sales?${q}`); },

  // Messaging
  async getConversations(params = {}) { const q = new URLSearchParams(params).toString(); return request(`/messages/conversations?${q}`); },
  async getConversation(id) { return request(`/messages/conversations/${id}`); },
  async createConversation(data) { return request('/messages/conversations', { method: 'POST', body: data }); },
  async getMessages(conversationId, params = {}) { const q = new URLSearchParams(params).toString(); return request(`/messages/conversations/${conversationId}/messages?${q}`); },
  async sendMessage(conversationId, data) { return request(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: data }); },
  async markConversationAsRead(conversationId) { return request(`/messages/conversations/${conversationId}/read`, { method: 'PUT' }); },

  // Helpers
  getAuthToken,
  getCurrentUser,
  setAuthToken,
  setCurrentUser,
  request
};

window.API = API; // fallback global
export default API;

// CommonJS support (optional)
if (typeof module !== 'undefined') { module.exports = API; }
