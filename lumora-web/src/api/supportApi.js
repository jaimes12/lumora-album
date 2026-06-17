import { api } from './apiClient'

export const supportApi = {
  getMyTickets:  ()          => api.get('/api/support'),
  getTicket:     (id)        => api.get(`/api/support/${id}`),
  create:        (data)      => api.post('/api/support', data),
  addMessage:    (id, text)  => api.post(`/api/support/${id}/messages`, { message: text }),
}
