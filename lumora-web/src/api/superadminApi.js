const BASE = import.meta.env.VITE_API_URL ?? 'https://lumora-api-production.up.railway.app'
const SA_KEY = 'sa_token'

async function saRequest(path, options = {}) {
  const token = localStorage.getItem(SA_KEY)
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(text || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export const superadminApi = {
  login: async (email, password) => {
    const res = await saRequest('/api/superadmin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(SA_KEY, res.token)
    return res
  },
  logout: () => localStorage.removeItem(SA_KEY),
  hasSession: () => !!localStorage.getItem(SA_KEY),

  getOverview:   () => saRequest('/api/superadmin/overview'),
  getVentas:     () => saRequest('/api/superadmin/ventas'),
  getOrgs:       () => saRequest('/api/superadmin/orgs'),
  getUsers:      () => saRequest('/api/superadmin/users'),
  getEvents:     () => saRequest('/api/superadmin/events'),
  getClients:    () => saRequest('/api/superadmin/clients'),
  getPlans:      () => saRequest('/api/superadmin/plans'),
  changePlan:    (orgId, plan) => saRequest(`/api/superadmin/orgs/${orgId}/plan`, {
    method: 'PUT',
    body: JSON.stringify({ plan }),
  }),

  getPlanConfigs:   ()           => saRequest('/api/superadmin/plan-configs'),
  updatePlanConfig: (planId, d) => saRequest(`/api/superadmin/plan-configs/${planId}`, { method: 'PUT', body: JSON.stringify(d) }),

  getPromoCodes:    ()       => saRequest('/api/superadmin/promo-codes'),
  createPromoCode:  (data)   => saRequest('/api/superadmin/promo-codes', { method: 'POST', body: JSON.stringify(data) }),
  updatePromoCode:  (id, d)  => saRequest(`/api/superadmin/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  togglePromoCode:  (id)     => saRequest(`/api/superadmin/promo-codes/${id}/toggle`, { method: 'PATCH' }),
  deletePromoCode:  (id)     => saRequest(`/api/superadmin/promo-codes/${id}`, { method: 'DELETE' }),

  disableOrg: (orgId) => saRequest(`/api/superadmin/orgs/${orgId}/disable`, { method: 'PATCH' }),
  deleteOrg:  (orgId) => saRequest(`/api/superadmin/orgs/${orgId}`, { method: 'DELETE' }),

  getSupportTickets:      ()           => saRequest('/api/superadmin/support'),
  getSupportTicket:       (id)         => saRequest(`/api/superadmin/support/${id}`),
  updateSupportStatus:    (id, status) => saRequest(`/api/superadmin/support/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  replyToTicket:          (id, message) => saRequest(`/api/superadmin/support/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  deleteSupportTicket:    (id)         => saRequest(`/api/superadmin/support/${id}`, { method: 'DELETE' }),
}
