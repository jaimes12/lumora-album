import { api } from './apiClient'

// Strip WhatsApp suffixes like @c.us, @s.whatsapp.net, @lid, @g.us
const cleanWaId = (s) => s ? s.replace(/@\S+/g, '').trim() : s

function toFrontend(l) {
  const name = cleanWaId(l.name)
  return {
    id: l.id,
    stage: l.stage,
    nombre: name,
    avatar: name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?',
    telefono: l.phone,
    evento: l.eventType ? `${l.eventType}${l.eventDate ? ' — ' + l.eventDate : ''}` : '',
    // raw values for the edit form
    eventTypeRaw: l.eventType ?? '',
    eventDateRaw: l.eventDate ?? '',
    budgetRaw:    l.budget ?? null,
    presupuesto:  l.budget ? '$' + Number(l.budget).toLocaleString('es-MX') : '$0',
    ultimoMsg: l.lastMessage ?? '',
    hora: l.lastMessageAt ? new Date(l.lastMessageAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '',
    noLeidos: l.unreadCount,
    mensajes: (l.messages ?? []).map(m => ({
      id:        m.id,
      texto:     m.body,
      tipo:      m.direction === 'outbound' ? 'out' : 'in',
      mediaUrl:  m.mediaUrl  ?? null,
      mediaType: m.mediaType ?? null,
      hora: new Date(m.sentAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    })),
  }
}

// Converts a raw API message object to the frontend shape
export function toFrontendMsg(m) {
  return {
    id:        m.id,
    texto:     m.body,
    tipo:      m.direction === 'outbound' ? 'out' : 'in',
    mediaUrl:  m.mediaUrl  ?? null,
    mediaType: m.mediaType ?? null,
    hora: new Date(m.sentAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  }
}

// Finds an existing lead by phone number or creates a new one.
// Returns a frontend-shaped lead ready to display in ChatModal.
export async function findOrCreateLeadByPhone(phone, name) {
  const digits = (phone || '').replace(/\D/g, '')
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits
  if (last10.length < 7) throw new Error('Número de teléfono inválido')

  const all = await leadsApi.getAll()
  const existing = all.find(l => {
    const d = (l.telefono || '').replace(/\D/g, '')
    return d.endsWith(last10)
  })
  if (existing) return existing

  return await leadsApi.create({
    name:      name || digits,
    phone:     digits,
    eventType: null,
    eventDate: null,
    budget:    null,
  })
}

export const leadsApi = {
  getAll:      (stage) => api.get(`/api/leads${stage ? `?stage=${stage}` : ''}`).then(r => r.map(toFrontend)),
  getById:     (id)    => api.get(`/api/leads/${id}`).then(toFrontend),
  // Paginated messages: skip=0, take=20 → newest 20. Increase skip to load older.
  getMessages: (id, skip = 0, take = 20) =>
    api.get(`/api/leads/${id}/messages?skip=${skip}&take=${take}`),
  create:      (data)  => api.post('/api/leads', data).then(toFrontend),
  update:      (id, data) => api.patch(`/api/leads/${id}`, data).then(toFrontend),
  delete:      (id)    => api.delete(`/api/leads/${id}`),
  deleteAll:   ()      => api.delete('/api/leads'),
  sendMessage: (id, body, direction = 'outbound', mediaData = null, mediaType = null) =>
    api.post(`/api/leads/${id}/messages`, { body: body || null, direction, mediaData, mediaType }),
  markRead:    (id)    => api.patch(`/api/leads/${id}/read`, {}),
}
