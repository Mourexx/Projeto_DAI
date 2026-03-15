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
  getOverview:     () => api.get('/stats/overview'),
  getTicketsByType: () => api.get('/stats/tickets-by-type'),
  getOccupancy:    () => api.get('/stats/occupancy'),
  getViagens:      () => api.get('/stats/viagens'),
}

export const ticketsApi = {
  buy:          (data)     => api.post('/tickets/', data),
  getMyTickets: ()         => api.get('/tickets/me'),
  validate:     (ticketId) => api.post(`/tickets/${ticketId}/validate`),
}

export const transportsApi = {
  list:   ()         => api.get('/transports/'),
  get:    (id)       => api.get(`/transports/${id}`),
  create: (data)     => api.post('/transports/', data),
  update: (id, data) => api.patch(`/transports/${id}`, data),
  delete: (id)       => api.delete(`/transports/${id}`),
}

export const usersApi = {
  me: () => api.get('/users/me'),
}

export default api
