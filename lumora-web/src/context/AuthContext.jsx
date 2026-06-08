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

  const updateProfile = async (name) => {
    await api.patch('/api/auth/profile', { name })
    setUser(prev => {
      const next = { ...prev, name }
      localStorage.setItem('lumora_user', JSON.stringify(next))
      return next
    })
  }

  const updateEmail = async (newEmail, password) => {
    await api.patch('/api/auth/email', { newEmail, password })
    setUser(prev => {
      const next = { ...prev, email: newEmail }
      localStorage.setItem('lumora_user', JSON.stringify(next))
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
      localStorage.setItem('lumora_user', JSON.stringify(next))
      return next
    })
    return res.url
  }

  const logout = () => {
    localStorage.removeItem('lumora_token')
    localStorage.removeItem('lumora_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updatePlan, updateProfile, updateEmail, updatePassword, updatePhoto, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
