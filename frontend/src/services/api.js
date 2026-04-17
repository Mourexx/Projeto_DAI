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

// UC5 – Estatísticas e Análise
export const statsApi = {
  getOverview:      () => api.get('/stats/overview'),
  getTicketsByType: () => api.get('/stats/tickets-by-type'),
  getOccupancy:     () => api.get('/stats/occupancy'),
  getViagens:       () => api.get('/stats/viagens'),
  getAlerts:        () => api.get('/stats/alerts'),   // UC6
}

// UC2 – Bilhética
export const ticketsApi = {
  buy:          (data)     => api.post('/tickets/', data),
  getMyTickets: ()         => api.get('/tickets/me'),
  validate:     (ticketId) => api.post(`/tickets/${ticketId}/validate`),
  getAll:       ()         => api.get('/tickets/all'),           // UC2.4 admin
}

// UC4 – Transportes
export const transportsApi = {
  list:   ()         => api.get('/transports/'),
  get:    (id)       => api.get(`/transports/${id}`),
  create: (data)     => api.post('/transports/', data),
  update: (id, data) => api.patch(`/transports/${id}`, data),
  delete: (id)       => api.delete(`/transports/${id}`),
}

// UC1 – Utilizadores
export const usersApi = {
  me:               ()           => api.get('/users/me'),
  list:             ()           => api.get('/users/'),
  updatePermissions: (id, isAdmin) => api.patch(`/users/${id}/permissions?is_admin=${isAdmin}`),
  deactivate:       (id)         => api.delete(`/users/${id}`),
}

export default api
