import { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)

export const t = {
  es: {
    dashboard:    'Dashboard',
    eventos:      'Eventos',
    clientes:     'Clientes',
    chats:        'Chats',
    proveedores:  'Proveedores',
    ventas:       'Ventas',
    contratos:    'Contratos',
    calendario:   'Calendario',
    admin:        'Administrador',
    logout:       'Cerrar sesión',
    darkMode:     'Modo oscuro',
    lightMode:    'Modo claro',
  },
  en: {
    dashboard:    'Dashboard',
    eventos:      'Events',
    clientes:     'Clients',
    chats:        'Chats',
    proveedores:  'Vendors',
    ventas:       'Sales',
    contratos:    'Contracts',
    calendario:   'Calendar',
    admin:        'Administrator',
    logout:       'Log out',
    darkMode:     'Dark mode',
    lightMode:    'Light mode',
  },
}

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [lang, setLang]   = useState(() => localStorage.getItem('lang')  || 'es')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const toggleLang  = () => setLang(l => l === 'es' ? 'en' : 'es')

  return (
    <SettingsContext.Provider value={{ theme, lang, toggleTheme, toggleLang, i18n: t[lang] }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
