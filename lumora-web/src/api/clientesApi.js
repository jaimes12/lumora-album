import { api } from './apiClient'

function toFrontend(c) {
  return {
    id: c.id,
    nombre: c.name,
    email: c.email ?? '',
    telefono: c.phone ?? '',
    empresa: c.company ?? '',
    etapa: c.stage, // lead|prospect|client|vip
    notas: c.notes ?? '',
    tags: c.tags ?? [],
    createdAt: c.createdAt,
    ultimoContacto: c.lastContactAt,
    avatar: c.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase(),
    eventos: 0, // will be enriched if needed
    totalFacturado: '$0',
  }
}

export const clientesApi = {
  getAll: (stage) => api.get(`/api/clients${stage ? `?stage=${stage}` : ''}`).then(r => r.map(toFrontend)),
  getById: (id) => api.get(`/api/clients/${id}`).then(toFrontend),
  create: (data) => api.post('/api/clients', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/clients/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/clients/${id}`),
}
