import axios from 'axios';
import Cookies from 'js-cookie';

const BASE = '/api/backend';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (data, role = 'USER') =>
    api.post(`/auth/register?role=${role}`, data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getCards: () => api.get('/dashboard'),
};

// ─── PDF ─────────────────────────────────────────────────────────────────────
export const pdfApi = {
  upload: (files, sessionId) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const endpoint = sessionId ? `/pdf/upload/${sessionId}` : '/pdf/upload';
    return api.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getResult: (jobId) => api.get(`/pdf/result/${jobId}`),
  getMyResults: () => api.get('/pdf/my-results'),
  getSessionResults: (sessionId) => api.get(`/pdf/session/${sessionId}`),
};

// ─── Session ─────────────────────────────────────────────────────────────────
export const sessionApi = {
  create: (data) => api.post('/session', data),
  getAll: () => api.get('/session/all'),
};

export default api;
