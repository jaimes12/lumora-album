import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { superadminApi } from '../api/superadminApi'
import styles from './SuperAdminPage.module.css'

// ── Super admin login ──────────────────────────────────────────────────────
function SuperAdminLogin({ onSuccess }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await superadminApi.login(email, password)
      // Verify the logged-in account actually has superadmin access
      await superadminApi.getOverview()
      onSuccess()
    } catch (err) {
      superadminApi.logout()
      setError(
        err.status === 403 || err.status === 401
          ? 'Credenciales incorrectas o sin acceso de super admin.'
          : 'Error al conectar. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginShell}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <div className={styles.loginLogo}>SUPERADMIN</div>
        <h2 className={styles.loginTitle}>Acceso restringido</h2>
        <p className={styles.loginSub}>Solo para administradores del sistema</p>

        <div className={styles.loginField}>
          <label>Correo</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            autoFocus
            required
          />
        </div>
        <div className={styles.loginField}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className={styles.loginError}>{error}</p>}

        <button className={styles.loginBtn} type="submit" disabled={loading}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

const PLAN_COLORS = {
  free:    '#6b7280',
  solo:    '#38bdf8',
  negocio: '#c9a227',
  agencia: '#7c6af7',
}

const STATUS_LABELS = {
  lead: 'Prospecto', confirmed: 'Confirmado',
  pending: 'Pendiente', in_progress: 'En proceso',
  done: 'Terminado', cancelled: 'Cancelado',
}

// ── Mini bar chart ─────────────────────────────────────────────────────────
function MiniBar({ data = [], color = '#7c6af7' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className={styles.miniBar}>
      {data.map(d => (
        <div key={d.label} className={styles.miniBarCol}>
          <div
            className={styles.miniBarFill}
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 0)}%`, background: color }}
            title={`${d.label}: ${d.value}`}
          />
          <span className={styles.miniBarLabel}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return <div className={styles.chartEmpty}>Sin datos</div>

  let cumDeg = -90
  const slices = data.map(d => {
    const pct = d.count / total
    const start = cumDeg
    cumDeg += pct * 360
    return { ...d, pct, start, end: cumDeg }
  })

  const arc = (start, end, r = 70, ri = 42) => {
    const cx = 100, cy = 100
    if (end - start >= 359.9) {
      return `M${cx},${cy-r} A${r},${r},0,1,1,${cx-0.01},${cy-r} Z M${cx},${cy-ri} A${ri},${ri},0,1,0,${cx-0.01},${cy-ri} Z`
    }
    const sR = start * Math.PI / 180, eR = end * Math.PI / 180
    const x1 = cx + r*Math.cos(sR), y1 = cy + r*Math.sin(sR)
    const x2 = cx + r*Math.cos(eR), y2 = cy + r*Math.sin(eR)
    const ix1 = cx + ri*Math.cos(sR), iy1 = cy + ri*Math.sin(sR)
    const ix2 = cx + ri*Math.cos(eR), iy2 = cy + ri*Math.sin(eR)
    const lg = end - start > 180 ? 1 : 0
    return `M${ix1},${iy1} L${x1},${y1} A${r},${r},0,${lg},1,${x2},${y2} L${ix2},${iy2} A${ri},${ri},0,${lg},0,${ix1},${iy1} Z`
  }

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 200 200" className={styles.donutSvg}>
        {slices.map(s => (
          <path key={s.plan} d={arc(s.start, s.end)} fill={PLAN_COLORS[s.plan] ?? '#6b7280'} />
        ))}
        <text x="100" y="95" textAnchor="middle" className={styles.donutCenter}>{total}</text>
        <text x="100" y="112" textAnchor="middle" className={styles.donutCenterSub}>orgs</text>
      </svg>
      <div className={styles.donutLegend}>
        {slices.map(s => (
          <div key={s.plan} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: PLAN_COLORS[s.plan] ?? '#6b7280' }} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendCount}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}20`, color }}>{icon}</div>
      <div>
        <div className={styles.statValue} style={{ color }}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  )
}

// ── Table ──────────────────────────────────────────────────────────────────
function DataTable({ columns, rows, empty = 'Sin registros' }) {
  const [q, setQ] = useState('')
  const filtered = q
    ? rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q.toLowerCase())))
    : rows

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableSearch}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button onClick={() => setQ('')}>✕</button>}
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={columns.length} className={styles.tableEmpty}>{empty}</td></tr>
              : filtered.map((row, i) => (
                  <tr key={i}>
                    {columns.map(c => (
                      <td key={c.key}>
                        {c.render ? c.render(row) : row[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <div className={styles.tableCount}>{filtered.length} registros</div>
    </div>
  )
}

// ── Campañas tab ────────────────────────────────────────────────────────────
const SEGMENTS = [
  { value: 'all',           label: 'Todos los usuarios' },
  { value: 'trial_active',  label: 'Trial activo (últimos 7 días)' },
  { value: 'trial_expired', label: 'Trial vencido (sin plan)' },
  { value: 'free',          label: 'Sin plan (free)' },
  { value: 'paid',          label: 'Con plan activo' },
  { value: 'solo',          label: 'Plan Solo' },
  { value: 'negocio',       label: 'Plan Negocio' },
  { value: 'agencia',       label: 'Plan Agencia' },
  { value: 'manual',        label: 'Selección manual' },
]

// Shared header + footer wrapper for all email templates
const EL_HEADER = `<div style="background:linear-gradient(135deg,#5b4de0 0%,#7c6af7 60%,#a78bfa 100%);border-radius:14px 14px 0 0;padding:32px 36px;text-align:center">
  <img src="https://www.elixe.mx/minilogo_elixe.jpeg" alt="Elixe" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 10px" />
  <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Software para organizadores de eventos</p>
</div>`

const EL_FOOTER = `<div style="background:#1e1b30;padding:24px 36px;border-radius:0 0 14px 14px;text-align:center">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px"><tr>
    <td style="text-align:right;padding-right:5px">
      <a href="https://www.instagram.com/elixe_mx/" style="display:inline-block;background:#e1306c;color:#fff;border-radius:8px;padding:8px 16px;text-decoration:none;font-size:12px;font-weight:700">📷 Instagram</a>
    </td>
    <td style="text-align:left;padding-left:5px">
      <a href="https://www.facebook.com/profile.php?id=61590859832846" style="display:inline-block;background:#1877f2;color:#fff;border-radius:8px;padding:8px 16px;text-decoration:none;font-size:12px;font-weight:700">📘 Facebook</a>
    </td>
  </tr></table>
  <p style="margin:0 0 4px;color:#9ca3af;font-size:12px">Elixe · Software para organizadores de eventos</p>
  <p style="margin:0;font-size:11px;color:#6b7280">
    <a href="https://www.elixe.mx" style="color:#6b7280;text-decoration:none">www.elixe.mx</a>
    &nbsp;·&nbsp;
    <a href="https://www.elixe.mx" style="color:#6b7280">Darse de baja</a>
  </p>
</div>`

const wrap = (body) =>
  `<div style="background:#edeaf5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    ${EL_HEADER}
    <div style="background:#ffffff;padding:40px 36px">${body}</div>
    ${EL_FOOTER}
  </div>
</div>`

const EMAIL_TEMPLATES = [
  {
    id: 'blank',
    label: 'En blanco',
    subject: '',
    html: wrap(`
  <h2 style="margin:0 0 12px;font-size:24px;color:#1a1a2e;font-weight:800">¡Hola, {{nombre}}! 👋</h2>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 24px">Escribe aquí tu mensaje personalizado para {{org}}.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px">Ver planes →</a>
  </div>`),
  },
  {
    id: 'trial_expired',
    label: 'Trial vencido — reactiva',
    subject: '{{nombre}}, tu prueba de Elixe ha terminado ⏰',
    html: wrap(`
  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">¡{{nombre}}, todavía estás a tiempo!</h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Tu cuenta en <strong>{{org}}</strong></p>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">Tu prueba gratuita de <strong>Elixe</strong> venció hace unos días, pero tus eventos, clientes y toda tu información siguen guardados y listos para ti.</p>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 24px">Solo necesitas activar tu plan para retomar el control de tu negocio de eventos.</p>

  <div style="background:#f6f4ff;border-radius:12px;padding:22px 24px;margin:0 0 28px;border-left:4px solid #7c6af7">
    <p style="margin:0 0 14px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Con Elixe tienes todo en un solo lugar:</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Gestión de eventos, clientes y pagos</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Cotizaciones y contratos con firma digital</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;WhatsApp CRM y pipeline de ventas</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Calendario, tareas y notas del equipo</p>
    <p style="margin:0;color:#374151;font-size:14px">✅ &nbsp;Finanzas: ingresos, gastos y saldo en tiempo real</p>
  </div>

  <div style="background:#fff7ed;border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center">
    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">💡 Planes desde <strong>$399 / mes</strong> — sin contratos anuales</p>
  </div>

  <div style="text-align:center;margin:0 0 8px">
    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.01em">Reactivar mi cuenta →</a>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Tus datos te esperan. Sin complicaciones.</p>`),
  },
  {
    id: 'promo',
    label: 'Oferta especial',
    subject: '{{nombre}}, acceso gratis a Elixe — código exclusivo 🎁',
    html: wrap(`
  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">¡{{nombre}}, tenemos algo para ti!</h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Para <strong>{{org}}</strong></p>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 24px">Sabemos que gestionar eventos es mucho trabajo. Por eso queremos ayudarte con una oferta exclusiva para que empieces a usar Elixe sin costo.</p>

  <div style="background:linear-gradient(135deg,#f6f4ff,#ede9fe);border-radius:14px;padding:28px;margin:0 0 24px;text-align:center;border:2px dashed #a78bfa">
    <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.1em">Tu código de acceso</p>
    <p style="margin:0;font-size:36px;font-weight:900;color:#5b4de0;letter-spacing:4px">ELIXE2026</p>
    <p style="margin:10px 0 0;color:#6d28d9;font-size:13px">Acceso completo al plan Negocio</p>
  </div>

  <div style="background:#f6f4ff;border-radius:12px;padding:20px 24px;margin:0 0 28px;border-left:4px solid #7c6af7">
    <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Qué incluye el plan Negocio:</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Eventos y clientes ilimitados</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;WhatsApp CRM con pipeline Kanban</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Contratos con firma digital</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Cotizaciones ilimitadas + PDF</p>
    <p style="margin:0;color:#374151;font-size:14px">✅ &nbsp;Hasta 3 usuarios en tu equipo</p>
  </div>

  <div style="text-align:center;margin:0 0 8px">
    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Usar mi código →</a>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Ingresa el código al elegir tu plan. Disponible por tiempo limitado.</p>`),
  },
  {
    id: 'feature',
    label: 'Nueva función',
    subject: '{{nombre}}, hay algo nuevo en Elixe 🚀',
    html: wrap(`
  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">¡Acabamos de lanzar algo nuevo!</h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Hola, <strong>{{nombre}}</strong> de <strong>{{org}}</strong></p>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 24px">Seguimos mejorando Elixe para que gestionar tu negocio de eventos sea cada vez más sencillo. Esta semana lanzamos:</p>

  <div style="background:#f6f4ff;border-radius:12px;padding:22px 24px;margin:0 0 24px;border-left:4px solid #7c6af7">
    <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#1a1a2e">✨ [Nombre de la función]</p>
    <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7">Describe aquí qué hace la nueva función y el beneficio directo para el usuario.</p>
  </div>

  <p style="color:#4b5563;line-height:1.7;margin:0 0 24px">Además, en las últimas semanas también agregamos:</p>
  <p style="margin:0 0 8px;color:#374151;font-size:14px">🔹 &nbsp;<strong>Función 1</strong> — descripción breve</p>
  <p style="margin:0 0 8px;color:#374151;font-size:14px">🔹 &nbsp;<strong>Función 2</strong> — descripción breve</p>
  <p style="margin:0 0 28px;color:#374151;font-size:14px">🔹 &nbsp;<strong>Función 3</strong> — descripción breve</p>

  <div style="text-align:center;margin:0 0 8px">
    <a href="https://www.elixe.mx/app" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Explorar en mi cuenta →</a>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">¿Tienes dudas? Contáctanos por Instagram o Facebook.</p>`),
  },
]

function CampañasTab() {
  const [segment,       setSegment]       = useState('trial_expired')
  const [subject,       setSubject]       = useState('')
  const [htmlBody,      setHtmlBody]      = useState('')
  const [templateId,    setTemplateId]    = useState('blank')
  const [allCandidates, setAllCandidates] = useState(null)   // all orgs (for manual mode)
  const [loadingRec,    setLoadingRec]    = useState(false)
  const [selectedEmails, setSelectedEmails] = useState(new Set()) // manual selection
  const [sending,       setSending]       = useState(false)
  const [result,        setResult]        = useState(null)
  const [previewMode,   setPreviewMode]   = useState(false)
  const [error,         setError]         = useState('')

  const isManual = segment === 'manual'

  // Load all candidates (manual mode always fetches 'all')
  const loadCandidates = async (seg) => {
    setLoadingRec(true)
    setAllCandidates(null)
    setSelectedEmails(new Set())
    try {
      const data = await superadminApi.getCampaignRecipients(seg === 'manual' ? 'all' : seg)
      setAllCandidates(data)
    } catch { setAllCandidates([]) }
    finally { setLoadingRec(false) }
  }

  useEffect(() => { loadCandidates(segment) }, [segment])

  // Effective recipient list
  const recipients = isManual
    ? (allCandidates ?? []).filter(r => selectedEmails.has(r.email))
    : (allCandidates ?? [])

  const toggleEmail = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev)
      next.has(email) ? next.delete(email) : next.add(email)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedEmails.size === allCandidates?.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(allCandidates?.map(r => r.email) ?? []))
    }
  }

  const applyTemplate = (id) => {
    const t = EMAIL_TEMPLATES.find(t => t.id === id)
    if (!t) return
    setTemplateId(id)
    setSubject(t.subject)
    setHtmlBody(t.html)
    setResult(null)
  }

  const handleSend = async () => {
    if (!subject.trim() || !htmlBody.trim()) { setError('Completa el asunto y el cuerpo del email.'); return }
    if (!recipients.length) { setError('No hay destinatarios seleccionados.'); return }
    setError('')
    setSending(true)
    setResult(null)
    try {
      const emails = isManual ? Array.from(selectedEmails) : null
      const r = await superadminApi.sendCampaign(segment, subject, htmlBody, emails)
      setResult(r)
    } catch (e) { setError(e.message || 'Error al enviar') }
    finally { setSending(false) }
  }

  const previewHtml = htmlBody
    .replace(/\{\{nombre\}\}/g, 'Juan')
    .replace(/\{\{org\}\}/g, 'Mi Empresa Eventos')

  const allSelected = isManual && allCandidates?.length > 0 && selectedEmails.size === allCandidates.length

  return (
    <div className={styles.campañasWrap}>
      {/* Left: compose */}
      <div className={styles.campañasCompose}>
        <div className={styles.campañasSection}>
          <label className={styles.campañasLabel}>Segmento de destinatarios</label>
          <select className={styles.campañasSelect} value={segment} onChange={e => { setSegment(e.target.value); setResult(null) }}>
            {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className={styles.campañasRecCount}>
            {loadingRec
              ? 'Cargando destinatarios…'
              : allCandidates === null
                ? ''
                : isManual
                  ? `${selectedEmails.size} de ${allCandidates.length} seleccionados`
                  : allCandidates.length === 0
                    ? 'Sin destinatarios para este segmento'
                    : `${allCandidates.length} destinatario${allCandidates.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>

        <div className={styles.campañasSection}>
          <label className={styles.campañasLabel}>Plantilla</label>
          <div className={styles.campañasTemplates}>
            {EMAIL_TEMPLATES.map(t => (
              <button
                key={t.id}
                className={`${styles.campañasTplBtn} ${templateId === t.id ? styles.campañasTplActive : ''}`}
                onClick={() => applyTemplate(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.campañasSection}>
          <label className={styles.campañasLabel}>Asunto</label>
          <input
            className={styles.campañasInput}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ej: {{nombre}}, tu prueba de Elixe ha terminado"
          />
          <p className={styles.campañasHint}>Variables: <code>{'{{nombre}}'}</code> · <code>{'{{org}}'}</code></p>
        </div>

        <div className={styles.campañasSection}>
          <div className={styles.campañasBodyHeader}>
            <label className={styles.campañasLabel}>Cuerpo HTML</label>
            <button className={styles.campañasPreviewBtn} onClick={() => setPreviewMode(true)}>
              Vista previa
            </button>
          </div>
          <textarea
            className={styles.campañasTextarea}
            value={htmlBody}
            onChange={e => setHtmlBody(e.target.value)}
            placeholder="<div>Tu email en HTML…</div>"
            rows={14}
          />
        </div>

        {/* Email preview modal */}
        {previewMode && (
          <div className={styles.previewOverlay} onClick={() => setPreviewMode(false)}>
            <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
              <div className={styles.previewChrome}>
                <div className={styles.previewChromeBar}>
                  <span className={styles.previewDot} style={{ background: '#ef4444' }} />
                  <span className={styles.previewDot} style={{ background: '#f59e0b' }} />
                  <span className={styles.previewDot} style={{ background: '#34d399' }} />
                  <span className={styles.previewChromeTitle}>Vista previa del correo</span>
                  <button className={styles.previewClose} onClick={() => setPreviewMode(false)}>✕</button>
                </div>
                <div className={styles.previewMeta}>
                  <div className={styles.previewMetaRow}><span className={styles.previewMetaLabel}>De:</span> Elixe {'<noreply@elixe.mx>'}</div>
                  <div className={styles.previewMetaRow}><span className={styles.previewMetaLabel}>Para:</span> Juan García {'<juan@ejemplo.com>'}</div>
                  <div className={styles.previewMetaRow}><span className={styles.previewMetaLabel}>Asunto:</span> {subject.replace(/\{\{nombre\}\}/g, 'Juan').replace(/\{\{org\}\}/g, 'Mi Empresa') || '(sin asunto)'}</div>
                </div>
                <div className={styles.previewBody}>
                  <div className={styles.previewEmailWrap} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
              <p className={styles.previewNote}>Variables reemplazadas con datos de ejemplo · Haz clic fuera para cerrar</p>
            </div>
          </div>
        )}

        {error && <p className={styles.campañasError}>{error}</p>}
        {result && (
          <div className={styles.campañasResult}>
            <span className={styles.campañasResultSent}>✓ {result.sent} enviados</span>
            {result.failed > 0 && <span className={styles.campañasResultFailed}>✗ {result.failed} fallaron</span>}
          </div>
        )}

        <button
          className={styles.campañasSendBtn}
          onClick={handleSend}
          disabled={sending || recipients.length === 0}
        >
          {sending ? 'Enviando…' : `Enviar a ${recipients.length} destinatario${recipients.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Right: recipient list */}
      <div className={styles.campañasSidebar}>
        <div className={styles.campañasSidebarHeader}>
          <h3 className={styles.campañasSidebarTitle}>
            {isManual ? 'Seleccionar destinatarios' : 'Destinatarios'}
          </h3>
          {isManual && allCandidates?.length > 0 && (
            <button className={styles.campañasToggleAll} onClick={toggleAll}>
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          )}
        </div>
        {loadingRec
          ? <p className={styles.campañasMuted}>Cargando…</p>
          : !allCandidates?.length
            ? <p className={styles.campañasMuted}>Sin destinatarios</p>
            : <div className={styles.campañasRecTable}>
                {allCandidates.map((r, i) => (
                  <div
                    key={i}
                    className={`${styles.campañasRecRow} ${isManual && selectedEmails.has(r.email) ? styles.campañasRecSelected : ''}`}
                    onClick={isManual ? () => toggleEmail(r.email) : undefined}
                    style={isManual ? { cursor: 'pointer' } : undefined}
                  >
                    {isManual && (
                      <input
                        type="checkbox"
                        className={styles.campañasCheckbox}
                        checked={selectedEmails.has(r.email)}
                        onChange={() => toggleEmail(r.email)}
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    <div className={styles.campañasRecInfo}>
                      <div className={styles.campañasRecName}>{r.name || '—'}</div>
                      <div className={styles.campañasRecEmail}>{r.email}</div>
                      <div className={styles.campañasRecOrg}>{r.org}</div>
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  )
}

// ── Plans tab ──────────────────────────────────────────────────────────────
const PLAN_LABELS = { free: 'Sin plan', solo: 'Solo', negocio: 'Negocio', agencia: 'Agencia' }
const ALL_PLANS   = ['free', 'solo', 'negocio', 'agencia']

const PLAN_DEFAULTS = [
  { planId: 'solo', name: 'Solo', price: 399, description: 'Para fotógrafos, DJs, decoradores y coordinadores que trabajan solos.', color: '#2B6FD4', popular: false, features: [
    { text: '1 usuario', ok: true }, { text: '20 eventos activos', ok: true }, { text: '200 clientes', ok: true },
    { text: 'Calendario y tareas', ok: true }, { text: 'Catálogo de productos', ok: true }, { text: 'Directorio de proveedores', ok: true },
    { text: 'Cotizaciones (hasta 15/mes)', ok: true }, { text: 'Contratos básicos', ok: true }, { text: 'Historial de pagos', ok: true },
    { text: '2 GB almacenamiento', ok: true }, { text: 'WhatsApp CRM', ok: false }, { text: 'Pipeline de ventas', ok: false }, { text: 'Reportes y estadísticas', ok: false },
  ], sortOrder: 1 },
  { planId: 'negocio', name: 'Negocio', price: 799, description: 'Para negocios establecidos: wedding planners, salones y coordinadoras con equipo.', color: '#C9A255', popular: true, features: [
    { text: 'Hasta 3 usuarios', ok: true }, { text: 'Eventos ilimitados', ok: true }, { text: 'Clientes ilimitados', ok: true },
    { text: 'Todo lo del plan Solo', ok: true }, { text: 'WhatsApp CRM', ok: true }, { text: 'Cotizaciones ilimitadas + PDF', ok: true },
    { text: 'Contratos con firma digital', ok: true }, { text: 'Pipeline de ventas (Kanban)', ok: true }, { text: 'Reportes e ingresos', ok: true },
    { text: 'Exportar datos Excel/PDF', ok: true }, { text: '10 GB almacenamiento', ok: true }, { text: 'Soporte prioritario (24h)', ok: true },
  ], sortOrder: 2 },
  { planId: 'agencia', name: 'Agencia', price: 1499, description: 'Para agencias de eventos, salones grandes y equipos de 5 o más personas.', color: '#7c6af7', popular: false, features: [
    { text: 'Hasta 10 usuarios', ok: true }, { text: 'Todo ilimitado', ok: true }, { text: 'Todo lo del plan Negocio', ok: true },
    { text: 'Roles y permisos por usuario', ok: true }, { text: 'Reportes avanzados', ok: true }, { text: 'Importación masiva (CSV)', ok: true },
    { text: 'API de integración', ok: true }, { text: 'Plantillas personalizadas', ok: true }, { text: '50 GB almacenamiento', ok: true },
    { text: 'Onboarding dedicado', ok: true }, { text: 'Soporte 24/7 por WhatsApp', ok: true },
  ], sortOrder: 3 },
]

function PlanConfigEditor() {
  const [configs,  setConfigs]  = useState(null)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')

  useEffect(() => {
    const PLAN_IDS = ['solo', 'negocio', 'agencia']
    const merge = (data) => {
      const byId = Object.fromEntries((data || []).map(p => [p.planId, p]))
      return PLAN_IDS.map(id => byId[id] ?? PLAN_DEFAULTS.find(p => p.planId === id))
    }
    superadminApi.getPlanConfigs()
      .then(data => setConfigs(merge(data)))
      .catch(() => setConfigs(PLAN_DEFAULTS))
  }, [])

  const normalizeFeatures = (features) =>
    (features || []).map(f => ({ text: f.text ?? f.Text ?? '', ok: f.ok ?? f.Ok ?? true }))

  const startEdit = (plan) => {
    setEditId(plan.planId)
    setForm({ price: plan.price, description: plan.description, color: plan.color, popular: plan.popular, features: normalizeFeatures(plan.features) })
    setMsg('')
  }
  const cancelEdit = () => { setEditId(null); setForm(null) }

  const setFeatureText = (i, val) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, text: val } : ft) }))
  const setFeatureOk   = (i, val) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, ok: val } : ft) }))
  const addFeature     = ()       => setForm(f => ({ ...f, features: [...f.features, { text: '', ok: true }] }))
  const removeFeature  = (i)      => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const updated = await superadminApi.updatePlanConfig(editId, form)
      setConfigs(prev => prev.map(c => c.planId === editId ? { ...c, ...updated } : c))
      setMsg('Guardado ✓')
      setEditId(null); setForm(null)
    } catch { setMsg('Error al guardar') }
    finally { setSaving(false) }
  }

  if (!configs) return <div className={styles.loadingMsg}>Cargando paquetes…</div>

  return (
    <div className={styles.pcWrap}>
      <div className={styles.pcHeader}>
        <h3 className={styles.pcTitle}>Paquetes / Precios</h3>
        {msg && <span className={styles.pcMsg}>{msg}</span>}
      </div>
      <div className={styles.pcGrid}>
        {configs.map(plan => (
          <div key={plan.planId} className={styles.pcCard} style={{ borderTopColor: plan.color }}>
            <div className={styles.pcCardHead}>
              <span className={styles.pcPlanName} style={{ color: plan.color }}>{plan.name}</span>
              {editId !== plan.planId && (
                <button className={styles.pcEditBtn} onClick={() => startEdit(plan)}>Editar</button>
              )}
            </div>

            {editId === plan.planId && form ? (
              <div className={styles.pcForm}>
                <div className={styles.pcField}>
                  <label>Precio (MXN$/mes)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className={styles.pcField}>
                  <label>Descripción</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className={styles.pcField}>
                  <label>Color</label>
                  <div className={styles.pcColorRow}>
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                    <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} maxLength={7} />
                  </div>
                </div>
                <label className={styles.pcCheckRow}>
                  <input type="checkbox" checked={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))} />
                  <span>Más popular</span>
                </label>
                <div className={styles.pcField}>
                  <label>Características</label>
                  {form.features.map((f, i) => (
                    <div key={i} className={styles.pcFeatureRow}>
                      <button
                        className={`${styles.pcFeatureOk} ${f.ok ? styles.pcFeatureOkOn : ''}`}
                        onClick={() => setFeatureOk(i, !f.ok)}
                        title={f.ok ? 'Incluido' : 'No incluido'}
                      >
                        {f.ok ? '✓' : '✗'}
                      </button>
                      <input value={f.text} onChange={e => setFeatureText(i, e.target.value)} placeholder="Característica…" />
                      <button className={styles.pcFeatureDel} onClick={() => removeFeature(i)}>✕</button>
                    </div>
                  ))}
                  <button className={styles.pcAddFeature} onClick={addFeature}>+ Agregar</button>
                </div>
                <div className={styles.pcActions}>
                  <button className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                  <button className={styles.btnSave} onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                </div>
              </div>
            ) : (
              <div className={styles.pcPreview}>
                <div className={styles.pcPreviewPrice}>MXN$ <strong>{plan.price.toLocaleString('es-MX')}</strong><span>/mes</span></div>
                <p className={styles.pcPreviewDesc}>{plan.description}</p>
                <ul className={styles.pcFeatureList}>
                  {normalizeFeatures(plan.features).map((f, i) => (
                    <li key={i} className={f.ok ? '' : styles.pcFeatureLocked}>
                      <span style={{ color: f.ok ? plan.color : '#555' }}>{f.ok ? '✓' : '✗'}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PaquetesTab() {
  return (
    <div className={styles.tabContent}>
      <PlanConfigEditor />
    </div>
  )
}

function PlansTab() {
  const [rows,       setRows]       = useState(null)
  const [expanded,   setExpanded]   = useState(null)
  const [editing,    setEditing]    = useState(null) // orgId
  const [newPlan,    setNewPlan]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [q,          setQ]          = useState('')
  const [delConf,    setDelConf]    = useState(null) // orgId pending delete

  useEffect(() => {
    superadminApi.getPlans().then(setRows).catch(() => setRows([]))
  }, [])

  if (!rows) return <div className={styles.loadingMsg}>Cargando planes…</div>

  const filtered = q
    ? rows.filter(r => `${r.name} ${r.planLabel} ${r.stripeSubscriptionId ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    : rows

  // Resumen por plan
  const byPlan = ALL_PLANS.map(p => ({ plan: p, label: PLAN_LABELS[p], count: rows.filter(r => r.plan === p).length }))
  const paid   = rows.filter(r => r.plan !== 'free')

  const startEdit = (row) => { setEditing(row.id); setNewPlan(row.plan) }
  const cancelEdit = ()   => setEditing(null)

  const toggleDisable = async (orgId) => {
    const res = await superadminApi.disableOrg(orgId).catch(() => null)
    if (res) setRows(prev => prev.map(r => r.id === orgId ? { ...r, disabled: res.disabled } : r))
  }

  const confirmDelete = async (orgId) => {
    await superadminApi.deleteOrg(orgId).catch(() => {})
    setRows(prev => prev.filter(r => r.id !== orgId))
    setDelConf(null)
    if (expanded === orgId) setExpanded(null)
  }

  const savePlan = async (orgId) => {
    setSaving(true)
    try {
      await superadminApi.changePlan(orgId, newPlan)
      setRows(prev => prev.map(r => r.id === orgId
        ? { ...r, plan: newPlan, planLabel: PLAN_LABELS[newPlan],
            history: [{ planId: newPlan, planLabel: PLAN_LABELS[newPlan], method: 'superadmin', amount: 0, activatedAt: new Date().toLocaleDateString('es-MX') }, ...r.history] }
        : r))
      setEditing(null)
    } catch { /* keep editing open */ }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.plansWrap}>
      {/* Stats */}
      <div className={styles.planStats}>
        {byPlan.map(p => (
          <div key={p.plan} className={styles.planStatCard}>
            <div className={styles.planStatDot} style={{ background: PLAN_COLORS[p.plan] ?? '#6b7280' }} />
            <div>
              <div className={styles.planStatCount}>{p.count}</div>
              <div className={styles.planStatLabel}>{p.label}</div>
            </div>
          </div>
        ))}
        <div className={styles.planStatCard} style={{ borderColor: '#34d39940' }}>
          <div className={styles.planStatDot} style={{ background: '#34d399' }} />
          <div>
            <div className={styles.planStatCount}>${rows.reduce((s, r) => s + (r.totalPaid ?? 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
            <div className={styles.planStatLabel}>Total cobrado</div>
          </div>
        </div>
        <div className={styles.planStatCard} style={{ borderColor: '#34d39940' }}>
          <div className={styles.planStatDot} style={{ background: '#34d399' }} />
          <div>
            <div className={styles.planStatCount}>{rows.filter(r => r.engagement === 'alto').length}</div>
            <div className={styles.planStatLabel}>Uso alto</div>
          </div>
        </div>
        <div className={styles.planStatCard} style={{ borderColor: '#ef444440' }}>
          <div className={styles.planStatDot} style={{ background: '#ef4444' }} />
          <div>
            <div className={styles.planStatCount}>{rows.filter(r => r.engagement === 'bajo').length}</div>
            <div className={styles.planStatLabel}>Sin actividad</div>
          </div>
        </div>
        <div className={styles.planStatCard} style={{ borderColor: '#38bdf840' }}>
          <div className={styles.planStatDot} style={{ background: '#38bdf8' }} />
          <div>
            <div className={styles.planStatCount}>{rows.reduce((s, r) => s + (r.eventCount ?? 0), 0)}</div>
            <div className={styles.planStatLabel}>Eventos totales</div>
          </div>
        </div>
        <div className={styles.planStatCard} style={{ borderColor: '#a78bfa40' }}>
          <div className={styles.planStatDot} style={{ background: '#a78bfa' }} />
          <div>
            <div className={styles.planStatCount}>${rows.reduce((s, r) => s + (r.appRevenue ?? 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
            <div className={styles.planStatLabel}>Ingresos en app</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.tableSearch} style={{ background: '#181824', borderRadius: 10, border: '1px solid #252535', marginBottom: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Buscar organización…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button onClick={() => setQ('')}>✕</button>}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organización</th>
                <th>Plan actual</th>
                <th>Uso</th>
                <th>Eventos</th>
                <th>Clientes</th>
                <th>Ingresos app</th>
                <th>Última actividad</th>
                <th>Trial</th>
                <th>WhatsApp</th>
                <th>Total pagado</th>
                <th>Registro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <>
                  <tr key={row.id} className={expanded === row.id ? styles.trExpanded : ''} style={row.disabled ? { opacity: 0.5 } : {}}>
                    <td>
                      <strong>{row.name}</strong>
                      {row.disabled && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: 4 }}>Deshabilitada</span>}
                    </td>
                    <td>
                      {editing === row.id ? (
                        <div className={styles.planEditRow}>
                          <select
                            value={newPlan}
                            onChange={e => setNewPlan(e.target.value)}
                            className={styles.planSelect}
                          >
                            {ALL_PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                          </select>
                          <button className={styles.btnSave} onClick={() => savePlan(row.id)} disabled={saving}>
                            {saving ? '…' : '✓'}
                          </button>
                          <button className={styles.btnCancel} onClick={cancelEdit}>✕</button>
                        </div>
                      ) : (
                        <span className={styles.planBadge} style={{ background: `${PLAN_COLORS[row.plan] ?? '#6b7280'}20`, color: PLAN_COLORS[row.plan] ?? '#6b7280' }}>
                          {row.planLabel}
                        </span>
                      )}
                    </td>
                    <td>{(() => {
                      if (!row.trialStartedAt) return <span className={styles.muted} style={{ fontSize: 11 }}>Sin trial</span>
                      const started = new Date(row.trialStartedAt)
                      const daysLeft = Math.max(0, 3 - Math.floor((Date.now() - started.getTime()) / 86_400_000))
                      return daysLeft > 0
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 4 }}>✓ {daysLeft}d restantes</span>
                        : <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 4 }}>Vencido</span>
                    })()}</td>
                    <td>{row.waConnected
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: '#25D366', background: 'rgba(37,211,102,0.12)', padding: '2px 8px', borderRadius: 4 }}>✓ Conectado</span>
                      : <span className={styles.muted} style={{ fontSize: 11 }}>—</span>
                    }</td>
                    <td>{(() => {
                      const cfg = { alto: ['#34d399','rgba(52,211,153,0.12)','▲ Alto'], medio: ['#f59e0b','rgba(245,158,11,0.12)','◆ Medio'], bajo: ['#ef4444','rgba(239,68,68,0.12)','▼ Bajo'] }[row.engagement] ?? ['#6b7280','rgba(107,114,128,0.12)','—']
                      return <span style={{ fontSize: 11, fontWeight: 700, color: cfg[0], background: cfg[1], padding: '2px 8px', borderRadius: 4 }}>{cfg[2]}</span>
                    })()}</td>
                    <td className={styles.muted} style={{ textAlign: 'center' }}>{row.eventCount ?? 0}</td>
                    <td className={styles.muted} style={{ textAlign: 'center' }}>{row.clientCount ?? 0}</td>
                    <td className={styles.muted}>${Number(row.appRevenue ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</td>
                    <td className={styles.muted} style={{ fontSize: 11 }}>{row.lastActivityAt ? (() => {
                      const d = Math.floor((Date.now() - new Date(row.lastActivityAt).getTime()) / 86_400_000)
                      return d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : d < 7 ? `Hace ${d}d` : d < 30 ? `Hace ${Math.floor(d/7)}sem` : `Hace ${Math.floor(d/30)}m`
                    })() : <span style={{ opacity: 0.4 }}>Sin actividad</span>}</td>
                    <td>{(() => {
                      if (!row.trialStartedAt) return <span className={styles.muted} style={{ fontSize: 11 }}>Sin trial</span>
                      const started = new Date(row.trialStartedAt)
                      const daysLeft = Math.max(0, 3 - Math.floor((Date.now() - started.getTime()) / 86_400_000))
                      return daysLeft > 0
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 4 }}>✓ {daysLeft}d restantes</span>
                        : <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 4 }}>Vencido</span>
                    })()}</td>
                    <td>{row.waConnected
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: '#25D366', background: 'rgba(37,211,102,0.12)', padding: '2px 8px', borderRadius: 4 }}>✓ Conectado</span>
                      : <span className={styles.muted} style={{ fontSize: 11 }}>—</span>
                    }</td>
                    <td><strong>${Number(row.totalPaid ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong></td>
                    <td className={styles.muted}>{row.createdAt}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {editing !== row.id && (
                          <button className={styles.actionBtn} title="Cambiar plan" onClick={() => startEdit(row)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        )}
                        <button
                          className={styles.actionBtn}
                          title={row.disabled ? 'Habilitar cuenta' : 'Deshabilitar cuenta'}
                          onClick={() => toggleDisable(row.id)}
                        >
                          {row.disabled
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          }
                        </button>
                        {delConf === row.id
                          ? <span className={styles.delConfirm}>
                              <button className={styles.delYes} onClick={() => confirmDelete(row.id)}>Sí</button>
                              <button className={styles.delNo} onClick={() => setDelConf(null)}>No</button>
                            </span>
                          : <button className={styles.actionBtn} title="Eliminar cuenta" onClick={() => setDelConf(row.id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        }
                        <button
                          className={styles.actionBtn}
                          title={expanded === row.id ? 'Ocultar historial' : 'Ver historial'}
                          onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points={expanded === row.id ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === row.id && (
                    <tr key={`${row.id}-history`} className={styles.historyRow}>
                      <td colSpan={12}>
                        <div className={styles.historyWrap}>
                          {/* Usage stats grid */}
                          <div className={styles.usageGrid}>
                            {[
                              { label: 'Eventos', value: row.eventCount ?? 0, icon: '📅' },
                              { label: 'Clientes', value: row.clientCount ?? 0, icon: '👤' },
                              { label: 'Contratos', value: row.contractCount ?? 0, icon: '📄' },
                              { label: 'Leads', value: row.leadCount ?? 0, icon: '🎯' },
                              { label: 'Colaboradores', value: row.workerCount ?? 0, icon: '👥' },
                              { label: 'Ingresos en app', value: `$${Number(row.appRevenue ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, icon: '💰' },
                            ].map(s => (
                              <div key={s.label} className={styles.usageStat}>
                                <span className={styles.usageIcon}>{s.icon}</span>
                                <span className={styles.usageVal}>{s.value}</span>
                                <span className={styles.usageLabel}>{s.label}</span>
                              </div>
                            ))}
                          </div>
                          {/* Plan history */}
                          <div className={styles.historyTitle}>Historial de plan — {row.name}</div>
                          {row.history.length === 0
                            ? <div className={styles.historyEmpty}>Sin historial registrado</div>
                            : (
                              <table className={styles.historyTable}>
                                <thead><tr><th>Plan</th><th>Método</th><th>Código promo</th><th>Monto</th><th>Fecha</th></tr></thead>
                                <tbody>
                                  {row.history.map((h, i) => (
                                    <tr key={i}>
                                      <td><span className={styles.planBadge} style={{ background: `${PLAN_COLORS[h.planId] ?? '#6b7280'}20`, color: PLAN_COLORS[h.planId] ?? '#6b7280' }}>{h.planLabel}</span></td>
                                      <td className={styles.muted}>{h.method}</td>
                                      <td className={styles.muted}>{h.promoCode || '—'}</td>
                                      <td><strong>${Number(h.amount).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong></td>
                                      <td className={styles.muted}>{h.activatedAt}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableCount}>{filtered.length} organizaciones · {paid.length} con plan activo</div>
      </div>
    </div>
  )
}

// ── Ventas tab ─────────────────────────────────────────────────────────────
const METHOD_LABEL = { stripe: 'Stripe', promo: 'Código promo', superadmin: 'Superadmin', free: 'Gratis' }

function VentasTab() {
  const [data,      setData]      = useState(null)
  const [monthFilter, setMonthFilter] = useState('todos')

  useEffect(() => {
    superadminApi.getVentas().then(setData).catch(() => setData({ totalRevenue: 0, monthRevenue: 0, paidCount: 0, freeCount: 0, byMonth: [], rows: [] }))
  }, [])

  if (!data) return <div className={styles.loadingMsg}>Cargando ventas…</div>

  const fmt = n => '$' + Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })

  // Available months from data
  const months = [...new Set(data.rows.map(r => r.month))].sort().reverse()

  const rows = monthFilter === 'todos'
    ? data.rows
    : data.rows.filter(r => r.month === monthFilter)

  const filteredRevenue = rows.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0)

  const maxBar = Math.max(...data.byMonth.map(b => Number(b.value)), 1)

  return (
    <div className={styles.plansWrap}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#34d39920', color: '#34d399' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#34d399' }}>{fmt(data.totalRevenue)}</div>
            <div className={styles.statLabel}>Ingresos totales</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#7c6af720', color: '#7c6af7' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#7c6af7' }}>{fmt(data.monthRevenue)}</div>
            <div className={styles.statLabel}>Este mes</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#c9a22720', color: '#c9a227' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#c9a227' }}>{data.paidCount}</div>
            <div className={styles.statLabel}>Activaciones de pago</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#6b728020', color: '#6b7280' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#6b7280' }}>{data.freeCount}</div>
            <div className={styles.statLabel}>Activaciones gratis/promo</div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Ingresos por mes — {new Date().getFullYear()}</div>
        <div className={styles.ventasBar}>
          {data.byMonth.map(b => (
            <div key={b.label} className={styles.ventasBarCol}>
              <span className={styles.ventasBarVal}>{Number(b.value) > 0 ? fmt(b.value) : ''}</span>
              <div className={styles.ventasBarTrack}>
                <div
                  className={styles.ventasBarFill}
                  style={{ height: `${Math.max((Number(b.value) / maxBar) * 100, Number(b.value) > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className={styles.miniBarLabel}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + table */}
      <div className={styles.tableWrap}>
        <div className={styles.ventasFilterRow}>
          <span className={styles.ventasFilterLabel}>Mes:</span>
          <select
            className={styles.ventasSelect}
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            {months.map(m => {
              const [y, mo] = m.split('-')
              const name = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][Number(mo) - 1]
              return <option key={m} value={m}>{name} {y}</option>
            })}
          </select>
          <span className={styles.ventasFilterTotal}>
            {rows.length} registros · <strong style={{ color: '#34d399' }}>{fmt(filteredRevenue)}</strong>
          </span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organización</th>
                <th>Plan</th>
                <th>Método</th>
                <th>Código promo</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={6} className={styles.tableEmpty}>Sin registros para este periodo</td></tr>
                : rows.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.orgName}</strong></td>
                    <td><span className={styles.planBadge} style={{ background: `${PLAN_COLORS[r.planId] ?? '#6b7280'}20`, color: PLAN_COLORS[r.planId] ?? '#6b7280' }}>{r.planLabel}</span></td>
                    <td className={styles.muted}>{METHOD_LABEL[r.method] ?? r.method}</td>
                    <td className={styles.muted}>{r.promoCode || '—'}</td>
                    <td>
                      {r.isPaid
                        ? <strong style={{ color: '#34d399' }}>{fmt(r.amount)}</strong>
                        : <span className={styles.muted}>Gratis</span>
                      }
                    </td>
                    <td className={styles.muted}>{r.activatedAt}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className={styles.tableCount}>{rows.length} activaciones</div>
      </div>
    </div>
  )
}

// ── Promo codes tab ────────────────────────────────────────────────────────
const EMPTY_FORM = { code: '', planId: 'negocio', description: '', discountPct: 100, maxUses: -1, expiresAt: '' }

function PromoCodesTab() {
  const [rows,    setRows]    = useState(null)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null) // row being edited
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [delConf, setDelConf] = useState(null)

  useEffect(() => {
    superadminApi.getPromoCodes().then(setRows).catch(() => setRows([]))
  }, [])

  if (!rows) return <div className={styles.loadingMsg}>Cargando códigos…</div>

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true) }
  const openEdit   = r  => { setEditing(r); setForm({ code: r.code, planId: r.planId, description: r.description ?? '', discountPct: r.discountPct, maxUses: r.maxUses, expiresAt: r.expiresAt ?? '' }); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const save = async () => {
    if (!form.code.trim()) { setError('El código es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        code:        form.code.trim().toUpperCase(),
        planId:      form.planId,
        description: form.description || null,
        discountPct: Number(form.discountPct),
        maxUses:     Number(form.maxUses),
        expiresAt:   form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }
      if (editing) {
        const updated = await superadminApi.updatePromoCode(editing.id, payload)
        setRows(prev => prev.map(r => r.id === editing.id ? updated : r))
      } else {
        const created = await superadminApi.createPromoCode(payload)
        setRows(prev => [created, ...prev])
      }
      closeModal()
    } catch (e) {
      setError(e.message?.includes('409') || e.status === 409 ? 'Ese código ya existe' : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggle = async (row) => {
    const updated = await superadminApi.togglePromoCode(row.id).catch(() => null)
    if (updated) setRows(prev => prev.map(r => r.id === row.id ? { ...r, active: updated.active } : r))
  }

  const confirmDelete = async (id) => {
    await superadminApi.deletePromoCode(id).catch(() => {})
    setRows(prev => prev.filter(r => r.id !== id))
    setDelConf(null)
  }

  const active   = rows.filter(r => r.active && !r.exhausted).length
  const inactive = rows.filter(r => !r.active || r.exhausted).length

  return (
    <div className={styles.plansWrap}>
      {/* Header */}
      <div className={styles.promoHeader}>
        <div className={styles.promoStats}>
          <span className={styles.promoStatItem}><strong style={{ color: '#34d399' }}>{active}</strong> activos</span>
          <span className={styles.promoStatItem}><strong style={{ color: '#888899' }}>{inactive}</strong> inactivos/agotados</span>
          <span className={styles.promoStatItem}><strong style={{ color: '#e6e6f0' }}>{rows.length}</strong> total</span>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>+ Nuevo código</button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Plan</th>
                <th>Descuento</th>
                <th>Usos</th>
                <th>Estado</th>
                <th>Vence</th>
                <th>Descripción</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className={styles.tableEmpty}>Sin códigos. Crea el primero.</td></tr>
              )}
              {rows.map(row => {
                const statusColor = row.exhausted ? '#6b7280' : row.active ? '#34d399' : '#f59e0b'
                const statusLabel = row.exhausted ? 'Agotado' : row.active ? 'Activo' : 'Inactivo'
                return (
                  <tr key={row.id}>
                    <td><code className={styles.codeChip}>{row.code}</code></td>
                    <td><span className={styles.planBadge} style={{ background: `${PLAN_COLORS[row.planId] ?? '#6b7280'}20`, color: PLAN_COLORS[row.planId] ?? '#6b7280' }}>{row.planLabel}</span></td>
                    <td>
                      <span className={styles.discountBadge} style={{ color: row.discountPct === 100 ? '#34d399' : '#c9a227' }}>
                        {row.discountPct}%{row.discountPct === 100 ? ' gratis' : ' dto.'}
                      </span>
                    </td>
                    <td className={styles.muted}>
                      {row.usedCount} / {row.maxUses === -1 ? '∞' : row.maxUses}
                    </td>
                    <td>
                      <span className={styles.statusPill} style={{ background: `${statusColor}18`, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className={styles.muted}>{row.expiresAt ?? '—'}</td>
                    <td className={styles.muted} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description || '—'}</td>
                    <td className={styles.muted}>{row.createdAt}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.actionBtn} title="Editar" onClick={() => openEdit(row)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {!row.exhausted && (
                          <button className={styles.actionBtn} title={row.active ? 'Desactivar' : 'Activar'} onClick={() => toggle(row)}>
                            {row.active
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            }
                          </button>
                        )}
                        {delConf === row.id
                          ? <span className={styles.delConfirm}>
                              <button className={styles.delYes} onClick={() => confirmDelete(row.id)}>Sí</button>
                              <button className={styles.delNo}  onClick={() => setDelConf(null)}>No</button>
                            </span>
                          : <button className={styles.actionBtn} title="Eliminar" onClick={() => setDelConf(row.id)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        }
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableCount}>{rows.length} códigos</div>
      </div>

      {/* Modal */}
      {modal && (
        <div className={styles.promoOverlay} onClick={closeModal}>
          <div className={styles.promoModal} onClick={e => e.stopPropagation()}>
            <div className={styles.promoModalHeader}>
              <h3 className={styles.promoModalTitle}>{editing ? 'Editar código' : 'Nuevo código promo'}</h3>
              <button className={styles.promoModalClose} onClick={closeModal}>✕</button>
            </div>
            <div className={styles.promoModalBody}>
              <div className={styles.promoGrid}>
                <div className={styles.promoField}>
                  <label>Código</label>
                  <input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VERANO2026"
                    disabled={!!editing}
                  />
                </div>
                <div className={styles.promoField}>
                  <label>Plan que activa</label>
                  <select value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))}>
                    <option value="solo">Solo</option>
                    <option value="negocio">Negocio</option>
                    <option value="agencia">Agencia</option>
                    <option value="free">Sin plan (gratis)</option>
                  </select>
                </div>
                <div className={styles.promoField}>
                  <label>Descuento %</label>
                  <select value={form.discountPct} onChange={e => setForm(f => ({ ...f, discountPct: Number(e.target.value) }))}>
                    <option value={10}>10% — Descuento parcial</option>
                    <option value={20}>20% — Descuento parcial</option>
                    <option value={50}>50% — Mitad de precio</option>
                    <option value={100}>100% — Gratis (activa directo)</option>
                  </select>
                </div>
                <div className={styles.promoField}>
                  <label>Máx. usos (-1 = ilimitado)</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                    min={-1}
                  />
                </div>
                <div className={styles.promoField} style={{ gridColumn: '1 / -1' }}>
                  <label>Fecha de expiración (opcional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
                <div className={styles.promoField} style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción (opcional)</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Código de lanzamiento 2026"
                  />
                </div>
              </div>
              {error && <p className={styles.promoError}>{error}</p>}
              <div className={styles.promoModalActions}>
                <button className={styles.btnSecondary} onClick={closeModal}>Cancelar</button>
                <button className={styles.btnPrimary} onClick={save} disabled={saving}>
                  {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear código'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
// ── Soporte tab ────────────────────────────────────────────────────────────
const TYPE_LABEL   = { duda: 'Duda', problema: 'Problema' }
const STATUS_COLOR = { open: '#f59e0b', en_proceso: '#38bdf8', closed: '#34d399' }
const STATUS_LABEL = { open: 'Abierto', en_proceso: 'En proceso', closed: 'Resuelto' }
const STATUS_OPTS  = ['open', 'en_proceso', 'closed']

// Loads conversation for a single ticket on-demand
function TicketDetail({ ticket, onStatusChange, onDelete }) {
  const [detail,    setDetail]    = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying,  setReplying]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    superadminApi.getSupportTicket(ticket.id)
      .then(setDetail)
      .catch(() => setDetail({ ...ticket, messages: [] }))
  }, [ticket.id]) // eslint-disable-line

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setReplying(true)
    try {
      const res = await superadminApi.replyToTicket(ticket.id, replyText.trim())
      setDetail(d => ({ ...d, messages: [...(d?.messages ?? []), res] }))
      if (res.ticketStatus) onStatusChange(ticket.id, res.ticketStatus)
      setReplyText('')
    } catch {}
    finally { setReplying(false) }
  }

  const handleStatusChange = async (status) => {
    try {
      await superadminApi.updateSupportStatus(ticket.id, status)
      onStatusChange(ticket.id, status)
    } catch {}
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await superadminApi.deleteSupportTicket(ticket.id)
      onDelete(ticket.id)
    } catch { setDeleting(false) }
  }

  return (
    <div className={styles.soporteDetail}>
      {/* Status buttons */}
      <div className={styles.soporteDetailActions}>
        <div className={styles.soporteStatusBtns}>
          {STATUS_OPTS.map(s => (
            <button
              key={s}
              className={`${styles.soporteStatusBtn} ${ticket.status === s ? styles.soporteStatusBtnActive : ''}`}
              style={ticket.status === s ? { borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s], background: `${STATUS_COLOR[s]}18` } : {}}
              onClick={() => handleStatusChange(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {confirmDel ? (
          <div className={styles.soporteDelConfirm}>
            <span>¿Eliminar?</span>
            <button className={styles.soporteDelYes} onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : 'Sí'}
            </button>
            <button className={styles.soporteDelNo} onClick={() => setConfirmDel(false)}>No</button>
          </div>
        ) : (
          <button className={styles.soporteDeleteBtn} onClick={() => setConfirmDel(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Eliminar
          </button>
        )}
      </div>

      {/* Conversation */}
      <div className={styles.soporteConvo}>
        {/* Original message */}
        <div className={styles.soporteConvoMsg}>
          <div className={styles.soporteConvoBubble} style={{ background: 'rgba(124,106,247,0.1)', borderColor: 'rgba(124,106,247,0.2)' }}>
            <p className={styles.soporteConvoText}>{detail?.message ?? ticket.message}</p>
            {(detail?.photoUrl ?? ticket.photoUrl) && (
              <a href={detail?.photoUrl ?? ticket.photoUrl} target="_blank" rel="noreferrer">
                <img src={detail?.photoUrl ?? ticket.photoUrl} alt="captura" className={styles.soporteDetailImg} />
              </a>
            )}
          </div>
          <span className={styles.soporteConvoMeta}>{ticket.userName || ticket.userEmail} · {ticket.createdAt}</span>
        </div>

        {detail === null && <p style={{ fontSize: 12, color: '#6b7280' }}>Cargando conversación…</p>}

        {(detail?.messages ?? []).map(m => (
          <div key={m.id} className={`${styles.soporteConvoMsg} ${m.authorRole === 'admin' ? styles.soporteConvoAdmin : ''}`}>
            <div className={styles.soporteConvoAdminBubble}>
              <p className={styles.soporteConvoText}>{m.message}</p>
            </div>
            <span className={styles.soporteConvoMeta}>
              {m.authorRole === 'admin' ? 'Soporte Elixe' : (ticket.userName || 'Usuario')} · {m.createdAt}
            </span>
          </div>
        ))}
      </div>

      {/* Reply */}
      <form className={styles.soporteReplyBar} onSubmit={handleReply}>
        <input
          className={styles.soporteReplyInput}
          placeholder="Responder al cliente…"
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" className={styles.soporteReplyBtn} disabled={replying || !replyText.trim()}>
          {replying ? '…' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}

function SoporteTab() {
  const [tickets,  setTickets]  = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [filter,   setFilter]   = useState('all')
  const [q,        setQ]        = useState('')

  useEffect(() => {
    superadminApi.getSupportTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
  }, [])

  const handleStatusChange = (id, status) =>
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))

  const handleDelete = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id))
    setExpanded(null)
  }

  if (!tickets) return <div className={styles.loadingMsg}>Cargando tickets…</div>

  const openCount    = tickets.filter(t => t.status === 'open').length
  const enProcesoCount = tickets.filter(t => t.status === 'en_proceso').length

  const filtered = tickets
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !q || `${t.orgName} ${t.userName} ${t.message}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className={styles.soporteWrap}>
      {/* Stats row */}
      <div className={styles.soporteStats}>
        {[
          { key: 'all',        label: 'Total',      num: tickets.length,  color: '#e6e6f0' },
          { key: 'open',       label: 'Abiertos',   num: openCount,       color: '#f59e0b' },
          { key: 'en_proceso', label: 'En proceso', num: enProcesoCount,  color: '#38bdf8' },
          { key: 'closed',     label: 'Resueltos',  num: tickets.length - openCount - enProcesoCount, color: '#34d399' },
        ].map(s => (
          <div key={s.key} className={`${styles.soporteStat} ${filter === s.key ? styles.soporteStatActive : ''}`} onClick={() => setFilter(s.key)}>
            <span className={styles.soporteStatNum} style={{ color: s.color }}>{s.num}</span>
            <span className={styles.soporteStatLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={styles.tableSearch} style={{ background: '#181824', borderRadius: 10, border: '1px solid #252535', marginBottom: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button onClick={() => setQ('')}>✕</button>}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organización</th>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.tableEmpty}>Sin tickets</td></tr>
              ) : filtered.map(t => (
                <>
                  <tr key={t.id} className={expanded === t.id ? styles.trExpanded : ''} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                    <td><strong>{t.orgName || '—'}</strong></td>
                    <td>
                      <div style={{ lineHeight: 1.3 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.userName || '—'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t.userEmail || ''}</div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.soporteTypeBadge} style={{ background: t.type === 'problema' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)', color: t.type === 'problema' ? '#f87171' : '#818cf8' }}>
                        {TYPE_LABEL[t.type] ?? t.type}
                      </span>
                    </td>
                    <td className={styles.soporteMsgCell}>{t.message.slice(0, 80)}{t.message.length > 80 ? '…' : ''}</td>
                    <td>
                      <span className={styles.soporteStatusDot} style={{ background: STATUS_COLOR[t.status] ?? '#6b7280' }} />
                      <span style={{ fontSize: 12, color: STATUS_COLOR[t.status] ?? '#6b7280' }}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className={styles.muted} style={{ fontSize: 12 }}>{t.createdAt}</td>
                  </tr>
                  {expanded === t.id && (
                    <tr key={`${t.id}-detail`} className={styles.trDetail}>
                      <td colSpan={6}>
                        <TicketDetail
                          ticket={t}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableCount}>{filtered.length} tickets</div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'resumen',        path: 'resumen',        label: 'Resumen' },
  { key: 'organizaciones', path: 'organizaciones', label: 'Organizaciones' },
  { key: 'usuarios',       path: 'usuarios',       label: 'Usuarios' },
  { key: 'eventos',        path: 'eventos',        label: 'Eventos' },
  { key: 'clientes',       path: 'clientes',       label: 'Clientes' },
  { key: 'ventas',         path: 'ventas',         label: 'Ventas' },
  { key: 'planes',         path: 'planes',         label: 'Planes' },
  { key: 'paquetes',       path: 'paquetes',       label: 'Paquetes' },
  { key: 'codigos',        path: 'codigos',        label: 'Códigos promo' },
  { key: 'campanias',      path: 'campanias',      label: 'Campañas' },
  { key: 'soporte',        path: 'soporte',        label: 'Soporte' },
]

export default function SuperAdminPage() {
  const navigate = useNavigate()
  const { section } = useParams()
  const tab = TABS.find(t => t.path === section)?.key ?? 'resumen'

  const [authed,   setAuthed]   = useState(superadminApi.hasSession())
  const [overview, setOverview] = useState(null)
  const [orgs,     setOrgs]     = useState(null)
  const [users,    setUsers]    = useState(null)
  const [events,   setEvents]   = useState(null)
  const [clients,  setClients]  = useState(null)
  const [loading,  setLoading]  = useState(false)

  // Redirect bare /superadmin to /superadmin/resumen
  useEffect(() => {
    if (!section) navigate('/superadmin/resumen', { replace: true })
  }, [section]) // eslint-disable-line

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    superadminApi.getOverview()
      .then(setOverview)
      .catch(() => { superadminApi.logout(); setAuthed(false) })
      .finally(() => setLoading(false))
  }, [authed])

  useEffect(() => {
    if (!authed) return
    if (tab === 'organizaciones' && !orgs)    superadminApi.getOrgs().then(setOrgs).catch(() => setOrgs([]))
    if (tab === 'usuarios'       && !users)   superadminApi.getUsers().then(setUsers).catch(() => setUsers([]))
    if (tab === 'eventos'        && !events)  superadminApi.getEvents().then(setEvents).catch(() => setEvents([]))
    if (tab === 'clientes'       && !clients) superadminApi.getClients().then(setClients).catch(() => setClients([]))
  }, [tab, authed]) // eslint-disable-line

  const fmt = n => '$' + Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })

  const goTo = (path) => navigate(`/superadmin/${path}`)

  const handleLogout = () => {
    superadminApi.logout()
    setAuthed(false)
    setOverview(null); setOrgs(null); setUsers(null); setEvents(null); setClients(null)
    navigate('/superadmin/resumen', { replace: true })
  }

  if (!authed) return <SuperAdminLogin onSuccess={() => { setAuthed(true); navigate('/superadmin/resumen') }} />

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoText}>SUPERADMIN</span>
        </div>
        <nav className={styles.nav}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`${styles.navItem} ${tab === t.key ? styles.navActive : ''}`}
              onClick={() => goTo(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {overview && (
          <div className={styles.sidebarStats}>
            <div className={styles.sidebarStatItem}>
              <span className={styles.sidebarStatLabel}>Ingresos totales</span>
              <span className={styles.sidebarStatValue} style={{ color: '#34d399' }}>
                {fmt(overview.totalRevenue)}
              </span>
            </div>
            <div className={styles.sidebarStatItem}>
              <span className={styles.sidebarStatLabel}>Paquetes vendidos</span>
              <span className={styles.sidebarStatValue} style={{ color: '#7c6af7' }}>
                {overview.paidCount ?? 0}
              </span>
            </div>
            <div className={styles.sidebarStatItem}>
              <span className={styles.sidebarStatLabel}>Orgs activas</span>
              <span className={styles.sidebarStatValue}>{overview.totalOrgs}</span>
            </div>
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <span className={styles.sidebarUser}>Super Admin</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      </aside>

      {/* Content */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.topbarTitle}>{TABS.find(t => t.key === tab)?.label}</h1>
          <span className={styles.topbarBadge}>Panel de control</span>
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loadingMsg}>Cargando…</div>}

          {/* ── RESUMEN ── */}
          {!loading && tab === 'resumen' && overview && (
            <>
              <div className={styles.statsGrid}>
                <StatCard label="Organizaciones" value={overview.totalOrgs}
                  color="#7c6af7"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                />
                <StatCard label="Admins" value={overview.totalUsers}
                  color="#c9a227"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                />
                <StatCard label="Trabajadores" value={overview.totalWorkers}
                  color="#38bdf8"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                />
                <StatCard label="Eventos" value={overview.totalEvents}
                  color="#34d399"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                />
                <StatCard label="Clientes" value={overview.totalClients}
                  color="#a78bfa"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>}
                />
                <StatCard label="Ingresos totales" value={fmt(overview.totalRevenue)}
                  color="#fb923c"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                />
              </div>

              <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Distribución por plan</h3>
                  <DonutChart data={overview.byPlan} />
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Cuentas creadas en {new Date().getFullYear()}</h3>
                  <MiniBar data={overview.orgsByMonth} color="#7c6af7" />
                </div>
              </div>

              <div className={styles.recentCard}>
                <h3 className={styles.chartTitle}>Organizaciones recientes</h3>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Organización</th><th>Plan</th><th>Admins</th><th>Eventos</th><th>Registrada</th></tr>
                  </thead>
                  <tbody>
                    {overview.recentOrgs.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.name}</strong></td>
                        <td><span className={styles.planBadge} style={{ background: `${PLAN_COLORS[o.plan]}20`, color: PLAN_COLORS[o.plan] }}>{o.label}</span></td>
                        <td>{o.userCount}</td>
                        <td>{o.eventCount}</td>
                        <td className={styles.muted}>{o.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ORGANIZACIONES ── */}
          {tab === 'organizaciones' && (
            orgs === null ? <div className={styles.loadingMsg}>Cargando…</div> :
            <DataTable
              rows={orgs}
              columns={[
                { key: 'name',        label: 'Organización' },
                { key: 'planLabel',   label: 'Plan', render: r => <span className={styles.planBadge} style={{ background: `${PLAN_COLORS[r.plan]}20`, color: PLAN_COLORS[r.plan] }}>{r.planLabel}</span> },
                { key: 'userCount',   label: 'Admins' },
                { key: 'workerCount', label: 'Usuarios' },
                { key: 'eventCount',  label: 'Eventos' },
                { key: 'clientCount', label: 'Clientes' },
                { key: 'createdAt',   label: 'Registrada', render: r => <span className={styles.muted}>{r.createdAt}</span> },
              ]}
            />
          )}

          {/* ── USUARIOS ── */}
          {tab === 'usuarios' && (
            users === null ? <div className={styles.loadingMsg}>Cargando…</div> :
            <DataTable
              rows={users}
              columns={[
                { key: 'name',      label: 'Nombre' },
                { key: 'email',     label: 'Correo' },
                { key: 'phone',     label: 'Teléfono', render: r => <span className={styles.muted}>{r.phone || '—'}</span> },
                { key: 'role',      label: 'Rol', render: r => <span className={`${styles.roleBadge} ${r.role === 'admin' ? styles.roleAdmin : styles.roleMember}`}>{r.role === 'admin' ? 'Admin' : 'Usuario'}</span> },
                { key: 'orgName',   label: 'Organización' },
                { key: 'planLabel', label: 'Plan', render: r => <span className={styles.planBadge} style={{ background: `${PLAN_COLORS[r.plan]}20`, color: PLAN_COLORS[r.plan] }}>{r.planLabel}</span> },
                { key: 'createdAt', label: 'Registro', render: r => <span className={styles.muted}>{r.createdAt}</span> },
              ]}
            />
          )}

          {/* ── EVENTOS ── */}
          {tab === 'eventos' && (
            events === null ? <div className={styles.loadingMsg}>Cargando…</div> :
            <DataTable
              rows={events}
              columns={[
                { key: 'name',      label: 'Evento' },
                { key: 'orgName',   label: 'Organización' },
                { key: 'type',      label: 'Tipo' },
                { key: 'budget',    label: 'Presupuesto', render: r => <strong>${Number(r.budget).toLocaleString('es-MX')}</strong> },
                { key: 'status',    label: 'Estado', render: r => <span className={styles.statusBadge}>{STATUS_LABELS[r.status] ?? r.status}</span> },
                { key: 'eventDate', label: 'Fecha evento', render: r => <span className={styles.muted}>{r.eventDate}</span> },
                { key: 'createdAt', label: 'Registrado', render: r => <span className={styles.muted}>{r.createdAt}</span> },
              ]}
            />
          )}

          {/* ── CLIENTES ── */}
          {tab === 'clientes' && (
            clients === null ? <div className={styles.loadingMsg}>Cargando…</div> :
            <DataTable
              rows={clients}
              columns={[
                { key: 'name',      label: 'Nombre' },
                { key: 'orgName',   label: 'Organización' },
                { key: 'email',     label: 'Correo', render: r => <span className={styles.muted}>{r.email || '—'}</span> },
                { key: 'phone',     label: 'Teléfono', render: r => <span className={styles.muted}>{r.phone || '—'}</span> },
                { key: 'createdAt', label: 'Registrado', render: r => <span className={styles.muted}>{r.createdAt}</span> },
              ]}
            />
          )}

          {/* ── VENTAS ── */}
          {tab === 'ventas' && <VentasTab />}

          {/* ── PLANES ── */}
          {tab === 'planes' && <PlansTab />}
          {tab === 'paquetes' && <PaquetesTab />}

          {/* ── PROMOS ── */}
          {tab === 'codigos' && <PromoCodesTab />}

          {/* ── CAMPAÑAS ── */}
          {tab === 'campanias' && <CampañasTab />}

          {/* ── SOPORTE ── */}
          {tab === 'soporte' && <SoporteTab />}
        </div>
      </main>
    </div>
  )
}
