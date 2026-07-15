import { api } from './apiClient'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function toFrontendPassenger(p) {
  return {
    id: p.id,
    clienteId: p.clientId,
    clienteNombre: p.clientName ?? '',
    clienteTelefono: p.clientPhone ?? '',
    asientos: p.seats,
    asiento: p.seatNumber ?? '',
    costoTotal: p.totalCost,
    pagado: p.paid,
    pendiente: p.pending,
    estado: p.status,
    notas: p.notes ?? '',
    companions: (p.companions ?? []).map(c => ({ nombre: c.name, esMenor: c.isMinor, edad: c.age })),
    pagos: (p.payments ?? []).map(x => ({
      id: x.id,
      pasajeroId: x.passengerId,
      concepto: x.concept,
      monto: x.amount,
      metodo: x.method,
      fecha: fmtDate(x.paidAt),
    })),
  }
}

function toFrontend(t) {
  return {
    id: t.id,
    nombre: t.name,
    destino: t.destination,
    estado: t.status,
    salida: fmtDate(t.departureDate),
    regreso: fmtDate(t.returnDate),
    salidaISO: new Date(t.departureDate).toISOString().slice(0,10),
    regresoISO: new Date(t.returnDate).toISOString().slice(0,10),
    precioPorPersona: t.pricePerPerson,
    asientosTotal: t.seatsTotal,
    asientosOcupados: t.seatsTaken ?? 0,
    pasajeros: t.passengerCount ?? 0,
    ingresos: t.totalRevenue ?? 0,
    notas: t.notes ?? '',
    createdByName: t.createdByName ?? null,
    publico: t.isPublic ?? false,
    descripcion: t.description ?? '',
    tituloPost: t.postTitle ?? '',
    incluye: t.includes ?? '',
    ubicacion: t.location ?? '',
    precioOferta: t.offerPrice ?? null,
    vistas: t.views ?? 0,
    fotos: (t.photos ?? []).map(p => ({ id: p.id, url: p.url, caption: p.caption, orden: p.sortOrder ?? 0 })),
    pasajerosList: (t.passengers ?? []).map(toFrontendPassenger),
    gastos: (t.expenses ?? []).map(e => ({
      id: e.id,
      concepto: e.concept,
      monto: e.amount,
      pagado: e.paid,
      notas: e.notes ?? '',
    })),
  }
}

export const viajesApi = {
  getAll: (status) => {
    const params = status ? `?status=${status}` : ''
    return api.get(`/api/trips${params}`).then(r => r.map(toFrontend))
  },
  getById: (id) => api.get(`/api/trips/${id}`).then(toFrontend),
  create: (data) => api.post('/api/trips', data).then(toFrontend),
  update: (id, data) => api.patch(`/api/trips/${id}`, data).then(toFrontend),
  delete: (id) => api.delete(`/api/trips/${id}`),
  addPhoto: (tripId, data) => api.post(`/api/trips/${tripId}/photos`, data),
  deletePhoto: (tripId, photoId) => api.delete(`/api/trips/${tripId}/photos/${photoId}`),
  reorderPhotos: (tripId, photoIds) => api.put(`/api/trips/${tripId}/photos/order`, { photoIds }),
  addPassenger: (tripId, data) => api.post(`/api/trips/${tripId}/passengers`, data).then(toFrontendPassenger),
  updatePassenger: (tripId, passengerId, data) => api.patch(`/api/trips/${tripId}/passengers/${passengerId}`, data).then(toFrontendPassenger),
  removePassenger: (tripId, passengerId) => api.delete(`/api/trips/${tripId}/passengers/${passengerId}`),
  addPayment: (tripId, passengerId, data) => api.post(`/api/trips/${tripId}/passengers/${passengerId}/payments`, data),
  updatePayment: (tripId, passengerId, paymentId, data) => api.patch(`/api/trips/${tripId}/passengers/${passengerId}/payments/${paymentId}`, data),
  deletePayment: (tripId, passengerId, paymentId) => api.delete(`/api/trips/${tripId}/passengers/${passengerId}/payments/${paymentId}`),
  getExpenses: (tripId) => api.get(`/api/trips/${tripId}/expenses`),
  addExpense: (tripId, data) => api.post(`/api/trips/${tripId}/expenses`, data),
  updateExpense: (tripId, expenseId, data) => api.patch(`/api/trips/${tripId}/expenses/${expenseId}`, data),
  deleteExpense: (tripId, expenseId) => api.delete(`/api/trips/${tripId}/expenses/${expenseId}`),
}
