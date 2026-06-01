import { api } from './apiClient'

export const whatsappApi = {
  getStatus:  () => api.get('/api/whatsapp/connection'),
  connect:    () => api.post('/api/whatsapp/connection/connect', {}),
  disconnect: () => api.post('/api/whatsapp/connection/disconnect', {}),
}
