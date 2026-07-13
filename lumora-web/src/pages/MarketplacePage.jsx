import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { marketplaceApi } from '../api/marketplaceApi'
import Footer from '../components/Footer'
import styles from './MarketplacePage.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { theme } = useSettings()
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const load = async (destino) => {
    setLoading(true)
    try {
      const data = await marketplaceApi.getTrips(destino)
      setViajes(data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    load(busqueda)
  }

  const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navLogo} onClick={() => navigate('/viajes')} style={{ cursor: 'pointer' }}>
          <img src={theme === 'dark' ? logoWhite : logoFull} alt="Elixe" className={styles.navLogoImg} />
          <span className={styles.navBadge}>marketplace</span>
        </div>
        <div className={styles.navActions}>
          <button className={styles.navLogin} onClick={() => navigate('/login')}>Acceder</button>
          <button className={styles.navCta} onClick={() => navigate('/login?industry=travel')}>Publica tu viaje gratis</button>
        </div>
      </nav>

      <header className={styles.hero}>
        <span className={styles.heroBadge}>Marketplace de viajes</span>
        <h1 className={styles.heroTitle}>Encuentra tu próximo viaje grupal.</h1>
        <p className={styles.heroSub}>
          Viajes publicados por agencias verificadas en Elixe. Contacta directo por WhatsApp o mensaje.
        </p>
        <form className={styles.searchBox} onSubmit={handleSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            placeholder="Buscar por destino… ej. Cancún"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>Buscar</button>
        </form>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.empty}>Cargando viajes…</div>
        ) : viajes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🧳</span>
            <p className={styles.emptyTitle}>Aún no hay viajes publicados{busqueda ? ` para "${busqueda}"` : ''}.</p>
            <p className={styles.emptySub}>¿Eres agencia de viajes? Publica tu primer viaje gratis en minutos.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/login?industry=travel')}>Comenzar gratis</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {viajes.map(v => {
              const pct = v.asientosTotal > 0 ? Math.round((v.asientosOcupados / v.asientosTotal) * 100) : 0
              const disponibles = Math.max(v.asientosTotal - v.asientosOcupados, 0)
              return (
                <div key={v.id} className={styles.card} onClick={() => navigate(`/viajes/market/${v.id}`)}>
                  <div className={styles.cardCover} style={v.portada ? { backgroundImage: `url(${v.portada})` } : undefined}>
                    {!v.portada && <span className={styles.coverPlaceholder}>✈️</span>}
                    <span className={styles.coverDestino}>{v.destino}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardNombre}>{v.nombre}</h3>
                    <div className={styles.cardAgencia}>
                      {v.agenciaNombre}{v.agenciaCiudad ? ` · ${v.agenciaCiudad}` : ''}
                    </div>
                    <div className={styles.cardDates}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {v.salida} → {v.regreso}
                    </div>
                    <div className={styles.cardFooter}>
                      <div>
                        <span className={styles.cardPrecio}>{fmtMoney(v.precioPorPersona)}</span>
                        <span className={styles.cardPrecioLabel}> / persona</span>
                      </div>
                      {v.asientosTotal > 0 && (
                        <span className={styles.cardCupos}>{disponibles} lugares disp.</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
