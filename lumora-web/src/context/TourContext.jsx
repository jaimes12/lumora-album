import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Guía interactiva paso a paso para cuentas nuevas de la vertical "viajes":
// bienvenida -> crear viaje -> ver pasajeros -> agregar pasajero -> fin.
export const TOUR_STEPS = [
  {
    id: 'welcome',
    kind: 'modal',
    title: '¡Bienvenido a Elixe!',
    text: 'Aquí organizas los viajes grupales de tu agencia: destinos, fechas, pasajeros, pagos y hasta tu propio marketplace público para conseguir clientes nuevos.',
    text2: 'Vamos a recorrer lo esencial en un par de minutos: crear un viaje y agregar un pasajero.',
    cta: 'Comenzar →',
  },
  {
    id: 'nuevo-viaje',
    kind: 'spotlight',
    route: '/app/viajes',
    target: 'nuevo-viaje-btn',
    title: 'Crea tu primer viaje',
    text: 'Aquí registras destino, fechas, precio por persona y cupos disponibles.',
    placement: 'bottom',
    cta: 'Abrir formulario',
  },
  {
    id: 'fill-form',
    kind: 'spotlight',
    target: 'crear-viaje-submit',
    title: 'Completa los datos',
    text: 'Llena el nombre, destino y fechas del viaje, y da clic en "Crear viaje" para continuar.',
    placement: 'top',
    waitForTrigger: 'trip-created',
  },
  {
    id: 'go-pasajeros',
    kind: 'spotlight',
    route: (p) => `/app/viajes/${p.tripId}`,
    target: 'tab-pasajeros',
    title: '¡Viaje creado! Ahora, pasajeros',
    text: 'Aquí llevas el control de quién va en el viaje y cuánto ha pagado cada quien.',
    placement: 'bottom',
    cta: 'Ver pasajeros',
  },
  {
    id: 'add-passenger',
    kind: 'spotlight',
    target: 'agregar-pasajero-btn',
    title: 'Agrega tu primer pasajero',
    text: 'Elige un cliente existente o crea uno nuevo al momento, desde el mismo formulario.',
    placement: 'bottom',
    cta: 'Agregar pasajero',
  },
  {
    id: 'passenger-form',
    kind: 'spotlight',
    target: 'guardar-pasajero-btn',
    title: 'Elige un cliente y guarda',
    text: 'Busca o crea el cliente, ajusta acompañantes si aplica, y da clic en "Agregar pasajero" para guardar.',
    placement: 'top',
    waitForTrigger: 'passenger-added',
  },
  {
    id: 'finish',
    kind: 'modal',
    title: '¡Ya sabes lo esencial!',
    text: 'Desde aquí también controlas gastos, pagos y calendario, y puedes publicar tus viajes gratis en el marketplace público para conseguir clientes nuevos.',
    cta: 'Empezar a usar Elixe →',
  },
]

const TourContext = createContext(null)

export function TourProvider({ children }) {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [payload, setPayload] = useState({})
  const [dismissed, setDismissed] = useState(false)

  const active = !dismissed && user?.industry === 'travel' && user?.onboardingCompleted === false
  const step = TOUR_STEPS[stepIndex] ?? null

  const goToStep = (idx, data) => {
    const merged = data ? { ...payload, ...data } : payload
    if (data) setPayload(merged)
    const nextStep = TOUR_STEPS[idx]
    if (!nextStep) {
      setDismissed(true)
      completeOnboarding()
      return
    }
    if (nextStep.route) {
      navigate(typeof nextStep.route === 'function' ? nextStep.route(merged) : nextStep.route)
    }
    setStepIndex(idx)
  }

  const advance = (data) => goToStep(stepIndex + 1, data)

  const notify = (eventId, data) => {
    const current = TOUR_STEPS[stepIndex]
    if (!current || current.waitForTrigger !== eventId) return
    goToStep(stepIndex + 1, data)
  }

  const skip = () => {
    setDismissed(true)
    completeOnboarding()
  }

  return (
    <TourContext.Provider value={{ active, step, stepIndex, total: TOUR_STEPS.length, advance, skip, notify }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
