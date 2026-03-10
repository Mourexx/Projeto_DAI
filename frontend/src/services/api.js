import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const statsApi = {
  getOverview: () => api.get('/stats/overview'),
  getTicketsByType: () => api.get('/stats/tickets-by-type'),
  getOccupancy: () => api.get('/stats/occupancy'),
}

export const ticketsApi = {
  buy: (data, userId) => api.post(`/tickets/?user_id=${userId}`, data),
  getUserTickets: (userId) => api.get(`/tickets/user/${userId}`),
  validate: (ticketId) => api.post(`/tickets/${ticketId}/validate`),
}

export const transportsApi = {
  list: () => api.get('/transports/'),
  create: (data) => api.post('/transports/', data),
  update: (id, data) => api.patch(`/transports/${id}`, data),
}

export default api
