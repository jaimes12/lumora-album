import { api } from './apiClient'

export const orgSettingsApi = {
  get:    ()     => api.get('/api/org-settings'),
  update: (data) => api.put('/api/org-settings', data),
}
