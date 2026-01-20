import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

// API de Autenticación
export const loginAdmin = (credentials) => api.post('/auth/login', credentials);
export const getCurrentAdmin = () => api.get('/auth/me');

// API de Usuarios
export const createUser = (userData) => api.post('/users/', userData);
export const getUsers = () => api.get('/users/');

// API de Rifas
export const createRaffle = (raffleData) => api.post('/raffles/', raffleData);
export const getRaffles = (activeOnly = true) => api.get(`/raffles/?active_only=${activeOnly}`);
export const getRaffle = (id) => api.get(`/raffles/${id}`);
export const completeRaffle = (id) => api.put(`/raffles/${id}/complete`);
export const deleteRaffle = (id) => api.delete(`/raffles/${id}`); // NUEVO

// API de Tickets
export const purchaseTickets = (purchaseData) => api.post('/tickets/purchase', purchaseData);
export const getUserTickets = (userId) => api.get(`/tickets/user/${userId}`);
export const getRaffleTickets = (raffleId) => api.get(`/tickets/raffle/${raffleId}`);

// API de Sorteos
export const performDraw = (drawData) => api.post('/draw', drawData);
export const getRaffleWinners = (raffleId) => api.get(`/winners/raffle/${raffleId}`);
export const getWhatsAppLinks = (raffleId) => api.get(`/winners/${raffleId}/whatsapp-links`);
export const markWinnerNotified = (winnerId) => api.put(`/winners/${winnerId}/mark-notified`);

// API de Estadísticas
export const getRaffleStats = (raffleId) => api.get(`/stats/raffle/${raffleId}`);
export const getStatsOverview = () => api.get('/stats/overview');

// API de Administración
export const createAdmin = (adminData) => api.post('/admin/admins/', adminData);
export const getAdmins = () => api.get('/admin/admins/');
export const updateAdmin = (adminId, adminData) => api.put(`/admin/admins/${adminId}`, adminData); // NUEVO
export const deleteAdmin = (adminId) => api.delete(`/admin/admins/${adminId}`); // NUEVO

export default api;