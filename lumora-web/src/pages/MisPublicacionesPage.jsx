import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { viajesApi } from '../api/viajesApi'
import styles from './MisPublicacionesPage.module.css'

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

export default function MisPublicacionesPage() {
  const navigate = useNavigate()
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    viajesApi.getAll()
      .then(data => setViajes(data.filter(v => v.publico)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.empty}>Cargando…</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis publicaciones</h1>
          <p className={styles.sub}>{viajes.length} viaje{viajes.length !== 1 ? 's' : ''} publicado{viajes.length !== 1 ? 's' : ''} en el marketplace</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/app/viajes')}>Ir a mis viajes</button>
      </div>

      {viajes.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🧳</span>
          <p className={styles.emptyTitle}>Aún no tienes viajes publicados</p>
          <p className={styles.emptySub}>Publica un viaje gratis desde su detalle para que aparezca en el marketplace y los clientes te contacten.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/app/viajes')}>Ver mis viajes</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {viajes.map(v => {
            const portada = v.fotos?.[0]?.url
            const disponibles = Math.max(v.asientosTotal - v.asientosOcupados, 0)
            return (
              <div key={v.id} className={styles.card}>
                <div className={styles.cardCover} style={portada ? { backgroundImage: `url(${portada})` } : undefined}>
                  {!portada && <span className={styles.coverPlaceholder}>✈️</span>}
                  <span className={styles.publishedBadge}>● Publicado</span>
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardDestino}>{v.destino}</span>
                  <h3 className={styles.cardNombre}>{v.tituloPost || v.nombre}</h3>
                  <div className={styles.cardDates}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {v.salida} → {v.regreso}
                  </div>

                  <div className={styles.cardViews}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {v.vistas} vista{v.vistas !== 1 ? 's' : ''}
                  </div>

                  <div className={styles.cardFooter}>
                    <div>
                      {v.precioOferta != null ? (
                        <>
                          <span className={styles.cardPrecioTachado}>{fmtMoney(v.precioPorPersona)}</span>
                          <span className={styles.cardPrecioOferta}>{fmtMoney(v.precioOferta)}</span>
                        </>
                      ) : (
                        <span className={styles.cardPrecio}>{fmtMoney(v.precioPorPersona)}</span>
                      )}
                    </div>
                    {v.asientosTotal > 0 && (
                      <span className={styles.cardCupos}>{disponibles} disp.</span>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <a
                      href={`/viajes/market/${v.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btnSecondary}
                      onClick={e => e.stopPropagation()}
                    >
                      Ver publicación ↗
                    </a>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => navigate(`/app/viajes/${v.id}/marketplace`)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
