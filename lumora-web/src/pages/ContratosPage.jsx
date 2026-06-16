import { useState, useRef, useEffect } from 'react'
import styles from './ContratosPage.module.css'
import { fmt } from '../data/eventosData'
import { contratosApi } from '../api/contratosApi'
import { clientesApi } from '../api/clientesApi'
import { eventosApi } from '../api/eventosApi'
import { orgSettingsApi } from '../api/orgSettingsApi'
import logoFull from '../assets/logo_elixe.jpeg'

/* ─── Contract templates ──────────────────────────────────── */
const TEMPLATES = [
  { id: 'boda',        emoji: '💍', nombre: 'Boda',                   color: '#f472b6',
    desc: 'Contrato completo para bodas. Incluye cláusulas de cancelación y pagos.',
    serviciosDefault: ['Coordinación general del evento','Decoración floral y ambientación','Servicio de banquetes y catering','Fotografía y video','DJ y sonido profesional','Iluminación especial'] },
  { id: 'xv',          emoji: '🌸', nombre: 'XV Años',                 color: '#a78bfa',
    desc: 'Contrato para quinceañeras. Incluye cláusulas de vals y chambelanes.',
    serviciosDefault: ['Coordinación integral','Decoración temática personalizada','Banquete completo','Fotografía y video profesional','DJ y pista de baile','Pastel de quinceañera','Coordinación de vals y chambelanes'] },
  { id: 'bautizo',     emoji: '💧', nombre: 'Bautizo',                 color: '#38bdf8',
    desc: 'Contrato para organización de celebración de bautizo.',
    serviciosDefault: ['Coordinación general','Decoración religiosa y floral','Servicio de banquete','Fotografía y video','Música ambiental'] },
  { id: 'comunion',    emoji: '🕊️', nombre: 'Primera Comunión',        color: '#34d399',
    desc: 'Contrato para celebración de Primera Comunión.',
    serviciosDefault: ['Coordinación general','Decoración religiosa','Banquete o convivio','Fotografía y video','Música ambiental','Pastel personalizado'] },
  { id: 'graduacion',  emoji: '🎓', nombre: 'Graduación',              color: '#fbbf24',
    desc: 'Contrato para eventos de graduación y celebración académica.',
    serviciosDefault: ['Coordinación del evento','Decoración con motivo académico','Banquete o catering','Fotografía y video','DJ y amenización','Diploma o recuerdo personalizado'] },
  { id: 'cumpleanos',  emoji: '🎂', nombre: 'Cumpleaños',              color: '#fb923c',
    desc: 'Contrato para organización de fiesta de cumpleaños.',
    serviciosDefault: ['Coordinación general','Decoración temática','Pastel personalizado','Fotografía y video','DJ o animación','Catering o servicio de alimentos'] },
  { id: 'babyshower',  emoji: '👶', nombre: 'Baby Shower',             color: '#93c5fd',
    desc: 'Contrato para organización de Baby Shower.',
    serviciosDefault: ['Coordinación del evento','Decoración temática','Mesa de dulces o candy bar','Fotografía','Catering o refrigerios','Actividades y juegos'] },
  { id: 'revelacion',  emoji: '🎀', nombre: 'Revelación de Sexo',      color: '#f9a8d4',
    desc: 'Contrato para organización de Gender Reveal.',
    serviciosDefault: ['Coordinación general','Decoración azul y rosa','Mesa de dulces temática','Fotografía y video','Catering','Confeti o elemento sorpresa'] },
  { id: 'aniversario', emoji: '❤️', nombre: 'Aniversario',             color: '#ef4444',
    desc: 'Contrato para celebración de aniversario.',
    serviciosDefault: ['Coordinación del evento','Decoración romántica','Cena o banquete especial','Fotografía y video','Música en vivo o DJ','Arreglos florales'] },
  { id: 'despedida',   emoji: '🥂', nombre: 'Despedida de Soltera',    color: '#c084fc',
    desc: 'Contrato para organización de despedida de soltera.',
    serviciosDefault: ['Coordinación general','Decoración temática','Actividades y dinámicas','Fotografía','Catering y bebidas'] },
  { id: 'corporativo', emoji: '🏢', nombre: 'Corporativo',             color: '#64748b',
    desc: 'Contrato para eventos empresariales con términos corporativos.',
    serviciosDefault: ['Logística y coordinación general','Montaje de escenario y audiovisual','Coffee break y catering','Registro de asistentes','Material impreso y señalética'] },
  { id: 'conferencia', emoji: '🎤', nombre: 'Conferencia',             color: '#2B6FD4',
    desc: 'Contrato para conferencias, seminarios y eventos académicos.',
    serviciosDefault: ['Coordinación y logística','Montaje de escenario y audiovisual','Registro de asistentes','Coffee break','Señalética y material'] },
  { id: 'lanzamiento', emoji: '🚀', nombre: 'Lanzamiento de Producto', color: '#06b6d4',
    desc: 'Contrato para lanzamientos de productos o servicios.',
    serviciosDefault: ['Producción del evento','Ambientación y branding','Equipo audiovisual','Catering o cóctel','Registro de asistentes','Fotografía y video'] },
  { id: 'inauguracion',emoji: '🎊', nombre: 'Inauguración',            color: '#10b981',
    desc: 'Contrato para eventos de inauguración de espacios o negocios.',
    serviciosDefault: ['Coordinación general','Decoración institucional','Catering o cóctel de bienvenida','Fotografía y video','Protocolo y logística'] },
  { id: 'empresarial', emoji: '💼', nombre: 'Empresarial',             color: '#475569',
    desc: 'Contrato para eventos empresariales en general.',
    serviciosDefault: ['Coordinación ejecutiva','Logística y montaje','Catering','Equipo audiovisual','Material impreso'] },
  { id: 'reunion',     emoji: '🤝', nombre: 'Reunión',                 color: '#94a3b8',
    desc: 'Contrato para organización de reuniones y juntas.',
    serviciosDefault: ['Coordinación del espacio','Coffee break','Material de trabajo','Equipo audiovisual'] },
  { id: 'otro',        emoji: '📋', nombre: 'Otro',                    color: '#6b7280',
    desc: 'Contrato general para cualquier tipo de evento.',
    serviciosDefault: ['Coordinación general del evento','Logística y montaje','Catering','Fotografía y video'] },
]

/* ─── Saved contracts (mock) ──────────────────────────────── */
const CONTRATOS_INIT = [
  { id: 'ct1', template: 'boda',       cliente: 'Fernanda García', evento: 'Boda García & Ruiz', fecha: '10 Ene 2026', estado: 'firmado',  total: '$85,000' },
  { id: 'ct2', template: 'corporativo',cliente: 'Carlos Mendoza',  evento: 'Corporativo Telmex', fecha: '15 Feb 2026', estado: 'enviado',  total: '$42,000' },
  { id: 'ct3', template: 'xv',         cliente: 'Ana López',        evento: 'XV Años Sofía',      fecha: '1 Mar 2026',  estado: 'borrador', total: '$67,500' },
]

const ESTADO_COLOR = {
  firmado:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  enviado:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  borrador: { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

/* ─── Contract renderer ───────────────────────────────────── */
function buildContract(template, form, org = {}) {
  const ciudad  = org.city        || 'Ciudad de México'
  const empresa = org.companyName || 'Elixe Events S.A. de C.V.'
  const rfc     = org.rfc         || 'LES210601AB3'
  const ev      = form.nombreEvento || '[NOMBRE DEL EVENTO]'
  const fecha   = form.fechaEvento  || '[FECHA]'
  const venue   = form.venue        || '[VENUE]'
  const inv     = form.invitados    || '[N]'
  const total   = form.total        || '[MONTO]'
  const anticipo= form.anticipo     || '[ANTICIPO]'
  const saldo   = form.liquidacion  || '[SALDO]'
  const pct     = form.pctAnticipo  || '50'
  const dias    = form.diasLiquidacion || '15'
  const letras  = form.totalLetras  || 'MONTO EN LETRAS'

  // Shared last 3 clauses (fuerza mayor, confidencialidad, jurisdicción)
  const clausulasFin = [
    { titulo: 'CASO FORTUITO O FUERZA MAYOR', texto: 'Ninguna de las partes será responsable por incumplimiento cuando sea consecuencia directa de caso fortuito o fuerza mayor, incluyendo desastres naturales, actos de autoridad o pandemias oficialmente declaradas. Las partes acordarán de buena fe una nueva fecha.' },
    { titulo: 'CONFIDENCIALIDAD Y DATOS PERSONALES', texto: `Las partes guardarán estricta confidencialidad sobre la información intercambiada. ${empresa} se compromete al tratamiento confidencial de los datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.` },
    { titulo: 'JURISDICCIÓN Y LEGISLACIÓN APLICABLE', texto: `Para la interpretación y cumplimiento del presente contrato, las partes se someten a los Tribunales competentes de ${ciudad}, renunciando al fuero que pudiera corresponderles por razón de su domicilio.` },
  ]

  // Helper: social/celebration event
  const makeSocial = (tipoNombre) => [
    { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la prestación de servicios profesionales de organización y coordinación del evento "${ev}" (${tipoNombre}), a celebrarse el ${fecha} en "${venue}", con una asistencia estimada de ${inv} personas.` },
    { titulo: 'SERVICIOS INCLUIDOS', lista: form.servicios },
    { titulo: 'MONTO Y FORMA DE PAGO', texto: `El monto total asciende a ${total} (${letras}) M.N., cubiertos de la siguiente manera:\n\n• Anticipo del ${pct}% a la firma: ${anticipo}\n• Liquidación a más tardar ${dias} días naturales antes del evento: ${saldo}\n\nMediante transferencia, depósito o cheque a nombre de ${empresa}.` },
    { titulo: 'OBLIGACIONES DE EL PRESTADOR', lista: ['Asignar un coordinador responsable del evento','Coordinar a los proveedores contratados antes y durante el evento','Realizar reuniones de seguimiento previas al evento','Estar presente desde el montaje hasta la conclusión','Entregar cronograma detallado con anticipación'] },
    { titulo: 'OBLIGACIONES DE EL CONTRATANTE', lista: ['Proporcionar información necesaria en los tiempos acordados','Realizar pagos conforme al calendario establecido','Notificar cambios con al menos 15 días de anticipación','Designar un representante autorizado para toma de decisiones'] },
    { titulo: 'CANCELACIONES Y PENALIZACIONES', texto: `En caso de cancelación por parte de EL CONTRATANTE:\n\n• Más de 60 días de anticipación: retención del 20% del anticipo\n• Entre 30 y 60 días: retención del 50% del anticipo\n• Menos de 30 días: pérdida total del anticipo\n\nCancelación por causas imputables a EL PRESTADOR: devolución del 100% más 10% de penalización.` },
    ...clausulasFin,
  ]

  // Helper: corporate/business event
  const makeCorp = (tipoNombre) => [
    { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato regula la prestación de servicios de organización para "${ev}" (${tipoNombre}), a realizarse el ${fecha} en "${venue}", con capacidad para ${inv} asistentes.` },
    { titulo: 'SERVICIOS CONTRATADOS', lista: form.servicios },
    { titulo: 'INVERSIÓN Y CONDICIONES DE PAGO', texto: `La inversión total es de ${total} M.N.:\n\n• 40% de anticipo a la firma: ${anticipo}\n• 60% restante según calendario acordado\n\nFactura emitida por ${empresa}, RFC ${rfc}.` },
    { titulo: 'COORDINACIÓN Y COMUNICACIÓN', lista: ['Project Manager exclusivo asignado al evento','Reportes de avance según frecuencia acordada','Disponibilidad los días del evento y previos','Reunión de briefing 72 horas antes del evento'] },
    { titulo: 'USO DE IMAGEN', texto: `${empresa} podrá utilizar imágenes del evento con fines de portafolio, salvo indicación escrita en contrario antes de la firma.` },
    { titulo: 'CANCELACIONES', texto: `Más de 60 días: 25% del total. Entre 30-60 días: 50%. Menos de 30 días: 75%. Por causa gubernamental o fuerza mayor acreditada: reprogramación sin costo.` },
    ...clausulasFin,
  ]

  // Helper: religious event
  const makeReligioso = (tipoNombre) => [
    { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la organización y coordinación del evento religioso y social denominado "${ev}" (${tipoNombre}), a celebrarse el ${fecha} en "${venue}", con una asistencia estimada de ${inv} personas.` },
    { titulo: 'SERVICIOS INCLUIDOS', lista: form.servicios },
    { titulo: 'MONTO Y FORMA DE PAGO', texto: `El monto total es de ${total} (${letras}) M.N.:\n\n• Anticipo del ${pct}% a la firma: ${anticipo}\n• Liquidación ${dias} días antes del evento: ${saldo}` },
    { titulo: 'COORDINACIÓN CON PARROQUIA O IGLESIA', texto: 'EL PRESTADOR coordinará la logística entre el lugar de la ceremonia religiosa y el salón de celebración, velando por el cumplimiento de los horarios establecidos y el traslado de los invitados de ser necesario.' },
    { titulo: 'OBLIGACIONES DE EL PRESTADOR', lista: ['Coordinación de proveedores y logística general','Supervisión desde el montaje hasta el cierre del evento','Coordinación con el celebrante religioso en caso necesario','Cumplimiento del programa y cronograma acordados'] },
    { titulo: 'CANCELACIONES', texto: `Más de 60 días: retención del 20%. Entre 30-60 días: 50%. Menos de 30 días: pérdida del anticipo. Causas de fuerza mayor: reprogramación sin costo.` },
    ...clausulasFin,
  ]

  switch (template.id) {
    case 'boda':
      return [
        { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la prestación de servicios de organización y coordinación del evento de boda a celebrarse el ${fecha}, en "${venue}", con asistencia estimada de ${inv} personas.` },
        { titulo: 'SERVICIOS INCLUIDOS', lista: form.servicios },
        { titulo: 'MONTO Y FORMA DE PAGO', texto: `El monto total asciende a ${total} (${letras}) M.N.:\n\n• Anticipo del ${pct}% a la firma: ${anticipo}\n• Liquidación a más tardar ${dias} días naturales antes del evento: ${saldo}\n\nMediante transferencia bancaria, depósito o cheque a nombre de ${empresa}.` },
        { titulo: 'OBLIGACIONES DE EL PRESTADOR', lista: ['Asignar coordinador de bodas certificado','Coordinar a todos los proveedores','Mínimo tres reuniones de seguimiento previas','Presencia desde montaje hasta conclusión del evento','Cronograma detallado con 30 días de anticipación','Gestión de permisos y logística'] },
        { titulo: 'OBLIGACIONES DE EL CONTRATANTE', lista: ['Proporcionar información en los tiempos acordados','Pagos conforme al calendario','Notificar cambios en lista de invitados con 30 días de anticipación','Designar representante autorizado'] },
        { titulo: 'CANCELACIONES Y PENALIZACIONES', texto: `• Más de 90 días: retención del 20% del anticipo\n• Entre 60-90 días: 50%\n• Entre 30-60 días: 75%\n• Menos de 30 días: pérdida total del anticipo\n\nCancelación por causas del PRESTADOR: devolución del 100% + 10% de penalización.` },
        ...clausulasFin,
      ]

    case 'xv':
      return [
        { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la organización integral de la Quinceañera de ${form.nombreFestejada || '[NOMBRE]'}, a celebrarse el ${fecha} en "${venue}", con asistencia de ${inv} invitados.` },
        { titulo: 'PAQUETE DE SERVICIOS', lista: form.servicios },
        { titulo: 'COSTO TOTAL Y PAGOS', texto: `El costo total es de ${total} M.N.:\n\n• Anticipo (${pct}%) a la firma: ${anticipo}\n• Segundo pago (40%) a 60 días del evento\n• Liquidación a 15 días del evento: ${saldo}` },
        { titulo: 'COORDINACIÓN DE VALS Y CHAMBELANES', texto: `El servicio incluye hasta ${form.chambelanes || '14'} chambelanes. Se realizarán dos ensayos previos. La música del vals deberá seleccionarse con 45 días de anticipación.` },
        { titulo: 'PERSONALIZACIÓN', lista: ['Reunión de diseño y temática sin costo','Moodboard y propuesta visual','Consultoría en selección de vestido','Coordinación con la iglesia o lugar de ceremonia','Mesa de dulces personalizada'] },
        { titulo: 'CANCELACIONES', texto: `• Más de 180 días: reembolso del 80%\n• Entre 90-180 días: 50%\n• Entre 30-90 días: 25%\n• Menos de 30 días: sin reembolso\n\nCambios de fecha sujetos a disponibilidad, sin costo con 60 días de anticipación.` },
        { titulo: 'FOTOGRAFÍA Y VIDEO', texto: 'Incluye sesión previa y cobertura completa del evento. Entrega digital en máximo 45 días posteriores.' },
        ...clausulasFin,
      ]

    case 'corporativo': return makeCorp('Evento Corporativo')
    case 'conferencia': return makeCorp('Conferencia')
    case 'lanzamiento': return makeCorp('Lanzamiento de Producto')
    case 'inauguracion': return makeCorp('Inauguración')
    case 'empresarial': return makeCorp('Evento Empresarial')
    case 'reunion': return makeCorp('Reunión')

    case 'bautizo': return makeReligioso('Bautizo')
    case 'comunion': return makeReligioso('Primera Comunión')

    case 'graduacion':
      return [
        { titulo: 'OBJETO DEL CONTRATO', texto: `El presente contrato tiene por objeto la organización del evento de Graduación "${ev}", a celebrarse el ${fecha} en "${venue}", con asistencia estimada de ${inv} personas.` },
        { titulo: 'SERVICIOS INCLUIDOS', lista: form.servicios },
        { titulo: 'MONTO Y FORMA DE PAGO', texto: `El monto total es de ${total} (${letras}) M.N.:\n\n• Anticipo del ${pct}% a la firma: ${anticipo}\n• Liquidación ${dias} días antes del evento: ${saldo}` },
        { titulo: 'COORDINACIÓN DEL EVENTO ACADÉMICO', texto: 'EL PRESTADOR coordinará el protocolo de entrega de diplomas o reconocimientos en coordinación con la institución académica correspondiente. Se respetarán los tiempos y el orden de la ceremonia establecido por la institución.' },
        { titulo: 'OBLIGACIONES DE LAS PARTES', lista: ['Proporcionar lista de graduandos con anticipación','Coordinar con la institución el protocolo oficial','Cumplir con los horarios del evento','Realizar los pagos conforme al calendario'] },
        { titulo: 'CANCELACIONES', texto: `Más de 60 días: 20%. Entre 30-60 días: 50%. Menos de 30 días: pérdida del anticipo.` },
        ...clausulasFin,
      ]

    case 'cumpleanos':   return makeSocial('Cumpleaños')
    case 'babyshower':   return makeSocial('Baby Shower')
    case 'revelacion':   return makeSocial('Revelación de Sexo')
    case 'aniversario':  return makeSocial('Aniversario')
    case 'despedida':    return makeSocial('Despedida de Soltera')
    case 'otro':         return makeSocial('Evento Especial')

    default: return makeSocial('Evento')
  }
}

/* ─── Contract preview component ─────────────────────────── */
function ContractPreview({ template, form, contratoRef, org = {}, clausasEdit = {} }) {
  const clausulasBase = buildContract(template, form, org)
  const clausulas = clausulasBase.map((c, i) => {
    if (clausasEdit[i] === undefined) return c
    if (c.texto !== undefined) return { ...c, texto: clausasEdit[i] }
    return { ...c, lista: clausasEdit[i].split('\n').filter(s => s.trim()) }
  })
  const hoy = new Date()
  const fechaFormato = hoy.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })
  const numContrato = `LM-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`

  return (
    <div className={styles.preview} ref={contratoRef}>
      {/* Letterhead */}
      <div className={styles.letterhead}>
        <div className={styles.letterheadLeft}>
          <img src={logoFull} alt="Elixe Events" className={styles.letterheadLogoImg} />
        </div>
        <div className={styles.letterheadRight}>
          <div className={styles.letterheadData}>RFC: {org.rfc || 'LES210601AB3'}</div>
          <div className={styles.letterheadData}>Tel: {org.phone || '+52 55 1234 5678'}</div>
          <div className={styles.letterheadData}>{org.email || 'contacto@lumora.mx'}</div>
        </div>
      </div>

      <div className={styles.letterheadLine} />

      {/* Title */}
      <div className={styles.contractTitleBlock}>
        <div className={styles.contractNum}>No. {numContrato}</div>
        <h1 className={styles.contractTitle}>
          CONTRATO DE PRESTACIÓN DE SERVICIOS
          {template.id === 'boda' && ' DE ORGANIZACIÓN DE BODA'}
          {template.id === 'corporativo' && ' PARA EVENTO CORPORATIVO'}
          {template.id === 'xv' && ' DE ORGANIZACIÓN DE QUINCEAÑERA'}
        </h1>
        <div className={styles.contractDate}>
          Celebrado en {form.ciudad || 'Ciudad de México'}, a los {fechaFormato}
        </div>
      </div>

      {/* Parties */}
      <div className={styles.parties}>
        <div className={styles.partiesTitle}>COMPARECIENTES</div>
        <div className={styles.partyBlock}>
          <span className={styles.partyLabel}>EL CONTRATANTE:</span>
          <span className={styles.partyValue}>
            {form.clienteNombre || '[NOMBRE DEL CLIENTE]'}{form.clienteRFC ? `, RFC: ${form.clienteRFC}` : ''}, con domicilio en {form.domicilioCliente || '[DOMICILIO]'}, a quien en lo sucesivo se le denominará <strong>"EL CONTRATANTE"</strong>.
          </span>
        </div>
        <div className={styles.partyBlock}>
          <span className={styles.partyLabel}>EL PRESTADOR:</span>
          <span className={styles.partyValue}>
            <strong>{(org.companyName || 'ELIXE EVENTS S.A. de C.V.').toUpperCase()}</strong>, RFC {org.rfc || 'LES210601AB3'}, con domicilio en {org.address || 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX'}, representada por el C. <strong>{org.directorName || 'Angel Jaimes'}</strong> en su carácter de Director General, a quien en lo sucesivo se le denominará <strong>"EL PRESTADOR"</strong>.
          </span>
        </div>
        <div className={styles.partiesDecl}>
          Ambas partes, reconociendo su plena capacidad jurídica, libre de coacción y vicios del consentimiento, convienen en celebrar el presente contrato al tenor de las siguientes:
        </div>
      </div>

      {/* Clauses */}
      <div className={styles.clauses}>
        <div className={styles.clausesTitle}>C L Á U S U L A S</div>
        {clausulas.map((c, i) => (
          <div key={i} className={styles.clause}>
            <div className={styles.clauseTitle}>
              CLÁUSULA {['PRIMERA','SEGUNDA','TERCERA','CUARTA','QUINTA','SEXTA','SÉPTIMA','OCTAVA','NOVENA','DÉCIMA'][i] || `${i+1}ª`}.— {c.titulo}
            </div>
            {c.texto && (
              <div className={styles.clauseText}>{c.texto}</div>
            )}
            {c.lista && (
              <ul className={styles.clauseList}>
                {c.lista.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {form.notas && (
        <div className={styles.notasBlock}>
          <div className={styles.clauseTitle}>CONDICIONES ESPECIALES</div>
          <div className={styles.clauseText}>{form.notas}</div>
        </div>
      )}

      {/* Signatures */}
      <div className={styles.signatures}>
        <div className={styles.signaturesTitle}>
          Leído el presente instrumento por las partes, lo firman de conformidad en la ciudad y fecha señalados al principio.
        </div>
        <div className={styles.sigRow}>
          <div className={styles.sigBlock}>
            <div className={styles.sigLine} />
            <div className={styles.sigName}>{form.clienteNombre || 'EL CONTRATANTE'}</div>
            <div className={styles.sigRole}>Contratante</div>
            {form.clienteRFC && <div className={styles.sigData}>RFC: {form.clienteRFC}</div>}
          </div>
          <div className={styles.sigBlock}>
            <div className={styles.sigLine} />
            <div className={styles.sigName}>{org.directorName || 'Angel Jaimes'}</div>
            <div className={styles.sigRole}>Director General</div>
            <div className={styles.sigData}>{org.companyName || 'Elixe Events S.A. de C.V.'}</div>
          </div>
        </div>
        <div className={styles.sigFooter}>
          Este documento tiene validez legal con las firmas autógrafas de ambas partes. Se firma en dos tantos originales quedando uno en poder de cada contratante.
        </div>
      </div>
    </div>
  )
}

const TIPO_TO_TEMPLATE_ID = {
  'Boda':                    'boda',
  'XV Años':                 'xv',
  'Bautizo':                 'bautizo',
  'Primera Comunión':        'comunion',
  'Graduación':              'graduacion',
  'Cumpleaños':              'cumpleanos',
  'Baby Shower':             'babyshower',
  'Revelación de Sexo':      'revelacion',
  'Aniversario':             'aniversario',
  'Despedida de Soltera':    'despedida',
  'Corporativo':             'corporativo',
  'Conferencia':             'conferencia',
  'Lanzamiento de Producto': 'lanzamiento',
  'Inauguración':            'inauguracion',
  'Empresarial':             'empresarial',
  'Reunión':                 'reunion',
  'Otro':                    'otro',
}

/* ─── Main page ───────────────────────────────────────────── */
export default function ContratosPage() {
  const [vista,       setVista]       = useState('lista')
  const [template,    setTemplate]    = useState(null)
  const [contratos,   setContratos]   = useState([])
  const [search,      setSearch]      = useState('')
  const [showExtras,  setShowExtras]  = useState(false)
  const [autoFilled,  setAutoFilled]  = useState(false)
  const [clausasEdit, setClausasEdit] = useState({})
  const [showClausas, setShowClausas] = useState(false)
  const contratoRef = useRef(null)

  const [clientesList,  setClientesList]  = useState([])
  const [eventosList,   setEventosList]   = useState([])
  const [orgSettings,   setOrgSettings]   = useState({})

  useEffect(() => {
    contratosApi.getAll().then(setContratos).catch(() => setContratos([]))
    clientesApi.getAll().then(setClientesList).catch(() => setClientesList([]))
    eventosApi.getAll().then(setEventosList).catch(() => setEventosList([]))
    orgSettingsApi.get().then(setOrgSettings).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    clienteId: '', clienteNombre: '', clienteRFC: '', domicilioCliente: '',
    eventoId: '', nombreEvento: '', fechaEvento: '', fechaFirma: '',
    venue: '', invitados: '', ciudad: 'Ciudad de México',
    nombreFestejada: '', chambelanes: '14',
    total: '', anticipo: '', liquidacion: '', pctAnticipo: '50',
    diasLiquidacion: '15', totalLetras: '',
    servicios: [], notas: '',
  })

  // Reset clause edits when template changes
  useEffect(() => { setClausasEdit({}); setShowClausas(false) }, [template?.id])

  // Auto-compute anticipo and liquidacion whenever total or % changes
  useEffect(() => {
    const totalNum = parseFloat((form.total || '').replace(/[^0-9.]/g, '')) || 0
    if (totalNum <= 0) return
    const pct = Math.max(0, Math.min(100, parseFloat(form.pctAnticipo) || 50))
    const anticipo   = Math.round(totalNum * pct / 100)
    const liquidacion = totalNum - anticipo
    setForm(f => ({
      ...f,
      anticipo:    `$${anticipo.toLocaleString('es-MX')}`,
      liquidacion: `$${liquidacion.toLocaleString('es-MX')}`,
    }))
  }, [form.total, form.pctAnticipo])

  const eventosFiltrados = form.clienteId
    ? eventosList.filter(e => e.clienteId === form.clienteId)
    : eventosList

  const handleClienteChange = (clienteId) => {
    const c = clientesList.find(x => x.id === clienteId)
    setForm(f => ({ ...f, clienteId, clienteNombre: c?.nombre || '', eventoId: '' }))
    setAutoFilled(false)
  }

  const handleEventoChange = (eventoId) => {
    if (!eventoId) {
      setForm(f => ({ ...f, eventoId: '', nombreEvento: '', fechaEvento: '', venue: '', invitados: '', total: '' }))
      setAutoFilled(false)
      return
    }
    const ev     = eventosList.find(e => e.id === eventoId)
    const tmplId = TIPO_TO_TEMPLATE_ID[ev?.tipo] || 'boda'
    const tmpl   = TEMPLATES.find(t => t.id === tmplId) || TEMPLATES[0]
    setTemplate(tmpl)

    const cliente = clientesList.find(c => c.id === ev?.clienteId)
    setForm(f => ({
      ...f,
      eventoId,
      nombreEvento:   ev?.nombre       || '',
      fechaEvento:    ev?.fecha        || '',
      venue:          ev?.venue        || '',
      invitados:      String(ev?.invitados || ''),
      total:          fmt(ev?.presupuestoTotal || 0),
      clienteId:      ev?.clienteId    || f.clienteId,
      clienteNombre:  cliente?.nombre  || f.clienteNombre,
      servicios:      tmpl.serviciosDefault,
      ...(tmplId === 'xv' ? { nombreFestejada: ev?.nombre || '' } : {}),
    }))
    setAutoFilled(true)
  }

  const selectTemplate = (t) => {
    setTemplate(t)
    setForm(f => ({ ...f, servicios: [...t.serviciosDefault] }))
  }

  const toggleServicio = (s) =>
    setForm(f => ({
      ...f,
      servicios: f.servicios.includes(s)
        ? f.servicios.filter(x => x !== s)
        : [...f.servicios, s],
    }))

  const addServicio = (s) => {
    if (s.trim() && !form.servicios.includes(s)) {
      setForm(f => ({ ...f, servicios: [...f.servicios, s] }))
    }
  }

  const printPDF = () => {
    const html = contratoRef.current?.innerHTML
    if (!html) return
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"/>
      <title>Contrato — ${form.clienteNombre || 'Elixe Events'}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Georgia', serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 20mm 18mm; line-height: 1.7; }
        .letterhead { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12pt; }
        .letterheadLeft { display:flex; align-items:center; }
        .letterheadLogoImg { height:38pt; width:auto; object-fit:contain; }
        .letterheadRight { text-align:right; }
        .letterheadData { font-family:sans-serif; font-size:9pt; color:#555; }
        .letterheadLine { border-top:2pt solid #7c6af7; margin-bottom:18pt; }
        .contractTitleBlock { text-align:center; margin-bottom:16pt; }
        .contractNum { font-family:sans-serif; font-size:8pt; color:#999; margin-bottom:4pt; }
        .contractTitle { font-size:13pt; font-weight:700; letter-spacing:1pt; color:#0d0c12; text-transform:uppercase; line-height:1.4; }
        .contractDate { font-size:10pt; color:#555; margin-top:6pt; }
        .parties { background:#f9f9fc; border:1pt solid #e0e0ef; border-radius:6pt; padding:12pt; margin-bottom:16pt; }
        .partiesTitle { font-family:sans-serif; font-size:8pt; font-weight:700; letter-spacing:2pt; text-transform:uppercase; color:#7c6af7; margin-bottom:10pt; }
        .partyBlock { margin-bottom:8pt; }
        .partyLabel { font-family:sans-serif; font-size:9pt; font-weight:700; color:#0d0c12; margin-right:6pt; }
        .partyValue { font-size:10pt; color:#333; }
        .partiesDecl { font-size:9pt; color:#555; font-style:italic; margin-top:10pt; }
        .clauses { margin-bottom:16pt; }
        .clausesTitle { font-family:sans-serif; font-size:9pt; font-weight:800; letter-spacing:3pt; text-transform:uppercase; color:#7c6af7; text-align:center; margin-bottom:14pt; padding-bottom:6pt; border-bottom:1pt solid #e0e0ef; }
        .clause { margin-bottom:14pt; }
        .clauseTitle { font-family:sans-serif; font-size:9pt; font-weight:700; color:#0d0c12; text-transform:uppercase; margin-bottom:5pt; }
        .clauseText { font-size:10pt; color:#333; text-align:justify; white-space:pre-line; }
        .clauseList { padding-left:16pt; font-size:10pt; color:#333; }
        .clauseList li { margin-bottom:3pt; }
        .notasBlock { background:#fffbf0; border:1pt solid #f0e0a0; border-radius:6pt; padding:10pt; margin-bottom:16pt; }
        .signatures { margin-top:28pt; }
        .signaturesTitle { font-size:9pt; color:#555; font-style:italic; text-align:center; margin-bottom:28pt; }
        .sigRow { display:flex; justify-content:space-around; gap:24pt; margin-bottom:16pt; }
        .sigBlock { flex:1; text-align:center; }
        .sigLine { border-top:1pt solid #333; margin-bottom:6pt; }
        .sigName { font-family:sans-serif; font-size:9pt; font-weight:700; }
        .sigRole { font-size:9pt; color:#555; }
        .sigData { font-size:8pt; color:#888; }
        .sigFooter { font-size:8pt; color:#aaa; text-align:center; }
        @media print { body { padding:12mm 15mm; } }
      </style>
    </head><body>${html}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 600)
  }

  const resetForm = () => {
    setForm({ clienteId:'', clienteNombre:'', clienteRFC:'', domicilioCliente:'', eventoId:'', nombreEvento:'', fechaEvento:'', fechaFirma:'', venue:'', invitados:'', ciudad:'Ciudad de México', nombreFestejada:'', chambelanes:'14', total:'', anticipo:'', liquidacion:'', pctAnticipo:'50', diasLiquidacion:'15', totalLetras:'', servicios:[], notas:'' })
    setAutoFilled(false)
    setShowExtras(false)
  }

  const guardarContrato = async () => {
    const totalNum = parseFloat((form.total || '0').replace(/[$,]/g, '')) || 0
    const nuevo = {
      id: `ct${Date.now()}`,
      template: template?.id || 'boda',
      cliente: form.clienteNombre || 'Sin cliente',
      evento:  form.nombreEvento  || 'Sin evento',
      fecha:   new Date().toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }),
      estado:  'borrador',
      total:   form.total || '$0',
    }
    // Persist to API if client selected
    if (form.clienteId) {
      contratosApi.create({
        clientId: form.clienteId,
        eventId: form.eventoId || null,
        template: template?.id || 'general',
        title: form.nombreEvento || `Contrato ${template?.nombre || ''}`,
        total: totalNum,
        notes: form.notas || null,
      }).then(saved => {
        setContratos(c => [{ ...nuevo, id: saved.id }, ...c.filter(x => x.id !== nuevo.id)])
      }).catch(() => {})
    }
    setContratos(c => [nuevo, ...c])
    setVista('lista')
    setTemplate(null)
    resetForm()
  }

  if (vista === 'nuevo') {
    return (
      <div className={styles.page}>
        <div className={styles.generatorHeader}>
          <button className={styles.backBtn} onClick={() => { setVista('lista'); setTemplate(null) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Contratos
          </button>
          <h1 className={styles.generatorTitle}>Nuevo contrato</h1>
          <div className={styles.generatorActions}>
            <button className={styles.btnSave} onClick={guardarContrato}>Guardar borrador</button>
            <button className={styles.btnPDF} onClick={printPDF} disabled={!template}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
              </svg>
              Descargar PDF
            </button>
          </div>
        </div>

        <div className={styles.generatorLayout}>
          {/* Config panel */}
          <div className={styles.configPanel}>

            {/* Step 1: Evento — acción principal */}
            <div className={`${styles.configSection} ${styles.configSectionHighlight}`}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>1</span>
                ¿Para qué evento?
              </div>
              <div className={styles.formStack}>
                <div className={styles.formField}>
                  <label>Filtrar por cliente</label>
                  <select value={form.clienteId} onChange={e => handleClienteChange(e.target.value)}>
                    <option value="">— Todos los clientes —</option>
                    {clientesList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Evento</label>
                  <select value={form.eventoId} onChange={e => handleEventoChange(e.target.value)}>
                    <option value="">— Seleccionar evento —</option>
                    {eventosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
              {autoFilled && (
                <div className={styles.autoFilledBanner}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Datos cargados automáticamente del evento
                </div>
              )}
              {!form.eventoId && (
                <p className={styles.stepHint}>Selecciona el evento y el contrato se llena solo</p>
              )}
            </div>

            {/* Step 2: Tipo — auto-detectado, editable */}
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>2</span>
                Tipo de contrato
                {autoFilled && template && (
                  <span className={styles.autoTag}>auto-detectado</span>
                )}
              </div>
              <div className={styles.templatePills}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.templatePill} ${template?.id === t.id ? styles.templatePillActive : ''}`}
                    onClick={() => selectTemplate(t)}
                    style={template?.id === t.id ? { borderColor: t.color, background: t.color + '18', color: t.color } : {}}
                  >
                    {t.emoji} {t.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Datos del evento + cliente */}
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>3</span>
                Datos del contrato
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Nombre del cliente</label>
                  <input placeholder="Nombre completo" value={form.clienteNombre}
                    onChange={e => setForm(f => ({ ...f, clienteNombre: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Fecha del evento</label>
                  <input placeholder="14 de junio de 2026" value={form.fechaEvento}
                    onChange={e => setForm(f => ({ ...f, fechaEvento: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Venue</label>
                  <input placeholder="Nombre del lugar" value={form.venue}
                    onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Invitados</label>
                  <input type="number" placeholder="200" value={form.invitados}
                    onChange={e => setForm(f => ({ ...f, invitados: e.target.value }))} />
                </div>
                {template?.id === 'xv' && (
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label>Nombre de la festejada</label>
                    <input placeholder="Nombre completo" value={form.nombreFestejada}
                      onChange={e => setForm(f => ({ ...f, nombreFestejada: e.target.value }))} />
                  </div>
                )}
              </div>
              <button className={styles.extraToggle} onClick={() => setShowExtras(s => !s)}>
                {showExtras ? '▲ Ocultar' : '▼ Datos adicionales'} (RFC, domicilio)
              </button>
              {showExtras && (
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label>RFC del cliente</label>
                    <input placeholder="XAXX010101000" value={form.clienteRFC}
                      onChange={e => setForm(f => ({ ...f, clienteRFC: e.target.value }))} />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label>Domicilio del cliente</label>
                    <input placeholder="Calle, colonia, ciudad" value={form.domicilioCliente}
                      onChange={e => setForm(f => ({ ...f, domicilioCliente: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Financiero con cálculo automático */}
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>4</span>
                Financiero
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Monto total</label>
                  <input placeholder="$85,000" value={form.total}
                    onChange={e => setForm(f => ({ ...f, total: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>% de anticipo</label>
                  <input type="number" placeholder="50" min="5" max="100" value={form.pctAnticipo}
                    onChange={e => setForm(f => ({ ...f, pctAnticipo: e.target.value }))} />
                </div>
              </div>
              {form.anticipo && (
                <div className={styles.anticoCalc}>
                  <div className={styles.anticoItem}>
                    <span className={styles.anticoLabel}>Anticipo ({form.pctAnticipo}%)</span>
                    <span className={styles.anticoValue}>{form.anticipo}</span>
                  </div>
                  <div className={styles.anticoSep} />
                  <div className={styles.anticoItem}>
                    <span className={styles.anticoLabel}>Liquidación</span>
                    <span className={styles.anticoValue}>{form.liquidacion}</span>
                  </div>
                </div>
              )}
              <div className={styles.formField}>
                <label>Total en letra (opcional)</label>
                <input placeholder="Ochenta y cinco mil pesos 00/100 M.N." value={form.totalLetras}
                  onChange={e => setForm(f => ({ ...f, totalLetras: e.target.value }))} />
              </div>
            </div>

            {/* Step 5: Servicios */}
            {template && (
              <div className={styles.configSection}>
                <div className={styles.configSectionTitle}>
                  <span className={styles.stepNum}>5</span>
                  Servicios incluidos
                </div>
                <div className={styles.serviciosList}>
                  {template.serviciosDefault.map(s => (
                    <label key={s} className={styles.servicioCheck}>
                      <input type="checkbox" checked={form.servicios.includes(s)} onChange={() => toggleServicio(s)} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.addServicio}>
                  <input
                    className={styles.addServicioInput}
                    placeholder="Agregar servicio personalizado..."
                    onKeyDown={e => { if (e.key === 'Enter') { addServicio(e.target.value); e.target.value = '' }}}
                  />
                  <span className={styles.addServicioHint}>↵ Enter para agregar</span>
                </div>
              </div>
            )}

            {/* Step 6: Notas */}
            <div className={styles.configSection}>
              <div className={styles.configSectionTitle}>
                <span className={styles.stepNum}>{template ? '6' : '5'}</span>
                Notas especiales (opcional)
              </div>
              <textarea
                className={styles.notasInput}
                placeholder="Acuerdos adicionales, condiciones especiales del venue..."
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Step 7: Editar cláusulas */}
            {template && (
              <div className={styles.configSection}>
                <button
                  className={styles.clausasToggleBtn}
                  onClick={() => setShowClausas(s => !s)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {showClausas ? 'Ocultar editor de cláusulas' : 'Editar cláusulas del contrato'}
                  {Object.keys(clausasEdit).length > 0 && (
                    <span className={styles.clausasEditedBadge}>{Object.keys(clausasEdit).length} editadas</span>
                  )}
                </button>
                {showClausas && (() => {
                  const clausulas = buildContract(template, form, orgSettings)
                  const ORDINALS = ['PRIMERA','SEGUNDA','TERCERA','CUARTA','QUINTA','SEXTA','SÉPTIMA','OCTAVA','NOVENA','DÉCIMA']
                  return (
                    <div className={styles.clausasEditor}>
                      <p className={styles.clausasEditorHint}>
                        Edita el texto de cada cláusula. Los cambios se reflejan al instante en la vista previa.
                      </p>
                      {clausulas.map((c, i) => (
                        <div key={i} className={styles.clausaEditItem}>
                          <div className={styles.clausaEditHeader}>
                            <span className={styles.clausaEditNum}>CLÁUSULA {ORDINALS[i] || `${i+1}ª`}</span>
                            <span className={styles.clausaEditTitulo}>{c.titulo}</span>
                            {clausasEdit[i] !== undefined && (
                              <button
                                className={styles.clausaResetBtn}
                                onClick={() => setClausasEdit(prev => { const n = { ...prev }; delete n[i]; return n })}
                                title="Restaurar texto original"
                              >↺ Restaurar</button>
                            )}
                          </div>
                          <textarea
                            className={styles.clausaEditArea}
                            rows={c.texto ? 6 : 4}
                            value={clausasEdit[i] ?? (c.texto || (c.lista || []).join('\n'))}
                            onChange={e => setClausasEdit(prev => ({ ...prev, [i]: e.target.value }))}
                          />
                        </div>
                      ))}
                      {Object.keys(clausasEdit).length > 0 && (
                        <button
                          className={styles.clausasResetAllBtn}
                          onClick={() => setClausasEdit({})}
                        >
                          ↺ Restaurar todo al original
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className={styles.previewPanel}>
            <div className={styles.previewToolbar}>
              <span className={styles.previewLabel}>Vista previa del contrato</span>
              <span className={styles.previewHint}>Edita las cláusulas en el panel izquierdo</span>
            </div>

            {!template ? (
              <div className={styles.previewEmpty}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <p>Selecciona un evento arriba<br/>para generar el contrato</p>
                <span className={styles.previewEmptyHint}>o elige el tipo de contrato manualmente</span>
              </div>
            ) : (
              <div className={styles.previewScroll}>
                <ContractPreview template={template} form={form} contratoRef={contratoRef} org={orgSettings} clausasEdit={clausasEdit} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Lista de contratos ── */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contratos</h1>
          <p className={styles.sub}>{contratos.length} contratos · {contratos.filter(c=>c.estado==='firmado').length} firmados</p>
        </div>
        <button className={styles.btnNew} onClick={() => setVista('nuevo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo contrato
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar por cliente, evento o tipo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total', val: contratos.length, color: 'var(--accent-2)' },
          { label: 'Firmados', val: contratos.filter(c=>c.estado==='firmado').length, color: '#34d399' },
          { label: 'Enviados', val: contratos.filter(c=>c.estado==='enviado').length,  color: '#fb923c' },
          { label: 'Borradores', val: contratos.filter(c=>c.estado==='borrador').length, color: '#64748b' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contratos.filter(ct => {
              const q = search.trim().toLowerCase()
              if (!q) return true
              const tmpl = TEMPLATES.find(t => t.id === ct.template)
              return (ct.cliente || '').toLowerCase().includes(q) ||
                (ct.evento || '').toLowerCase().includes(q) ||
                (tmpl?.nombre || '').toLowerCase().includes(q)
            }).map(ct => {
              const tmpl = TEMPLATES.find(t => t.id === ct.template)
              const est  = ESTADO_COLOR[ct.estado] || ESTADO_COLOR.borrador
              return (
                <tr key={ct.id} className={styles.row}>
                  <td>
                    <div className={styles.tipoCell}>
                      <span className={styles.tipoEmoji}>{tmpl?.emoji}</span>
                      <span>{tmpl?.nombre}</span>
                    </div>
                  </td>
                  <td className={styles.muted}>{ct.cliente}</td>
                  <td className={styles.muted}>{ct.evento}</td>
                  <td className={styles.muted}>{ct.fecha}</td>
                  <td className={styles.totalCell}>{ct.total}</td>
                  <td>
                    <span className={styles.estadoBadge} style={{ color: est.color, background: est.bg }}>
                      {ct.estado.charAt(0).toUpperCase() + ct.estado.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} title="Editar" onClick={() => setVista('nuevo')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={styles.rowBtnPDF} title="Descargar PDF">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
