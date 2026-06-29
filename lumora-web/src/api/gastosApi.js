import { api } from './apiClient'

function toFrontend(g) {
  return {
    id: g.id,
    eventId: g.eventId ?? null,
    eventoNombre: g.eventoNombre ?? '',
    descripcion: g.descripcion,
    monto: g.monto,
    categoria: g.categoria,
    fecha: g.fecha,
    fechaISO: new Date(g.fecha).toISOString().slice(0, 10),
    notas: g.notas ?? '',
  }
}

function ingresoToFrontend(p) {
  return {
    id: p.id,
    eventId: p.eventId,
    eventoNombre: p.eventoNombre,
    clienteNombre: p.clienteNombre,
    concepto: p.concepto,
    monto: p.monto,
    metodo: p.metodo,
    fecha: p.fecha,
    fechaISO: new Date(p.fecha).toISOString().slice(0, 10),
  }
}

export const gastosApi = {
  getAll: ({ desde, hasta } = {}) => {
    const params = [desde && `desde=${desde}`, hasta && `hasta=${hasta}`].filter(Boolean).join('&')
    return api.get(`/api/gastos${params ? `?${params}` : ''}`).then(r => r.map(toFrontend))
  },
  getIngresos: ({ desde, hasta } = {}) => {
    const params = [desde && `desde=${desde}`, hasta && `hasta=${hasta}`].filter(Boolean).join('&')
    return api.get(`/api/gastos/ingresos${params ? `?${params}` : ''}`).then(r => r.map(ingresoToFrontend))
  },
  create: (data) => api.post('/api/gastos', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/gastos/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/gastos/${id}`),
}
