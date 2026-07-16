import { api } from './apiClient'

function accountToFrontend(a) {
  return {
    id: a.id,
    nombre: a.name,
    createdAt: a.createdAt,
    numMovimientos: a.entryCount,
    totalIngresos: a.totalIngresos,
    totalGastos: a.totalGastos,
    balance: a.balance,
  }
}

function entryToFrontend(e) {
  return {
    id: e.id,
    accountId: e.accountId,
    fecha: e.entryDate,
    fechaISO: new Date(e.entryDate).toISOString().slice(0, 10),
    concepto: e.concept,
    categoria: e.category ?? '',
    tipo: e.type,
    monto: e.amount,
    tripId: e.tripId ?? null,
    tripNombre: e.tripName ?? '',
    notas: e.notes ?? '',
    createdAt: e.createdAt,
  }
}

export const accountsApi = {
  getAll: () => api.get('/api/accounts').then(r => r.map(accountToFrontend)),
  create: (name) => api.post('/api/accounts', { name }).then(accountToFrontend),
  rename: (id, name) => api.patch(`/api/accounts/${id}`, { name }),
  delete: (id) => api.delete(`/api/accounts/${id}`),

  getEntries: (accountId, { from, to, tripId, type } = {}) => {
    const params = [
      from   && `from=${from}`,
      to     && `to=${to}`,
      tripId && `tripId=${tripId}`,
      type   && `type=${type}`,
    ].filter(Boolean).join('&')
    return api.get(`/api/accounts/${accountId}/entries${params ? `?${params}` : ''}`).then(r => r.map(entryToFrontend))
  },
  addEntry: (accountId, data) => api.post(`/api/accounts/${accountId}/entries`, data).then(entryToFrontend),
  updateEntry: (accountId, entryId, data) => api.patch(`/api/accounts/${accountId}/entries/${entryId}`, data).then(entryToFrontend),
  deleteEntry: (accountId, entryId) => api.delete(`/api/accounts/${accountId}/entries/${entryId}`),
}
