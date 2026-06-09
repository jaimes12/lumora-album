import { api } from './apiClient'

export const paymentsApi = {
  getConfig: () => api.get('/api/payments/config'),
  createCheckout: (planId) => api.post('/api/payments/checkout', { planId }),
  verifySession: (sessionId) => api.post('/api/payments/verify', { sessionId }),
  applyPromo: (code) => api.post('/api/payments/promo', { code }),
}
