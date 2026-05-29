import { useState } from 'react'
import styles from './ProveedoresPage.module.css'

const PROVEEDORES = [
  { id: 1, nombre: 'Florería Primavera', categoria: 'Decoración', rating: 5, telefono: '+52 55 1234 0001', descripcion: 'Especialistas en arreglos florales y decoración de bodas y XV años. Más de 15 años de experiencia.', ciudad: 'CDMX' },
  { id: 2, nombre: 'DJ Maestro Beats', categoria: 'Música', rating: 4, telefono: '+52 55 2345 0002', descripcion: 'DJs profesionales para todo tipo de eventos. Equipo de sonido de alta calidad incluido.', ciudad: 'CDMX' },
  { id: 3, nombre: 'Catering El Sabor', categoria: 'Catering', rating: 5, telefono: '+52 81 3456 0003', descripcion: 'Servicio de banquetes y catering gourmet. Menús personalizados para eventos desde 50 hasta 1000 personas.', ciudad: 'Monterrey' },
  { id: 4, nombre: 'Foto & Video Artístico', categoria: 'Fotografía', rating: 5, telefono: '+52 55 4567 0004', descripcion: 'Fotografía y video artístico para bodas y eventos especiales. Edición incluida, entrega en 30 días.', ciudad: 'CDMX' },
  { id: 5, nombre: 'Iluminación Espectacular', categoria: 'Iluminación', rating: 4, telefono: '+52 33 5678 0005', descripcion: 'Diseño e instalación de iluminación para eventos. Efectos especiales y pistas LED.', ciudad: 'Guadalajara' },
  { id: 6, nombre: 'Transportes VIP', categoria: 'Transporte', rating: 4, telefono: '+52 55 6789 0006', descripcion: 'Limosinas, camionetas de lujo y autobuses para traslado de invitados.', ciudad: 'CDMX' },
  { id: 7, nombre: 'Pastelería Dulce Momento', categoria: 'Pastelería', rating: 5, telefono: '+52 55 7890 0007', descripcion: 'Pasteles personalizados para bodas, XV años y eventos especiales. Degustación sin costo.', ciudad: 'CDMX' },
  { id: 8, nombre: 'Mariachi Las Estrellas', categoria: 'Música', rating: 4, telefono: '+52 33 8901 0008', descripcion: 'Mariachi tradicional con más de 20 años de trayectoria. Disponibles para serenatas y eventos.', ciudad: 'Guadalajara' },
  { id: 9, nombre: 'Salon Gran Terraza', categoria: 'Venue', rating: 5, telefono: '+52 81 9012 0009', descripcion: 'Salón de eventos con capacidad para 400 personas. Estacionamiento propio y valet parking.', ciudad: 'Monterrey' },
  { id: 10, nombre: 'Show Pirotécnico Luna', categoria: 'Entretenimiento', rating: 4, telefono: '+52 55 0123 0010', descripcion: 'Fuegos artificiales y pirotecnia fría para interiores. Totalmente certificados y seguros.', ciudad: 'CDMX' },
]

const CATEGORIAS = ['Todas', 'Decoración', 'Música', 'Catering', 'Fotografía', 'Iluminación', 'Transporte', 'Pastelería', 'Venue', 'Entretenimiento']

function Stars({ rating }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= rating ? '#fbbf24' : 'none'} stroke={i <= rating ? '#fbbf24' : '#4a4a5a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export default function ProveedoresPage() {
  const [catActiva, setCatActiva] = useState('Todas')

  const filtrados = catActiva === 'Todas'
    ? PROVEEDORES
    : PROVEEDORES.filter(p => p.categoria === catActiva)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Proveedores</h1>
          <p className={styles.sub}>{PROVEEDORES.length} proveedores en tu directorio</p>
        </div>
        <button className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo proveedor
        </button>
      </div>

      {/* Category filters */}
      <div className={styles.catFilters}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCatActiva(cat)}
            className={`${styles.catBtn} ${catActiva === cat ? styles.catBtnActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtrados.map(p => (
          <div key={p.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardAvatar}>
                {p.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className={styles.cardTitles}>
                <h3 className={styles.cardName}>{p.nombre}</h3>
                <span className={styles.catTag}>{p.categoria}</span>
              </div>
            </div>

            <p className={styles.cardDesc}>{p.descripcion}</p>

            <div className={styles.cardFooter}>
              <Stars rating={p.rating} />
              <span className={styles.cardCity}>{p.ciudad}</span>
            </div>

            <div className={styles.cardPhone}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.64 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {p.telefono}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
