import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { viajesApi } from '../api/viajesApi'
import { marketplaceApi } from '../api/marketplaceApi'
import styles from './MisPublicacionesPage.module.css'

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

function PublishPickerModal({ misViajes, onClose, navigate }) {
  const sinPublicar = misViajes.filter(v => !v.publico)

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3>Publicar un viaje</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {misViajes.length === 0 ? (
          <div className={styles.pickerEmpty}>
            <p>Aún no tienes viajes creados.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/app/viajes')}>Crear mi primer viaje</button>
          </div>
        ) : sinPublicar.length === 0 ? (
          <div className={styles.pickerEmpty}>
            <p>Ya publicaste todos tus viajes en el marketplace.</p>
            <button className={styles.btnSecondary} onClick={() => navigate('/app/viajes')}>Ver mis viajes</button>
          </div>
        ) : (
          <div className={styles.pickerList}>
            {sinPublicar.map(v => (
              <button
                key={v.id}
                type="button"
                className={styles.pickerRow}
                onClick={() => navigate(`/app/viajes/${v.id}/marketplace`)}
              >
                <div className={styles.pickerInfo}>
                  <span className={styles.pickerNombre}>{v.nombre}</span>
                  <span className={styles.pickerDestino}>{v.destino}</span>
                </div>
                <span className={styles.pickerCta}>Publicar →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MisPublicacionesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('mias') // 'mias' | 'todas'
  const [misViajes, setMisViajes] = useState([])
  const [loadingMias, setLoadingMias] = useState(true)
  const [todosViajes, setTodosViajes] = useState([])
  const [loadingTodas, setLoadingTodas] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    viajesApi.getAll().then(setMisViajes).catch(() => {}).finally(() => setLoadingMias(false))
  }, [])

  useEffect(() => {
    if (tab !== 'todas') return
    setLoadingTodas(true)
    const t = setTimeout(() => {
      marketplaceApi.getTrips(busqueda).then(setTodosViajes).catch(() => {}).finally(() => setLoadingTodas(false))
    }, 300)
    return () => clearTimeout(t)
  }, [tab, busqueda])

  const misPublicados = misViajes.filter(v => v.publico)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Marketplace</h1>
          <p className={styles.sub}>
            {tab === 'mias'
              ? `${misPublicados.length} viaje${misPublicados.length !== 1 ? 's' : ''} publicado${misPublicados.length !== 1 ? 's' : ''} por ti`
              : `${todosViajes.length} viaje${todosViajes.length !== 1 ? 's' : ''} publicado${todosViajes.length !== 1 ? 's' : ''} por todas las agencias`}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowPicker(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Publicar viaje
        </button>
      </div>

      <div className={styles.tabBar}>
        <button className={`${styles.tabBtn} ${tab === 'mias' ? styles.tabBtnActive : ''}`} onClick={() => setTab('mias')}>
          Mis publicaciones
          {misPublicados.length > 0 && <span className={styles.tabCount}>{misPublicados.length}</span>}
        </button>
        <button className={`${styles.tabBtn} ${tab === 'todas' ? styles.tabBtnActive : ''}`} onClick={() => setTab('todas')}>
          Todas las agencias
        </button>
      </div>

      {tab === 'todas' && (
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Buscar por destino…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {tab === 'mias' ? (
        loadingMias ? (
          <div className={styles.empty}>Cargando…</div>
        ) : misPublicados.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🧳</span>
            <p className={styles.emptyTitle}>Aún no tienes viajes publicados</p>
            <p className={styles.emptySub}>Publica un viaje gratis para que aparezca en el marketplace y los clientes te contacten.</p>
            <button className={styles.btnPrimary} onClick={() => setShowPicker(true)}>Publicar viaje</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {misPublicados.map(v => {
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
        )
      ) : (
        loadingTodas ? (
          <div className={styles.empty}>Cargando…</div>
        ) : todosViajes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🧳</span>
            <p className={styles.emptyTitle}>Aún no hay viajes publicados{busqueda ? ` para "${busqueda}"` : ''}</p>
            <p className={styles.emptySub}>Sé la primera agencia en publicar un viaje para este destino.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {todosViajes.map(v => {
              const disponibles = Math.max(v.asientosTotal - v.asientosOcupados, 0)
              return (
                <a
                  key={v.id}
                  href={`/viajes/market/${v.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.card}
                >
                  <div className={styles.cardCover} style={v.portada ? { backgroundImage: `url(${v.portada})` } : undefined}>
                    {!v.portada && <span className={styles.coverPlaceholder}>✈️</span>}
                    {v.agenciaNombre && <span className={styles.agencyBadge}>{v.agenciaNombre}</span>}
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardDestino}>{v.destino}</span>
                    <h3 className={styles.cardNombre}>{v.nombre}</h3>
                    <div className={styles.cardDates}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {v.salida} → {v.regreso}
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
                  </div>
                </a>
              )
            })}
          </div>
        )
      )}

      {showPicker && (
        <PublishPickerModal
          misViajes={misViajes}
          onClose={() => setShowPicker(false)}
          navigate={navigate}
        />
      )}
    </div>
  )
}
