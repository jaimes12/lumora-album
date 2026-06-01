import { api } from './apiClient'

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
}
