import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed API helpers
export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

export const productsAPI = {
  getAll: (params?: any) => api.get('/admin/products', { params }),
  getOne: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: any) => api.post('/admin/products', data),
  update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  bulkDelete: (ids: string[]) => api.post('/admin/products/bulk-delete', { ids }),
  bulkArchive: (ids: string[], active: boolean) => api.post('/admin/products/bulk-archive', { ids, active }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/admin/products/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const categoriesAPI = {
  getAll: (params?: any) => api.get('/admin/categories', { params }),
  create: (data: any) => api.post('/admin/categories', data),
  update: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

export const floorsAPI = {
  getAll: () => api.get('/admin/floors'),
  create: (data: any) => api.post('/admin/floors', data),
  update: (id: string, data: any) => api.put(`/admin/floors/${id}`, data),
  delete: (id: string) => api.delete(`/admin/floors/${id}`),
};

export const tablesAPI = {
  getAll: (params?: any) => api.get('/admin/tables', { params }),
  create: (data: any) => api.post('/admin/tables', data),
  update: (id: string, data: any) => api.put(`/admin/tables/${id}`, data),
  delete: (id: string) => api.delete(`/admin/tables/${id}`),
};

export const employeesAPI = {
  getAll: (params?: any) => api.get('/admin/employees', { params }),
  create: (data: any) => api.post('/admin/employees', data),
  update: (id: string, data: any) => api.put(`/admin/employees/${id}`, data),
  resetPassword: (id: string, newPassword: string) => api.post(`/admin/employees/${id}/reset-password`, { newPassword }),
  delete: (id: string) => api.delete(`/admin/employees/${id}`),
};

export const customersAPI = {
  getAll: (params?: any) => api.get('/admin/customers', { params }),
  create: (data: any) => api.post('/admin/customers', data),
  update: (id: string, data: any) => api.put(`/admin/customers/${id}`, data),
  delete: (id: string) => api.delete(`/admin/customers/${id}`),
  getHistory: (id: string) => api.get(`/admin/customers/${id}/history`),
};

export const paymentMethodsAPI = {
  getAll: (params?: any) => api.get('/admin/payment-methods', { params }),
  create: (data: any) => api.post('/admin/payment-methods', data),
  update: (id: string, data: any) => api.put(`/admin/payment-methods/${id}`, data),
  delete: (id: string) => api.delete(`/admin/payment-methods/${id}`),
};

export const couponsAPI = {
  getAll: () => api.get('/admin/coupons'),
  create: (data: any) => api.post('/admin/coupons', data),
  update: (id: string, data: any) => api.put(`/admin/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/admin/coupons/${id}`),
  validate: (code: string, order_total: number) => api.post('/admin/coupons/validate', { code, order_total }),
};

export const promotionsAPI = {
  getAll: () => api.get('/admin/promotions'),
  getActive: () => api.get('/admin/promotions/active'),
  create: (data: any) => api.post('/admin/promotions', data),
  update: (id: string, data: any) => api.put(`/admin/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/admin/promotions/${id}`),
};

export const sessionsAPI = {
  getAll: () => api.get('/pos/sessions'),
  getCurrent: () => api.get('/pos/sessions/current'),
  open: (data: any) => api.post('/pos/sessions/open', data),
  close: (id: string, data: any) => api.post(`/pos/sessions/${id}/close`, data),
};

export const ordersAPI = {
  getAll: (params?: any) => api.get('/pos/orders', { params }),
  getOne: (id: string) => api.get(`/pos/orders/${id}`),
  create: (data: any) => api.post('/pos/orders', data),
  update: (id: string, data: any) => api.put(`/pos/orders/${id}`, data),
  cancel: (id: string) => api.post(`/pos/orders/${id}/cancel`),
  sendToKitchen: (id: string) => api.post(`/pos/orders/${id}/send-to-kitchen`),
  processPayment: (id: string, payments: any[]) => api.post(`/pos/orders/${id}/payment`, { payments }),
};

export const kitchenAPI = {
  getTickets: (params?: any) => api.get('/pos/kitchen/tickets', { params }),
  updateTicket: (id: string, stage: string) => api.put(`/pos/kitchen/tickets/${id}`, { stage }),
  updateItemStatus: (itemId: string, kitchen_status: string) => api.put(`/pos/kitchen/items/${itemId}/status`, { kitchen_status }),
};

export const reportsAPI = {
  get: (params?: any) => api.get('/pos/reports', { params }),
};

export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: any) => api.put('/admin/settings', data),
};

export const customerPortalAPI = {
  getDashboard: () => api.get('/customer/dashboard'),
  getOrders: (params?: any) => api.get('/customer/orders', { params }),
  getBookings: () => api.get('/customer/bookings'),
  createBooking: (data: any) => api.post('/customer/bookings', data),
};
