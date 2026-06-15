import { api } from './apiClient'

export const ventasStatsApi = {
  getStats: (mes) => api.get(`/api/ventas/stats${mes ? `?mes=${mes}` : ''}`),
  getMeses: ()    => api.get('/api/ventas/meses'),
}
