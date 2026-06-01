import { api } from './apiClient'

function toFrontend(v) {
  return {
    id: v.id,
    nombre: v.name,
    categoria: v.category,
    email: v.email ?? '',
    telefono: v.phone ?? '',
    website: v.website ?? '',
    descripcion: v.notes ?? '',
    rating: v.rating,
    isActive: v.isActive,
    ciudad: '',
  }
}

export const proveedoresApi = {
  getAll: (category) => api.get(`/api/vendors${category ? `?category=${category}` : ''}`).then(r => r.map(toFrontend)),
  getById: (id) => api.get(`/api/vendors/${id}`).then(toFrontend),
  create: (data) => api.post('/api/vendors', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/vendors/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/vendors/${id}`),
}
