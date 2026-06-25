import { api } from './apiClient'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
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
    pasajerosList: (t.passengers ?? []).map(p => ({
      id: p.id,
      clienteId: p.clientId,
      clienteNombre: p.clientName ?? '',
      clienteTelefono: p.clientPhone ?? '',
      asientos: p.seats,
      costoTotal: p.totalCost,
      pagado: p.paid,
      pendiente: p.pending,
      estado: p.status,
      notas: p.notes ?? '',
      pagos: (p.payments ?? []).map(x => ({
        id: x.id,
        pasajeroId: x.passengerId,
        concepto: x.concept,
        monto: x.amount,
        metodo: x.method,
        fecha: fmtDate(x.paidAt),
      })),
    })),
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
  addPassenger: (tripId, data) => api.post(`/api/trips/${tripId}/passengers`, data),
  updatePassenger: (tripId, passengerId, data) => api.patch(`/api/trips/${tripId}/passengers/${passengerId}`, data),
  removePassenger: (tripId, passengerId) => api.delete(`/api/trips/${tripId}/passengers/${passengerId}`),
  addPayment: (tripId, passengerId, data) => api.post(`/api/trips/${tripId}/passengers/${passengerId}/payments`, data),
  deletePayment: (tripId, passengerId, paymentId) => api.delete(`/api/trips/${tripId}/passengers/${passengerId}/payments/${paymentId}`),
  getExpenses: (tripId) => api.get(`/api/trips/${tripId}/expenses`),
  addExpense: (tripId, data) => api.post(`/api/trips/${tripId}/expenses`, data),
  updateExpense: (tripId, expenseId, data) => api.patch(`/api/trips/${tripId}/expenses/${expenseId}`, data),
  deleteExpense: (tripId, expenseId) => api.delete(`/api/trips/${tripId}/expenses/${expenseId}`),
}
