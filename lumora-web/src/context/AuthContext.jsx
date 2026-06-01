import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('lumora_token')
    const userData = localStorage.getItem('lumora_user')
    if (token && userData) {
      try { setUser(JSON.parse(userData)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('lumora_token', res.token)
    localStorage.setItem('lumora_user', JSON.stringify({ userId: res.userId, orgId: res.orgId, name: res.name, email: res.email }))
    setUser({ userId: res.userId, orgId: res.orgId, name: res.name, email: res.email })
    return res
  }

  const register = async (orgName, name, email, password) => {
    const res = await api.post('/api/auth/register', { orgName, name, email, password })
    localStorage.setItem('lumora_token', res.token)
    localStorage.setItem('lumora_user', JSON.stringify({ userId: res.userId, orgId: res.orgId, name: res.name, email: res.email }))
    setUser({ userId: res.userId, orgId: res.orgId, name: res.name, email: res.email })
    return res
  }

  const logout = () => {
    localStorage.removeItem('lumora_token')
    localStorage.removeItem('lumora_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
