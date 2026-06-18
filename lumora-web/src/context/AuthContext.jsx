import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Migrate old lumora_ keys on first load
    const oldToken = localStorage.getItem('lumora_token')
    if (oldToken) {
      localStorage.setItem('elixe_token', oldToken)
      const oldUser = localStorage.getItem('lumora_user')
      if (oldUser) localStorage.setItem('elixe_user', oldUser)
      localStorage.removeItem('lumora_token')
      localStorage.removeItem('lumora_user')
    }

    const token    = localStorage.getItem('elixe_token')
    const userData = localStorage.getItem('elixe_user')
    if (token && userData) {
      try { setUser(JSON.parse(userData)) } catch {}
      // Refresh plan from server to fix stale/invalid cached plan values
      api.get('/api/auth/me').then(res => {
        if (res?.plan !== undefined) {
          setUser(prev => {
            if (!prev) return prev
            const next = { ...prev, plan: res.plan ?? 'free', role: res.role ?? prev.role ?? 'admin', trialStartedAt: res.trialStartedAt ?? prev.trialStartedAt ?? null }
            localStorage.setItem('elixe_user', JSON.stringify(next))
            return next
          })
        }
      }).catch(() => {})
    }
    setIsLoading(false)
  }, [])

  const saveUser = (res) => {
    const u = { userId: res.userId, orgId: res.orgId, name: res.name, email: res.email, plan: res.plan ?? 'free', role: res.role ?? 'admin', trialStartedAt: res.trialStartedAt ?? null }
    localStorage.setItem('elixe_token', res.token)
    localStorage.setItem('elixe_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    return saveUser(res)
  }

  const register = async (orgName, name, email, password) => {
    const res = await api.post('/api/auth/register', { orgName, name, email, password })
    return saveUser(res)
  }

  const updatePlan = async (plan) => {
    await api.patch('/api/auth/plan', { plan })
    setUser(prev => {
      const next = { ...prev, plan }
      localStorage.setItem('elixe_user', JSON.stringify(next))
      return next
    })
  }

  const updateProfile = async (name) => {
    await api.patch('/api/auth/profile', { name })
    setUser(prev => {
      const next = { ...prev, name }
      localStorage.setItem('elixe_user', JSON.stringify(next))
      return next
    })
  }

  const updateEmail = async (newEmail, password) => {
    await api.patch('/api/auth/email', { newEmail, password })
    setUser(prev => {
      const next = { ...prev, email: newEmail }
      localStorage.setItem('elixe_user', JSON.stringify(next))
      return next
    })
  }

  const updatePassword = async (oldPassword, newPassword) => {
    await api.patch('/api/auth/password', { oldPassword, newPassword })
  }

  const updatePhoto = async (photoData) => {
    const res = await api.patch('/api/auth/photo', { photoData })
    setUser(prev => {
      const next = { ...prev, photo: res.url }
      localStorage.setItem('elixe_user', JSON.stringify(next))
      return next
    })
    return res.url
  }

  const logout = () => {
    localStorage.removeItem('elixe_token')
    localStorage.removeItem('elixe_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updatePlan, updateProfile, updateEmail, updatePassword, updatePhoto, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
