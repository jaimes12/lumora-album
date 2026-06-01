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
      id: m.id,
      texto: m.body,
      tipo: m.direction === 'outbound' ? 'out' : 'in',
      hora: new Date(m.sentAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    })),
  }
}

export const leadsApi = {
  getAll:      (stage) => api.get(`/api/leads${stage ? `?stage=${stage}` : ''}`).then(r => r.map(toFrontend)),
  getById:     (id)    => api.get(`/api/leads/${id}`).then(toFrontend),
  create:      (data)  => api.post('/api/leads', data).then(toFrontend),
  update:      (id, data) => api.patch(`/api/leads/${id}`, data).then(toFrontend),
  delete:      (id)    => api.delete(`/api/leads/${id}`),
  deleteAll:   ()      => api.delete('/api/leads'),
  sendMessage: (id, body, direction = 'outbound') => api.post(`/api/leads/${id}/messages`, { body, direction }),
  markRead:    (id)    => api.patch(`/api/leads/${id}/read`, {}),
}
