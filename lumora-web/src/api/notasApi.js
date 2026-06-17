import { api } from './apiClient'

export const notasApi = {
  getAll:         ()                  => api.get('/api/notas'),
  create:         (content, color)    => api.post('/api/notas', { content, color }),
  remove:         (id)                => api.delete(`/api/notas/${id}`),
  toggleReaction: (id, emoji)         => api.post(`/api/notas/${id}/reactions`, { emoji }),
}
