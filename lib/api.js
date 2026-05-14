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
    // Only force-logout when an *authenticated* request expires, not on login failures
    if (err.response?.status === 401 && Cookies.get('token')) {
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
  verifyOtp: (email, otpCode) =>
    api.post('/auth/verify-otp', { email, otpCode }),
  resendOtp: (email) =>
    api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otpCode) =>
    api.post('/auth/verify-reset-otp', { email, otpCode }),
  resetPassword: (resetToken, newPassword) =>
    api.post('/auth/reset-password', { resetToken, newPassword }),
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
