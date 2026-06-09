import { useState, useEffect, useCallback } from 'react'
import { pipelineApi } from '../api/pipelineApi'

export const DEFAULT_STAGES = [
  { id: 'nuevo',      label: 'Nuevo',             color: '#64748b' },
  { id: 'contactado', label: 'Contactado',         color: '#38bdf8' },
  { id: 'cotizacion', label: 'Cotización enviada', color: '#fb923c' },
  { id: 'negociando', label: 'Negociando',         color: '#a78bfa' },
  { id: 'confirmado', label: 'Confirmado',         color: '#34d399' },
]

export function useStages() {
  const [stages, setStages] = useState(DEFAULT_STAGES)

  useEffect(() => {
    pipelineApi.getStages()
      .then(data => { if (Array.isArray(data) && data.length > 0) setStages(data) })
      .catch(() => {})
  }, [])

  const saveStages = useCallback(async (next) => {
    setStages(next)
    try { await pipelineApi.saveStages(next) } catch {}
  }, [])

  return [stages, saveStages]
}
