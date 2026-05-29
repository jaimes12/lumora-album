import { useState, useRef, useEffect } from 'react'
import styles from './ProveedoresPage.module.css'

const PROVEEDORES = [
  { id: 1, nombre: 'Florería Primavera',       categoria: 'Decoración',     rating: 5, telefono: '+52 55 1234 0001', descripcion: 'Especialistas en arreglos florales y decoración de bodas y XV años. Más de 15 años de experiencia.',           ciudad: 'CDMX' },
  { id: 2, nombre: 'DJ Maestro Beats',          categoria: 'Música',         rating: 4, telefono: '+52 55 2345 0002', descripcion: 'DJs profesionales para todo tipo de eventos. Equipo de sonido de alta calidad incluido.',                   ciudad: 'CDMX' },
  { id: 3, nombre: 'Catering El Sabor',         categoria: 'Catering',       rating: 5, telefono: '+52 81 3456 0003', descripcion: 'Servicio de banquetes y catering gourmet. Menús personalizados para eventos desde 50 hasta 1000 personas.', ciudad: 'Monterrey' },
  { id: 4, nombre: 'Foto & Video Artístico',   categoria: 'Fotografía',     rating: 5, telefono: '+52 55 4567 0004', descripcion: 'Fotografía y video artístico para bodas y eventos especiales. Edición incluida, entrega en 30 días.',        ciudad: 'CDMX' },
  { id: 5, nombre: 'Iluminación Espectacular', categoria: 'Iluminación',    rating: 4, telefono: '+52 33 5678 0005', descripcion: 'Diseño e instalación de iluminación para eventos. Efectos especiales y pistas LED.',                        ciudad: 'Guadalajara' },
  { id: 6, nombre: 'Transportes VIP',          categoria: 'Transporte',     rating: 4, telefono: '+52 55 6789 0006', descripcion: 'Limosinas, camionetas de lujo y autobuses para traslado de invitados.',                                    ciudad: 'CDMX' },
  { id: 7, nombre: 'Pastelería Dulce Momento', categoria: 'Pastelería',     rating: 5, telefono: '+52 55 7890 0007', descripcion: 'Pasteles personalizados para bodas, XV años y eventos especiales. Degustación sin costo.',                  ciudad: 'CDMX' },
  { id: 8, nombre: 'Mariachi Las Estrellas',   categoria: 'Música',         rating: 4, telefono: '+52 33 8901 0008', descripcion: 'Mariachi tradicional con más de 20 años de trayectoria. Disponibles para serenatas y eventos.',             ciudad: 'Guadalajara' },
  { id: 9, nombre: 'Salon Gran Terraza',       categoria: 'Venue',          rating: 5, telefono: '+52 81 9012 0009', descripcion: 'Salón de eventos con capacidad para 400 personas. Estacionamiento propio y valet parking.',                 ciudad: 'Monterrey' },
  { id: 10, nombre: 'Show Pirotécnico Luna',   categoria: 'Entretenimiento',rating: 4, telefono: '+52 55 0123 0010', descripcion: 'Fuegos artificiales y pirotecnia fría para interiores. Totalmente certificados y seguros.',                  ciudad: 'CDMX' },
]

const CATEGORIAS = ['Todas','Decoración','Música','Catering','Fotografía','Iluminación','Transporte','Pastelería','Venue','Entretenimiento']

const CAT_COLOR = {
  Decoración:'#f472b6', Música:'#34d399', Catering:'#fb923c', Fotografía:'#a78bfa',
  Iluminación:'#fbbf24', Transporte:'#94a3b8', Pastelería:'#f9a8d4', Venue:'#38bdf8',
  Entretenimiento:'#c084fc',
}

const MOCK_CHATS = {
  1: [{ id:1, texto:'Hola! Tenemos disponibilidad para junio 🌸', tipo:'in', hora:'10:00 am' }, { id:2, texto:'¿Con cuánto tiempo de anticipación necesitan el montaje?', tipo:'out', hora:'10:10 am' }, { id:3, texto:'Con 3 horas está perfecto.', tipo:'in', hora:'10:15 am' }],
  2: [{ id:1, texto:'Buenos días, ¿ya tienen el setlist listo?', tipo:'out', hora:'9:00 am' }, { id:2, texto:'Sí, se los mando esta tarde para revisión.', tipo:'in', hora:'9:30 am' }],
  3: [{ id:1, texto:'Confirmado el menú degustación para 180 personas 🍽️', tipo:'in', hora:'Ayer 2:00 pm' }, { id:2, texto:'Perfecto, incluyan mesa vegetariana.', tipo:'out', hora:'Ayer 2:10 pm' }, { id:3, texto:'Anotado, sin problema.', tipo:'in', hora:'Ayer 2:15 pm' }],
  4: [{ id:1, texto:'¿A qué hora llego para el montaje del equipo?', tipo:'in', hora:'Lun 8:00 am' }, { id:2, texto:'A las 3pm, el evento es a las 6pm.', tipo:'out', hora:'Lun 8:20 am' }],
  5: [{ id:1, texto:'¿Qué colores de luz prefieren para el salón?', tipo:'in', hora:'Mar 11:00 am' }, { id:2, texto:'Blanco cálido + acentos violeta por favor.', tipo:'out', hora:'Mar 11:15 am' }, { id:3, texto:'¡Quedará espectacular! 🎆', tipo:'in', hora:'Mar 11:20 am' }],
  6: [{ id:1, texto:'Tenemos 3 camionetas disponibles para esa fecha.', tipo:'in', hora:'Mié 9:00 am' }],
  7: [{ id:1, texto:'¿El pastel lleva gluten? Tenemos invitados celíacos.', tipo:'out', hora:'Jue 4:00 pm' }, { id:2, texto:'Podemos hacer piso sin gluten sin costo extra.', tipo:'in', hora:'Jue 4:30 pm' }],
  8: [{ id:1, texto:'Confirmamos 2 horas de show para su evento 🎺', tipo:'in', hora:'Vie 10:00 am' }],
  9: [{ id:1, texto:'El salón está reservado. ¿Necesitan visita previa?', tipo:'in', hora:'Hoy 9:00 am' }, { id:2, texto:'Sí, ¿podemos ir el jueves a las 4pm?', tipo:'out', hora:'Hoy 9:20 am' }, { id:3, texto:'Perfecto, ahí los esperamos.', tipo:'in', hora:'Hoy 9:25 am' }],
  10:[{ id:1, texto:'¿El show es apto para interiores con techo bajo?', tipo:'out', hora:'Lun 3:00 pm' }, { id:2, texto:'Sí, tenemos pirotecnia fría certificada para interiores.', tipo:'in', hora:'Lun 3:30 pm' }],
}

/* ── Chat Modal ── */
function ChatModal({ proveedor, onClose }) {
  const [msgs, setMsgs]   = useState(MOCK_CHATS[proveedor.id] || [])
  const [texto, setTexto] = useState('')
  const bottomRef         = useRef(null)
  const initials          = proveedor.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').slice(0,2)
  const color             = CAT_COLOR[proveedor.categoria] || '#7c6af7'

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const enviar = () => {
    if (!texto.trim()) return
    setMsgs(m => [...m, { id: Date.now(), texto, tipo:'out', hora:'Ahora' }])
    setTexto('')
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar} style={{ background: color + '28', color }}>
            {initials}
          </div>
          <div className={styles.modalInfo}>
            <span className={styles.modalNombre}>{proveedor.nombre}</span>
            <span className={styles.modalSub} style={{ color }}>
              {proveedor.categoria} · {proveedor.telefono}
            </span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.msgs}>
          {msgs.length === 0 && <p className={styles.msgsEmpty}>Sin mensajes aún. ¡Inicia la conversación!</p>}
          {msgs.map(m => (
            <div key={m.id} className={`${styles.msgWrap} ${m.tipo==='out' ? styles.msgOut : ''}`}>
              <div className={`${styles.bubble} ${m.tipo==='out' ? styles.bubbleOut : styles.bubbleIn}`}>
                <p>{m.texto}</p>
                <span className={styles.bubbleHora}>{m.hora}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            placeholder="Escribe un mensaje..."
            value={texto}
            rows={1}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviar() }}}
          />
          <button className={styles.sendBtn} onClick={enviar} disabled={!texto.trim()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── Stars ── */
function Stars({ rating }) {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i<=rating ? '#fbbf24' : 'none'}
          stroke={i<=rating ? '#fbbf24' : '#4a4a5a'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

/* ── Page ── */
export default function ProveedoresPage() {
  const [catActiva, setCatActiva] = useState('Todas')
  const [chatProveedor, setChatProveedor] = useState(null)

  const filtrados = catActiva === 'Todas' ? PROVEEDORES : PROVEEDORES.filter(p => p.categoria === catActiva)

  return (
    <div className={styles.page}>
      {chatProveedor && <ChatModal proveedor={chatProveedor} onClose={() => setChatProveedor(null)} />}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Proveedores</h1>
          <p className={styles.sub}>{PROVEEDORES.length} proveedores en tu directorio</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo proveedor
        </button>
      </div>

      <div className={styles.catFilters}>
        {CATEGORIAS.map(cat => (
          <button key={cat} onClick={() => setCatActiva(cat)}
            className={`${styles.catBtn} ${catActiva===cat ? styles.catBtnActive : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtrados.map(p => {
          const color = CAT_COLOR[p.categoria] || '#7c6af7'
          const initials = p.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').slice(0,2)
          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardAvatar} style={{ background: color+'22', color }}>
                  {initials}
                </div>
                <div className={styles.cardTitles}>
                  <h3 className={styles.cardName}>{p.nombre}</h3>
                  <span className={styles.catTag} style={{ color, background: color+'18' }}>{p.categoria}</span>
                </div>
                {/* Chat button */}
                <button
                  className={styles.chatBtn}
                  onClick={() => setChatProveedor(p)}
                  title="Enviar mensaje"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>

              <p className={styles.cardDesc}>{p.descripcion}</p>

              <div className={styles.cardFooter}>
                <Stars rating={p.rating} />
                <span className={styles.cardCity}>{p.ciudad}</span>
              </div>

              <div className={styles.cardPhone}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.64 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {p.telefono}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
