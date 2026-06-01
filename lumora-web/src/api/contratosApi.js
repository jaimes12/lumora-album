import { api } from './apiClient'

const STATUS_ES = { draft: 'borrador', sent: 'enviado', signed: 'firmado', cancelled: 'cancelado' }

function toFrontend(c) {
  return {
    id: c.id,
    template: c.template,
    clienteId: c.clientId,
    cliente: c.clientName ?? c.clientId ?? 'Sin cliente',
    eventoId: c.eventId ?? '',
    evento: c.eventTitle ?? c.eventId ?? 'Sin evento',
    titulo: c.title,
    estado: STATUS_ES[c.status] ?? c.status,
    total: '$' + Number(c.total).toLocaleString('es-MX'),
    totalNum: c.total,
    notas: c.notes ?? '',
    fecha: new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: c.createdAt,
    sentAt: c.sentAt,
    signedAt: c.signedAt,
  }
}

export const contratosApi = {
  getAll: (status) => api.get(`/api/contracts${status ? `?status=${status}` : ''}`).then(r => r.map(toFrontend)),
  getById: (id) => api.get(`/api/contracts/${id}`).then(toFrontend),
  create: (data) => api.post('/api/contracts', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/contracts/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/contracts/${id}`),
}
