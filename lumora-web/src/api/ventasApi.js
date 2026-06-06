import { api } from './apiClient'

function toFrontend(s) {
  const fmt = n => '$' + Number(n).toLocaleString('es-MX')
  return {
    id: s.id,
    numero: s.type === 'invoice' ? `FAC-${s.id.slice(0,3).toUpperCase()}` : `COT-${s.id.slice(0,3).toUpperCase()}`,
    cliente: s.clientId,
    clienteNombre: s.clientName ?? s.clientId,
    eventoId: s.eventId ?? null,
    eventoNombre: s.eventName ?? null,
    total: fmt(s.total),
    totalNum: s.total,
    subtotal: s.subtotal,
    impuesto: s.tax,
    pagado: s.paidAmount,
    estado: s.status, // draft|sent|signed|paid|cancelled
    tipo: s.type,     // quote|invoice
    fecha: new Date(s.createdAt).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }),
    items: s.items ?? [],
    notas: s.notes ?? '',
  }
}

export const ventasApi = {
  getAll: (status) => api.get(`/api/sales${status ? `?status=${status}` : ''}`).then(r => r.map(toFrontend)),
  getById: (id) => api.get(`/api/sales/${id}`).then(toFrontend),
  create: (data) => api.post('/api/sales', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/sales/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/sales/${id}`),
}
