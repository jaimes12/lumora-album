import { api } from './apiClient'

export const productosApi = {
  // Catalog
  getAll:    ()           => api.get('/api/products'),
  create:    (data)       => api.post('/api/products', data),
  update:    (id, data)   => api.put(`/api/products/${id}`, data),
  delete:    (id)         => api.delete(`/api/products/${id}`),

  // Event products
  getByEvent:  (eventId)       => api.get(`/api/products/event/${eventId}`),
  addToEvent:  (eventId, data) => api.post(`/api/products/event/${eventId}`, data),
  updateItem:  (id, data)      => api.put(`/api/products/event-item/${id}`, data),
  deleteItem:  (id)            => api.delete(`/api/products/event-item/${id}`),
}
