import { api } from './apiClient'

// Convierte EventResponse del backend al formato que usan las páginas
function toFrontend(ev) {
  const d  = new Date(ev.eventDate)
  const dc = new Date(ev.createdAt)
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return {
    id: ev.id,
    nombre: ev.name,
    tipo: ev.type,
    estado: ev.status,  // lead|confirmed|in_progress|done|cancelled
    fecha: `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`,
    hora: d.toTimeString().slice(0,5),
    dateISO: d.toISOString().slice(0, 10),
    createdAtISO: dc.toISOString().slice(0, 10),
    venue: ev.venueId ?? '',
    presupuestoTotal: ev.budget,
    anticipo: ev.payments?.reduce((s,p) => s + p.amount, 0) ?? 0,
    pagos: (ev.payments ?? []).map(p => ({
      id: p.id,
      concepto: p.concept,
      monto: p.amount,
      fecha: new Date(p.paidAt).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }),
      metodo: p.method,
    })),
    invitados: ev.guestCount,
    notas: ev.notes ?? '',
    clienteId: ev.clientId,
    clienteNombre: ev.clientName ?? '',
    clientePhone: ev.clientPhone ?? '',
    createdById: ev.createdById ?? null,
    createdByName: ev.createdByName ?? null,
    proveedorIds: [],
  }
}

export const eventosApi = {
  getAll: (status, clientId) => {
    const params = [status && `status=${status}`, clientId && `clientId=${clientId}`].filter(Boolean).join('&')
    return api.get(`/api/events${params ? `?${params}` : ''}`).then(r => r.map(toFrontend))
  },
  getById: (id) => api.get(`/api/events/${id}`).then(toFrontend),
  create: (data) => api.post('/api/events', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/events/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/events/${id}`),
  addPayment: (id, data) => api.post(`/api/events/${id}/payments`, data),
  // Photos
  getPhotos:   (id)           => api.get(`/api/events/${id}/photos`),
  addPhoto:    (id, imageData, caption) =>
    api.post(`/api/events/${id}/photos`, { imageData, caption: caption || null }),
  deletePhoto: (id, photoId)  => api.delete(`/api/events/${id}/photos/${photoId}`),
}
