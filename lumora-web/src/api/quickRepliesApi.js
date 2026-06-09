import { api } from './apiClient'

export const quickRepliesApi = {
  getAll:  ()              => api.get('/api/quick-replies'),
  create:  (title, body)   => api.post('/api/quick-replies', { title, body }),
  update:  (id, title, body) => api.put(`/api/quick-replies/${id}`, { title, body }),
  remove:  (id)            => api.delete(`/api/quick-replies/${id}`),
}
