import { api } from './apiClient'

export const tasksApi = {
  getAll: ()         => api.get('/api/tasks'),
  create: (text)     => api.post('/api/tasks', { text }),
  toggle: (id)       => api.patch(`/api/tasks/${id}/toggle`, {}),
  delete: (id)       => api.delete(`/api/tasks/${id}`),
}
