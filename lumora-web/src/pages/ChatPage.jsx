import { useState } from 'react'
import styles from './ChatPage.module.css'

const CHATS = [
  {
    id: 1,
    nombre: 'Fernanda García',
    avatar: 'FG',
    ultimoMensaje: 'Perfecto, entonces confirmamos el 14 de junio ✓',
    hora: '10:42 am',
    noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Hola! Quería preguntarle sobre los detalles finales de la boda.', tipo: 'in', hora: '10:30 am' },
      { id: 2, texto: 'Claro Fernanda, con gusto. ¿En qué puedo ayudarte?', tipo: 'out', hora: '10:32 am' },
      { id: 3, texto: 'Necesito saber si ya tienen confirmado el mesero extra para el cóctel.', tipo: 'in', hora: '10:35 am' },
      { id: 4, texto: 'Sí, ya está confirmado. Contamos con 8 meseros para el cóctel y 12 para la recepción.', tipo: 'out', hora: '10:38 am' },
      { id: 5, texto: 'Perfecto, entonces confirmamos el 14 de junio ✓', tipo: 'in', hora: '10:42 am' },
    ],
  },
  {
    id: 2,
    nombre: 'Carlos Mendoza',
    avatar: 'CM',
    ultimoMensaje: '¿Pueden enviarme la factura antes del viernes?',
    hora: '9:15 am',
    noLeidos: 2,
    mensajes: [
      { id: 1, texto: 'Buenos días, ¿ya está lista la propuesta para el evento de Q3?', tipo: 'in', hora: '9:00 am' },
      { id: 2, texto: 'Buenos días Carlos. Sí, ya la preparé. Se la envío en unos minutos.', tipo: 'out', hora: '9:05 am' },
      { id: 3, texto: 'Excelente. También necesito que incluyan el servicio de traducción simultánea.', tipo: 'in', hora: '9:10 am' },
      { id: 4, texto: '¿Pueden enviarme la factura antes del viernes?', tipo: 'in', hora: '9:15 am' },
    ],
  },
  {
    id: 3,
    nombre: 'Ana López',
    avatar: 'AL',
    ultimoMensaje: 'Muchas gracias por la cotización 🙏',
    hora: 'Ayer',
    noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Hola buenas tardes, vengo de parte de mi mamá para los XV de Sofía.', tipo: 'in', hora: 'Ayer 3:00 pm' },
      { id: 2, texto: 'Bienvenida Ana. Con gusto te atiendo. ¿Tienes ya una fecha en mente?', tipo: 'out', hora: 'Ayer 3:02 pm' },
      { id: 3, texto: 'Sí, queremos el 22 de junio si todavía está disponible.', tipo: 'in', hora: 'Ayer 3:05 pm' },
      { id: 4, texto: 'Está disponible. Te mando la cotización esta tarde.', tipo: 'out', hora: 'Ayer 3:08 pm' },
      { id: 5, texto: 'Muchas gracias por la cotización 🙏', tipo: 'in', hora: 'Ayer 6:30 pm' },
    ],
  },
  {
    id: 4,
    nombre: 'Valeria Torres',
    avatar: 'VT',
    ultimoMensaje: 'Ok, espero su respuesta',
    hora: 'Lun',
    noLeidos: 1,
    mensajes: [
      { id: 1, texto: 'Hola! Me recomendaron con ustedes para mi boda en julio.', tipo: 'in', hora: 'Lun 11:00 am' },
      { id: 2, texto: 'Hola Valeria, qué gusto. ¿Para qué fecha estás pensando la boda?', tipo: 'out', hora: 'Lun 11:05 am' },
      { id: 3, texto: 'El 22 de julio. Somos aprox 200 personas.', tipo: 'in', hora: 'Lun 11:08 am' },
      { id: 4, texto: 'Ok, espero su respuesta', tipo: 'in', hora: 'Lun 2:00 pm' },
    ],
  },
  {
    id: 5,
    nombre: 'Diego Ramírez',
    avatar: 'DR',
    ultimoMensaje: 'Les escribo la próxima semana para agendar',
    hora: 'Dom',
    noLeidos: 0,
    mensajes: [
      { id: 1, texto: 'Buenas, vi su trabajo en Instagram. Necesito un evento de lanzamiento.', tipo: 'in', hora: 'Dom 4:00 pm' },
      { id: 2, texto: 'Hola Diego! Claro, cuéntame más sobre el evento.', tipo: 'out', hora: 'Dom 4:30 pm' },
      { id: 3, texto: 'Es para agosto, lanzamiento de nuestra app. Como 80 personas.', tipo: 'in', hora: 'Dom 4:35 pm' },
      { id: 4, texto: 'Suena genial. Puedo preparar una propuesta. ¿Cuándo podemos hablar?', tipo: 'out', hora: 'Dom 4:40 pm' },
      { id: 5, texto: 'Les escribo la próxima semana para agendar', tipo: 'in', hora: 'Dom 4:45 pm' },
    ],
  },
]

export default function ChatPage() {
  const [chatActivo, setChatActivo] = useState(CHATS[0])
  const [mensaje, setMensaje] = useState('')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chats</h1>
        <p className={styles.sub}>WhatsApp CRM — {CHATS.filter(c => c.noLeidos > 0).length} conversaciones sin leer</p>
      </div>

      <div className={styles.chatLayout}>
        {/* Chat list */}
        <div className={styles.chatList}>
          <div className={styles.chatListHeader}>
            <div className={styles.chatSearchWrap}>
              <svg className={styles.chatSearchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input className={styles.chatSearch} placeholder="Buscar..." />
            </div>
          </div>
          {CHATS.map(c => (
            <div
              key={c.id}
              className={`${styles.chatItem} ${chatActivo?.id === c.id ? styles.chatItemActive : ''}`}
              onClick={() => setChatActivo(c)}
            >
              <div className={styles.chatAvatar}>{c.avatar}</div>
              <div className={styles.chatItemInfo}>
                <div className={styles.chatItemRow}>
                  <span className={styles.chatItemName}>{c.nombre}</span>
                  <span className={styles.chatItemHora}>{c.hora}</span>
                </div>
                <div className={styles.chatItemRow}>
                  <span className={styles.chatItemMsg}>{c.ultimoMensaje}</span>
                  {c.noLeidos > 0 && (
                    <span className={styles.unreadBadge}>{c.noLeidos}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversation */}
        <div className={styles.conversation}>
          {chatActivo ? (
            <>
              <div className={styles.convHeader}>
                <div className={styles.convAvatar}>{chatActivo.avatar}</div>
                <div className={styles.convName}>{chatActivo.nombre}</div>
                <div className={styles.convActions}>
                  <button className={styles.convActionBtn} title="Llamar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.64 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button className={styles.convActionBtn} title="Info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.messages}>
                {chatActivo.mensajes.map(m => (
                  <div key={m.id} className={`${styles.msgWrap} ${m.tipo === 'out' ? styles.msgWrapOut : ''}`}>
                    <div className={`${styles.bubble} ${m.tipo === 'out' ? styles.bubbleOut : styles.bubbleIn}`}>
                      <p className={styles.bubbleText}>{m.texto}</p>
                      <span className={styles.bubbleHora}>{m.hora}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.inputArea}>
                <button className={styles.attachBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  className={styles.msgInput}
                  placeholder="Escribe un mensaje..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setMensaje('')}
                />
                <button
                  className={styles.sendBtn}
                  onClick={() => setMensaje('')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noChat}>Selecciona una conversación</div>
          )}
        </div>
      </div>
    </div>
  )
}
