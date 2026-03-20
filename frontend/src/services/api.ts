import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Normalise error responses
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; dietary_preferences?: string[] }) =>
    api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: { name?: string; dietary_preferences?: string[]; avatar_url?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/change-password', { current_password, new_password }),
};

// ─── Inventory ──────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: {
    category?: string;
    storage_type?: string;
    expiring_within?: number;
    search?: string;
    show_consumed?: boolean;
    show_wasted?: boolean;
  }) => api.get('/inventory', { params }),

  getById: (id: string) => api.get(`/inventory/${id}`),

  create: (data: {
    name: string;
    category: string;
    quantity: number;
    unit?: string;
    purchase_date?: string;
    expiry_date: string;
    storage_type?: string;
    barcode?: string;
    brand?: string;
    estimated_cost?: number;
    notes?: string;
  }) => api.post('/inventory', data),

  update: (id: string, data: Record<string, unknown>) => api.put(`/inventory/${id}`, data),

  delete: (id: string) => api.delete(`/inventory/${id}`),

  bulkUpdate: (ids: string[], updates: Record<string, unknown>) =>
    api.put('/inventory/bulk', { ids, updates }),

  predictExpiry: (item_name: string, category: string, storage_type?: string) =>
    api.get('/inventory/expiry-prediction', { params: { item_name, category, storage_type } }),
};

// ─── Recipes ────────────────────────────────────────────────────────────────
export const recipesApi = {
  getAll: (params?: { search?: string; difficulty?: string; max_time?: number; dietary_tags?: string }) =>
    api.get('/recipes', { params }),

  getById: (id: string) => api.get(`/recipes/${id}`),

  getRecommendations: () => api.get('/recipes/recommendations'),

  getSaved: () => api.get('/recipes/saved'),

  saveRecipe: (recipe_id: string) => api.post(`/recipes/${recipe_id}/save`),

  unsaveRecipe: (recipe_id: string) => api.delete(`/recipes/${recipe_id}/save`),

  markUsed: (recipe_id: string) => api.post('/recipes/mark-used', { recipe_id }),
};

// ─── Analytics ──────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),

  getWaste: (period?: number) => api.get('/analytics/waste', { params: { period } }),

  getWasteLogs: (page?: number, limit?: number) =>
    api.get('/analytics/waste/logs', { params: { page, limit } }),

  logWaste: (data: {
    item_id?: string;
    item_name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    estimated_cost?: number;
    reason?: string;
  }) => api.post('/analytics/waste/logs', data),

  getSavings: () => api.get('/analytics/savings'),
};

// ─── Shopping ───────────────────────────────────────────────────────────────
export const shoppingApi = {
  getList: (show_purchased?: boolean) => api.get('/shopping', { params: { show_purchased } }),

  addItem: (data: {
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    priority?: number;
    notes?: string;
  }) => api.post('/shopping', data),

  updateItem: (id: string, data: Record<string, unknown>) => api.put(`/shopping/${id}`, data),

  deleteItem: (id: string) => api.delete(`/shopping/${id}`),

  clearPurchased: () => api.delete('/shopping/clear-purchased'),

  autoGenerate: () => api.post('/shopping/auto-generate'),
};

// ─── Community ──────────────────────────────────────────────────────────────
export const communityApi = {
  getPosts: (params?: { post_type?: string; location?: string; page?: number; limit?: number }) =>
    api.get('/community', { params }),

  getPostById: (id: string) => api.get(`/community/${id}`),

  createPost: (data: {
    title: string;
    item_name: string;
    description?: string;
    quantity?: number;
    unit?: string;
    post_type: 'give' | 'sell' | 'trade';
    price?: number;
    location?: string;
    contact_info?: string;
  }) => api.post('/community', data),

  updatePost: (id: string, data: Record<string, unknown>) => api.put(`/community/${id}`, data),

  deletePost: (id: string) => api.delete(`/community/${id}`),

  getMyPosts: () => api.get('/community/my/posts'),
};

export default api;
