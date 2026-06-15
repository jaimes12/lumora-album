import { api } from './apiClient'

export const superadminApi = {
  getOverview: () => api.get('/api/superadmin/overview'),
  getOrgs:     () => api.get('/api/superadmin/orgs'),
  getUsers:    () => api.get('/api/superadmin/users'),
  getEvents:   () => api.get('/api/superadmin/events'),
  getClients:  () => api.get('/api/superadmin/clients'),
}
