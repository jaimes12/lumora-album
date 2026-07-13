import { api } from './apiClient'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function summaryToFrontend(t) {
  return {
    id: t.id,
    nombre: t.name,
    destino: t.destination,
    salida: fmtDate(t.departureDate),
    regreso: fmtDate(t.returnDate),
    precioPorPersona: t.pricePerPerson,
    asientosTotal: t.seatsTotal,
    asientosOcupados: t.seatsTaken ?? 0,
    portada: t.coverPhotoUrl,
    agenciaNombre: t.agencyName,
    agenciaCiudad: t.agencyCity,
    precioOferta: t.offerPrice ?? null,
  }
}

function detailToFrontend(t) {
  return {
    id: t.id,
    nombre: t.name,
    destino: t.destination,
    salida: fmtDate(t.departureDate),
    regreso: fmtDate(t.returnDate),
    precioPorPersona: t.pricePerPerson,
    asientosTotal: t.seatsTotal,
    asientosOcupados: t.seatsTaken ?? 0,
    descripcion: t.description ?? '',
    incluye: t.includes ?? [],
    ubicacion: t.location ?? '',
    precioOferta: t.offerPrice ?? null,
    fotos: (t.photos ?? []).map(p => ({ id: p.id, url: p.url, caption: p.caption })),
    agenciaNombre: t.agencyName,
    agenciaCiudad: t.agencyCity,
    agenciaTelefono: t.agencyPhone,
    agenciaEmail: t.agencyEmail,
  }
}

export const marketplaceApi = {
  getTrips: (destino) => {
    const params = destino ? `?destino=${encodeURIComponent(destino)}` : ''
    return api.get(`/api/marketplace/trips${params}`).then(r => r.map(summaryToFrontend))
  },
  getTrip: (id) => api.get(`/api/marketplace/trips/${id}`).then(detailToFrontend),
  sendInquiry: (id, data) => api.post(`/api/marketplace/trips/${id}/inquiries`, data),
}
