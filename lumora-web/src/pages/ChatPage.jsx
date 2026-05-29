import { useState } from 'react'
import styles from './ChatPage.module.css'

const STAGES = [
  { id: 'nuevo',      label: 'Nuevo',              color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { id: 'contactado', label: 'Contactado',          color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { id: 'cotizacion', label: 'Cotización enviada',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { id: 'negociando', label: 'Negociando',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'confirmado', label: 'Confirmado',          color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
]

const LEADS = [
  {
    id: 1, stage: 'nuevo',
    nombre: 'Valeria Torres', avatar: 'VT', telefono: '+52 55 1234 5678',
    evento: 'Boda — Jul 22', presupuesto: '$85,000',
    ultimoMsg: 'Hola! Me recomendaron con ustedes para mi boda en julio.',
    hora: 'Hace 2h', noLeidos: 1,
    mensajes: [
      { id: 1, texto: 'Hola! Me recomendaron con ustedes para mi boda en julio.', tipo: 'in', hora: '11:00 am' },
      { id: 2, texto: 'Hola Valeria, qué gusto. ¿Para qué fecha exactamente?', tipo: 'out', hora: '11:05 am' },
      { id: 3, texto: 'El 22 de julio. Somos aprox 200 personas.', tipo: 'in', hora: '11:08 am' },
      { id: 4, texto: 'Ok, espero su respuesta', tipo: 'in', hora: '2:00 pm' },
    ],
  },
  {
    id: 2, stage: 'nuevo',
    nombre: 'Diego Ramírez', avatar: 'DR', telefono: '+52 55 9876 5432',
    evento: 'Corporativo — Ago', presupuesto: '$42,000',
    ultimoMsg: 'Vi su trabajo en Instagram. Necesito un evento de lanzamiento.',
    hora: 'Ayer', noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Buenas, vi su trabajo en Instagram. Necesito un evento de lanzamiento.', tipo: 'in', hora: 'Dom 4:00 pm' },
      { id: 2, texto: 'Hola Diego! Claro, cuéntame más.', tipo: 'out', hora: 'Dom 4:30 pm' },
      { id: 3, texto: 'Les escribo la próxima semana para agendar.', tipo: 'in', hora: 'Dom 4:45 pm' },
    ],
  },
  {
    id: 3, stage: 'contactado',
    nombre: 'Ana López', avatar: 'AL', telefono: '+52 55 5555 1234',
    evento: 'XV Años — Jun 22', presupuesto: '$68,000',
    ultimoMsg: 'Muchas gracias por la cotización 🙏',
    hora: 'Ayer', noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Hola buenas tardes, vengo para los XV de Sofía.', tipo: 'in', hora: 'Ayer 3:00 pm' },
      { id: 2, texto: 'Bienvenida Ana. ¿Tienes fecha en mente?', tipo: 'out', hora: 'Ayer 3:02 pm' },
      { id: 3, texto: 'El 22 de junio si está disponible.', tipo: 'in', hora: 'Ayer 3:05 pm' },
      { id: 4, texto: 'Está disponible. Te mando cotización esta tarde.', tipo: 'out', hora: 'Ayer 3:08 pm' },
      { id: 5, texto: 'Muchas gracias por la cotización 🙏', tipo: 'in', hora: 'Ayer 6:30 pm' },
    ],
  },
  {
    id: 4, stage: 'contactado',
    nombre: 'Mariana Vega', avatar: 'MV', telefono: '+52 55 3344 5566',
    evento: 'Graduación — Jul 10', presupuesto: '$31,000',
    ultimoMsg: '¿El servicio incluye decoración de mesas?',
    hora: 'Lun', noLeidos: 2,
    mensajes: [
      { id: 1, texto: 'Buen día, buscamos organizar la graduación de medicina.', tipo: 'in', hora: 'Lun 10:00 am' },
      { id: 2, texto: 'Con gusto les ayudamos. ¿Cuántos graduados son?', tipo: 'out', hora: 'Lun 10:10 am' },
      { id: 3, texto: 'Somos 45 con familia, como 180 personas total.', tipo: 'in', hora: 'Lun 10:15 am' },
      { id: 4, texto: '¿El servicio incluye decoración de mesas?', tipo: 'in', hora: 'Lun 11:00 am' },
    ],
  },
  {
    id: 5, stage: 'cotizacion',
    nombre: 'Carlos Mendoza', avatar: 'CM', telefono: '+52 55 7788 9900',
    evento: 'Corporativo — Sep 15', presupuesto: '$120,000',
    ultimoMsg: '¿Pueden enviarme la factura antes del viernes?',
    hora: '9:15 am', noLeidos: 2,
    mensajes: [
      { id: 1, texto: 'Buenos días, ¿ya está lista la propuesta para Q3?', tipo: 'in', hora: '9:00 am' },
      { id: 2, texto: 'Sí, ya la preparé. Se la envío en unos minutos.', tipo: 'out', hora: '9:05 am' },
      { id: 3, texto: 'Incluyan traducción simultánea también.', tipo: 'in', hora: '9:10 am' },
      { id: 4, texto: '¿Pueden enviarme la factura antes del viernes?', tipo: 'in', hora: '9:15 am' },
    ],
  },
  {
    id: 6, stage: 'cotizacion',
    nombre: 'Sofía Herrera', avatar: 'SH', telefono: '+52 55 2233 4455',
    evento: 'Boda — Ago 3', presupuesto: '$95,000',
    ultimoMsg: 'Me parece bien, pero ¿pueden bajar un poco el catering?',
    hora: 'Ayer', noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Ya revisé la cotización que me enviaron.', tipo: 'in', hora: 'Ayer 2:00 pm' },
      { id: 2, texto: '¿Tienes alguna duda o cambio?', tipo: 'out', hora: 'Ayer 2:10 pm' },
      { id: 3, texto: 'Me parece bien, pero ¿pueden bajar un poco el catering?', tipo: 'in', hora: 'Ayer 2:30 pm' },
    ],
  },
  {
    id: 7, stage: 'negociando',
    nombre: 'Roberto Salinas', avatar: 'RS', telefono: '+52 55 6677 8899',
    evento: 'Aniversario — Jun 28', presupuesto: '$58,000',
    ultimoMsg: 'Si incluyen el fotógrafo, cerramos hoy.',
    hora: 'Hoy', noLeidos: 1,
    mensajes: [
      { id: 1, texto: 'La propuesta está bien pero quiero el fotógrafo incluido.', tipo: 'in', hora: '8:00 am' },
      { id: 2, texto: 'Podemos incluir 6 hrs de fotografía con $58k total.', tipo: 'out', hora: '8:30 am' },
      { id: 3, texto: 'Si incluyen el fotógrafo, cerramos hoy.', tipo: 'in', hora: '9:00 am' },
    ],
  },
  {
    id: 8, stage: 'confirmado',
    nombre: 'Fernanda García', avatar: 'FG', telefono: '+52 55 1111 2222',
    evento: 'Boda — Jun 14', presupuesto: '$110,000',
    ultimoMsg: 'Perfecto, entonces confirmamos el 14 de junio ✓',
    hora: '10:42 am', noLeidos: 0,
    mensajes: [
      { id: 1, texto: '¿Ya confirmaron el mesero extra para el cóctel?', tipo: 'in', hora: '10:30 am' },
      { id: 2, texto: 'Sí, 8 meseros para cóctel y 12 para recepción.', tipo: 'out', hora: '10:38 am' },
      { id: 3, texto: 'Perfecto, entonces confirmamos el 14 de junio ✓', tipo: 'in', hora: '10:42 am' },
    ],
  },
  {
    id: 9, stage: 'confirmado',
    nombre: 'Luisa Ortega', avatar: 'LO', telefono: '+52 55 4455 6677',
    evento: 'XV Años — Jul 5', presupuesto: '$74,000',
    ultimoMsg: 'Ya hice el depósito del 50% ✓',
    hora: 'Ayer', noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Ya hice el depósito del 50% ✓', tipo: 'in', hora: 'Ayer 5:00 pm' },
      { id: 2, texto: 'Perfecto Luisa, confirmado. Nos vemos el 5 de julio 🎉', tipo: 'out', hora: 'Ayer 5:10 pm' },
    ],
  },
]

export default function ChatPage() {
  const [leadActivo, setLeadActivo] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [leads, setLeads] = useState(LEADS)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const byStage = (stageId) => leads.filter(l => l.stage === stageId)

  const totalPresupuesto = leads
    .filter(l => l.stage === 'confirmado')
    .reduce((acc, l) => acc + parseInt(l.presupuesto.replace(/[$,]/g, '')), 0)

  const enviarMensaje = () => {
    if (!mensaje.trim() || !leadActivo) return
    const nuevo = { id: Date.now(), texto: mensaje, tipo: 'out', hora: 'Ahora' }
    setLeads(prev => prev.map(l =>
      l.id === leadActivo.id
        ? { ...l, mensajes: [...l.mensajes, nuevo], ultimoMsg: mensaje }
        : l
    ))
    setLeadActivo(prev => ({ ...prev, mensajes: [...prev.mensajes, nuevo] }))
    setMensaje('')
  }

  const moverStage = (leadId, nuevoStage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: nuevoStage } : l))
    if (leadActivo?.id === leadId) setLeadActivo(prev => ({ ...prev, stage: nuevoStage }))
  }

  const handleDragStart = (e, lead) => {
    setDragging(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, stageId) => {
    e.preventDefault()
    if (dragging && dragging.stage !== stageId) moverStage(dragging.id, stageId)
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pipeline de chats</h1>
          <p className={styles.sub}>{leads.length} conversaciones · {leads.filter(l => l.noLeidos > 0).length} sin leer</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>${totalPresupuesto.toLocaleString()}</span>
            <span className={styles.statChipLabel}>Confirmado</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipVal}>{byStage('negociando').length + byStage('cotizacion').length}</span>
            <span className={styles.statChipLabel}>En proceso</span>
          </div>
          <button className={styles.btnNew}>+ Nuevo lead</button>
        </div>
      </div>

      <div className={styles.board}>
        {STAGES.map(stage => {
          const cols = byStage(stage.id)
          return (
            <div
              key={stage.id}
              className={`${styles.column} ${dragOver === stage.id ? styles.columnDragOver : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className={styles.colHeader} style={{ borderColor: stage.color }}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colDot} style={{ background: stage.color }} />
                  <span className={styles.colTitle}>{stage.label}</span>
                </div>
                <span className={styles.colCount} style={{ background: stage.bg, color: stage.color }}>
                  {cols.length}
                </span>
              </div>

              <div className={styles.cards}>
                {cols.map(lead => (
                  <div
                    key={lead.id}
                    className={`${styles.card} ${leadActivo?.id === lead.id ? styles.cardActive : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, lead)}
                    onClick={() => setLeadActivo(lead)}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardAvatar}>{lead.avatar}</div>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{lead.nombre}</span>
                        <span className={styles.cardEvento}>{lead.evento}</span>
                      </div>
                      {lead.noLeidos > 0 && (
                        <span className={styles.unread}>{lead.noLeidos}</span>
                      )}
                    </div>
                    <p className={styles.cardMsg}>{lead.ultimoMsg}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardPresupuesto}>{lead.presupuesto}</span>
                      <span className={styles.cardHora}>{lead.hora}</span>
                    </div>
                  </div>
                ))}

                {cols.length === 0 && (
                  <div className={styles.emptyCol}>Arrastra aquí</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Side panel — conversation */}
      {leadActivo && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelAvatar}>{leadActivo.avatar}</div>
            <div className={styles.panelInfo}>
              <span className={styles.panelName}>{leadActivo.nombre}</span>
              <span className={styles.panelEvento}>{leadActivo.evento} · {leadActivo.presupuesto}</span>
            </div>
            <div className={styles.panelActions}>
              <select
                className={styles.stageSelect}
                value={leadActivo.stage}
                onChange={e => moverStage(leadActivo.id, e.target.value)}
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button className={styles.closeBtn} onClick={() => setLeadActivo(null)}>✕</button>
            </div>
          </div>

          <div className={styles.messages}>
            {leadActivo.mensajes.map(m => (
              <div key={m.id} className={`${styles.msgWrap} ${m.tipo === 'out' ? styles.msgOut : ''}`}>
                <div className={`${styles.bubble} ${m.tipo === 'out' ? styles.bubbleOut : styles.bubbleIn}`}>
                  <p>{m.texto}</p>
                  <span className={styles.hora}>{m.hora}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input
              className={styles.msgInput}
              placeholder="Escribe un mensaje..."
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
            />
            <button className={styles.sendBtn} onClick={enviarMensaje}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
