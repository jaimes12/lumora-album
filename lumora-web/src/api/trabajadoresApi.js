import { api } from './apiClient'

export const trabajadoresApi = {
  getAll:  ()         => api.get('/api/workers'),
  create:  (data)     => api.post('/api/workers', data),
  update:  (id, data) => api.put(`/api/workers/${id}`, data),
  delete:  (id)       => api.delete(`/api/workers/${id}`),
}
