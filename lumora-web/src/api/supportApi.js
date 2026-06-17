import { api } from './apiClient'

export const supportApi = {
  create: (data) => api.post('/api/support', data),
}
