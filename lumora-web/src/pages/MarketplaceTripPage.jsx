import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { marketplaceApi } from '../api/marketplaceApi'
import Footer from '../components/Footer'
import styles from './MarketplaceTripPage.module.css'
import logoFull  from '../assets/logo_elixe.jpeg'
import logoWhite from '../assets/logo_white_elixe.jpeg'

function whatsappUrl(phone, text) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const full = digits.length === 10 ? `52${digits}` : digits
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${full}${q}`
}

const fmtMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

function InquiryForm({ tripId }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.message) {
      setError('Completa nombre, teléfono y mensaje')
      return
    }
    setSending(true); setError('')
    try {
      await marketplaceApi.sendInquiry(tripId, form)
      setSent(true)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className={styles.sentBox}>
        <span className={styles.sentIcon}>✅</span>
        <p className={styles.sentTitle}>¡Mensaje enviado!</p>
        <p className={styles.sentSub}>La agencia lo recibirá y te contactará pronto.</p>
      </div>
    )
  }

  return (
    <form className={styles.inquiryForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label>Tu nombre</label>
        <input value={form.name} onChange={setF('name')} placeholder="Nombre completo" />
      </div>
      <div className={styles.field}>
        <label>Tu teléfono</label>
        <input value={form.phone} onChange={setF('phone')} placeholder="10 dígitos" />
      </div>
      <div className={styles.field}>
        <label>Mensaje</label>
        <textarea value={form.message} onChange={setF('message')} rows={3} placeholder="Me interesa este viaje, ¿me das más info?" />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.btnPrimary} disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}

export default function MarketplaceTripPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useSettings()
  const [viaje, setViaje] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    marketplaceApi.getTrip(id)
      .then(setViaje)
      .catch(err => setError(err.message || 'Viaje no encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={styles.stateWrap}>Cargando…</div>
  if (error || !viaje) return (
    <div className={styles.stateWrap}>
      <p>{error || 'Viaje no encontrado'}</p>
      <button className={styles.btnPrimary} onClick={() => navigate('/viajes/market')}>Volver al marketplace</button>
    </div>
  )

  const disponibles = Math.max(viaje.asientosTotal - viaje.asientosOcupados, 0)
  const waMsg = `Hola, me interesa el viaje "${viaje.nombre}" (${viaje.destino}) que vi en Elixe.`
  const waUrl = whatsappUrl(viaje.agenciaTelefono, waMsg)
  const fotos = viaje.fotos.length > 0 ? viaje.fotos : [null]

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navLogo} onClick={() => navigate('/viajes/market')} style={{ cursor: 'pointer' }}>
          <img src={theme === 'dark' ? logoWhite : logoFull} alt="Elixe" className={styles.navLogoImg} />
          <span className={styles.navBadge}>marketplace</span>
        </div>
        <button className={styles.navBack} onClick={() => navigate('/viajes/market')}>← Todos los viajes</button>
      </nav>

      <main className={styles.main}>
        <div className={styles.gallery}>
          <div className={styles.galleryMain}>
            {fotos[activePhoto] ? (
              <img src={fotos[activePhoto].url} alt={viaje.nombre} />
            ) : (
              <div className={styles.galleryPlaceholder}>✈️</div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className={styles.galleryThumbs}>
              {fotos.map((f, i) => f && (
                <button
                  key={f.id}
                  className={`${styles.thumb} ${i === activePhoto ? styles.thumbActive : ''}`}
                  onClick={() => setActivePhoto(i)}
                >
                  <img src={f.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <span className={styles.destinoLabel}>{viaje.destino}</span>
            <h1 className={styles.title}>{viaje.nombre}</h1>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {viaje.salida} → {viaje.regreso}
              </span>
              {viaje.asientosTotal > 0 && (
                <span className={styles.metaItem}>{disponibles} lugares disponibles</span>
              )}
            </div>

            {viaje.descripcion && (
              <p className={styles.descripcion}>{viaje.descripcion}</p>
            )}

            {viaje.incluye.length > 0 && (
              <div className={styles.includes}>
                <h3 className={styles.includesTitle}>Qué incluye</h3>
                <ul className={styles.includesList}>
                  {viaje.incluye.map((item, i) => (
                    <li key={i} className={styles.includesItem}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.priceCard}>
              <span className={styles.priceVal}>{fmtMoney(viaje.precioPorPersona)}</span>
              <span className={styles.priceLabel}>por persona</span>
            </div>

            <div className={styles.agencyCard}>
              <span className={styles.agencyLabel}>Organiza</span>
              <span className={styles.agencyName}>{viaje.agenciaNombre}</span>
              {viaje.agenciaCiudad && <span className={styles.agencyCity}>{viaje.agenciaCiudad}</span>}

              {waUrl && (
                <a href={waUrl} target="_blank" rel="noreferrer" className={styles.btnWhatsapp}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.29-1.39a9.9 9.9 0 0 0 4.7 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.24 0 4.35.87 5.93 2.46a8.23 8.23 0 0 1 2.43 5.87c0 4.59-3.73 8.32-8.32 8.32a8.27 8.27 0 0 1-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.4c0-4.59 3.73-8.32 8.22-8.32M8.5 6.9c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.8 4.32 3.82 2.14.85 2.58.68 3.04.64.47-.04 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.21-.06-.11-.23-.17-.48-.3-.25-.13-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.4-.79-1.91-.2-.5-.41-.43-.57-.44a10 10 0 0 0-.49-.01Z"/></svg>
                  Escribir por WhatsApp
                </a>
              )}
            </div>

            <div className={styles.inquiryCard}>
              <span className={styles.inquiryTitle}>Enviar mensaje</span>
              <InquiryForm tripId={viaje.id} />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
