import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token    = localStorage.getItem('lumora_token')
    const userData = localStorage.getItem('lumora_user')
    if (token && userData) {
      try { setUser(JSON.parse(userData)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const saveUser = (res) => {
    const u = { userId: res.userId, orgId: res.orgId, name: res.name, email: res.email, plan: res.plan ?? 'free' }
    localStorage.setItem('lumora_token', res.token)
    localStorage.setItem('lumora_user', JSON.stringify(u))
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
      localStorage.setItem('lumora_user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    localStorage.removeItem('lumora_token')
    localStorage.removeItem('lumora_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updatePlan, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
