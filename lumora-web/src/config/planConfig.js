export const PLAN_NAMES = {
  free:     'Sin plan',
  solo:     'Solo',
  negocio:  'Negocio',
  agencia:  'Agencia',
}

export const PLAN_LIMITS = {
  free: {
    eventos:          0,
    clientes:         0,
    usuarios:         1,
    almacenamientoGB: 0,
    cotizacionesMes:  0,
    whatsapp:         false,
    pipeline:         false,
    reportes:         false,
    firmaDigital:     false,
    api:              false,
    roles:            false,
  },
  solo: {
    eventos:          20,
    clientes:         200,
    usuarios:         1,
    almacenamientoGB: 2,
    cotizacionesMes:  15,
    whatsapp:         false,
    pipeline:         false,
    reportes:         false,
    firmaDigital:     false,
    api:              false,
    roles:            false,
  },
  negocio: {
    eventos:          Infinity,
    clientes:         Infinity,
    usuarios:         3,
    almacenamientoGB: 10,
    cotizacionesMes:  Infinity,
    whatsapp:         true,
    pipeline:         true,
    reportes:         true,
    firmaDigital:     true,
    api:              false,
    roles:            false,
  },
  agencia: {
    eventos:          Infinity,
    clientes:         Infinity,
    usuarios:         10,
    almacenamientoGB: 50,
    cotizacionesMes:  Infinity,
    whatsapp:         true,
    pipeline:         true,
    reportes:         true,
    firmaDigital:     true,
    api:              true,
    roles:            true,
  },
}

// Returns the limits object for a given plan id (falls back to free)
export const getLimits = (planId) => PLAN_LIMITS[planId] ?? PLAN_LIMITS.free

// Check if a feature boolean is enabled
export const canUse = (planId, feature) => getLimits(planId)[feature] === true

// Check if current count is under the plan limit
export const underLimit = (planId, resource, currentCount) => {
  const limit = getLimits(planId)[resource]
  if (limit === Infinity) return true
  return currentCount < limit
}

// Upgrade suggestion: which is the minimum plan that unlocks a feature
export const minPlanFor = (feature) => {
  for (const id of ['solo', 'negocio', 'agencia']) {
    const l = PLAN_LIMITS[id]
    if (typeof l[feature] === 'boolean' ? l[feature] : l[feature] > 0) return id
  }
  return 'agencia'
}
