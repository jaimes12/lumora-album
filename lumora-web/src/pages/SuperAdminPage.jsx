import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

// ── Plans tab ──────────────────────────────────────────────────────────────
const PLAN_LABELS = { free: 'Sin plan', solo: 'Solo', negocio: 'Negocio', agencia: 'Agencia' }
const ALL_PLANS   = ['free', 'solo', 'negocio', 'agencia']

function PlansTab() {
  const [rows,       setRows]       = useState(null)
  const [expanded,   setExpanded]   = useState(null)
  const [editing,    setEditing]    = useState(null) // orgId
  const [newPlan,    setNewPlan]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [q,          setQ]          = useState('')

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
                <th>Admins</th>
                <th>Total pagado</th>
                <th>Último pago</th>
                <th>Método</th>
                <th>Stripe Sub ID</th>
                <th>Registro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <>
                  <tr key={row.id} className={expanded === row.id ? styles.trExpanded : ''}>
                    <td><strong>{row.name}</strong></td>
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
                    <td className={styles.muted}>{row.adminCount}</td>
                    <td><strong>${Number(row.totalPaid ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong></td>
                    <td className={styles.muted}>{row.lastActivatedAt}</td>
                    <td className={styles.muted}>{row.lastMethod}</td>
                    <td className={styles.muted} style={{ fontSize: 11 }}>{row.stripeSubscriptionId ? row.stripeSubscriptionId.slice(0, 20) + '…' : '—'}</td>
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
                      <td colSpan={9}>
                        <div className={styles.historyWrap}>
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

// ── Main ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'resumen',       label: 'Resumen' },
  { key: 'organizaciones',label: 'Organizaciones' },
  { key: 'usuarios',      label: 'Usuarios' },
  { key: 'eventos',       label: 'Eventos' },
  { key: 'clientes',      label: 'Clientes' },
  { key: 'planes',        label: 'Planes' },
]

export default function SuperAdminPage() {
  const navigate = useNavigate()
  const [authed,   setAuthed]   = useState(superadminApi.hasSession())
  const [tab,      setTab]      = useState('resumen')
  const [overview, setOverview] = useState(null)
  const [orgs,     setOrgs]     = useState(null)
  const [users,    setUsers]    = useState(null)
  const [events,   setEvents]   = useState(null)
  const [clients,  setClients]  = useState(null)
  const [loading,  setLoading]  = useState(false)

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
    if (tab === 'organizaciones' && !orgs)   superadminApi.getOrgs().then(setOrgs).catch(() => setOrgs([]))
    if (tab === 'usuarios'       && !users)  superadminApi.getUsers().then(setUsers).catch(() => setUsers([]))
    if (tab === 'eventos'        && !events) superadminApi.getEvents().then(setEvents).catch(() => setEvents([]))
    if (tab === 'clientes'       && !clients)superadminApi.getClients().then(setClients).catch(() => setClients([]))
  }, [tab, authed]) // eslint-disable-line

  const fmt = n => '$' + Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })

  const handleLogout = () => {
    superadminApi.logout()
    setAuthed(false)
    setOverview(null); setOrgs(null); setUsers(null); setEvents(null); setClients(null)
  }

  if (!authed) return <SuperAdminLogin onSuccess={() => setAuthed(true)} />

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
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
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

          {/* ── PLANES ── */}
          {tab === 'planes' && <PlansTab />}
        </div>
      </main>
    </div>
  )
}
