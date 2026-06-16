export const TIPO_META = {
  'Boda':                   { color: '#f472b6' },
  'XV Años':                { color: '#a78bfa' },
  'Bautizo':                { color: '#38bdf8' },
  'Primera Comunión':       { color: '#34d399' },
  'Graduación':             { color: '#fbbf24' },
  'Cumpleaños':             { color: '#fb923c' },
  'Baby Shower':            { color: '#93c5fd' },
  'Revelación de Sexo':     { color: '#f9a8d4' },
  'Aniversario':            { color: '#ef4444' },
  'Despedida de Soltera':   { color: '#c084fc' },
  'Corporativo':            { color: '#64748b' },
  'Conferencia':            { color: '#2B6FD4' },
  'Lanzamiento de Producto':{ color: '#06b6d4' },
  'Inauguración':           { color: '#10b981' },
  'Empresarial':            { color: '#475569' },
  'Reunión':                { color: '#94a3b8' },
  'Otro':                   { color: '#6b7280' },
}

const icons = {
  'Boda': (
    <>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </>
  ),
  'XV Años': (
    <>
      <path d="M2 5l3.5 13h13L22 5l-7 8-3-8-3 8-7-8z"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </>
  ),
  'Bautizo': (
    <>
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="4" y1="9" x2="20" y2="9"/>
    </>
  ),
  'Primera Comunión': (
    <>
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="4" y1="8" x2="20" y2="8"/>
      <circle cx="12" cy="16" r="3"/>
    </>
  ),
  'Graduación': (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
      <path d="M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5"/>
    </>
  ),
  'Cumpleaños': (
    <>
      <rect x="3" y="8" width="18" height="14" rx="2"/>
      <path d="M3 12h18"/>
      <path d="M12 8V3"/>
      <path d="M8 8V5"/>
      <path d="M16 8V5"/>
    </>
  ),
  'Baby Shower': (
    <>
      <circle cx="12" cy="13" r="7"/>
      <path d="M9 10c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
      <path d="M12 3v2"/>
      <path d="M5.5 5.5l1.4 1.4"/>
      <path d="M18.5 5.5l-1.4 1.4"/>
    </>
  ),
  'Revelación de Sexo': (
    <>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      <text x="12" y="12" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">?</text>
    </>
  ),
  'Aniversario': (
    <>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <path d="M12 8v4l2 2"/>
    </>
  ),
  'Despedida de Soltera': (
    <>
      <path d="M8 22V12c0-2.2 1.8-4 4-4s4 1.8 4 4v10"/>
      <path d="M6 22h12"/>
      <path d="M12 8V3"/>
      <path d="M9 5l3-2 3 2"/>
    </>
  ),
  'Corporativo': (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </>
  ),
  'Conferencia': (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </>
  ),
  'Lanzamiento de Producto': (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </>
  ),
  'Inauguración': (
    <>
      <circle cx="6" cy="6" r="3"/>
      <circle cx="18" cy="18" r="3"/>
      <path d="M20 4L4 20"/>
      <path d="M7.5 9l3 3"/>
      <path d="M14 14.5l3 3"/>
    </>
  ),
  'Empresarial': (
    <>
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </>
  ),
  'Reunión': (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </>
  ),
  'Otro': (
    <>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </>
  ),
}

export default function EventoTipoIcon({ tipo, size = 18 }) {
  const meta  = TIPO_META[tipo] ?? TIPO_META['Otro']
  const color = meta.color

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size * 2, height: size * 2,
      borderRadius: '10px',
      background: color + '18',
      flexShrink: 0,
    }}>
      <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icons[tipo] ?? icons['Otro']}
      </svg>
    </span>
  )
}
