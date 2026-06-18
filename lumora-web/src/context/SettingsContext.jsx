import { createContext, useContext, useEffect, useState } from 'react'
import { fmt as fmtBase } from '../data/eventosData'

const CURRENCIES = ['MXN', 'USD', 'EUR']
export { CURRENCIES }

const SettingsContext = createContext(null)

export const t = {
  es: {
    dashboard:    'Dashboard',
    eventos:      'Eventos',
    clientes:     'Clientes',
    chats:        'Chats',
    contactos:    'Contactos',
    productos:    'Productos',
    proveedores:  'Proveedores',
    ventas:       'Ventas',
    notas:        'Notas',
    contratos:    'Contratos',
    calendario:   'Calendario',
    paquetes:      'Mi plan',
    configuracion: 'Configuración',
    trabajadores:  'Usuarios',
    admin:         'Administrador',
    logout:       'Cerrar sesión',
    darkMode:     'Modo oscuro',
    lightMode:    'Modo claro',
  },
  en: {
    dashboard:    'Dashboard',
    eventos:      'Events',
    clientes:     'Clients',
    chats:        'Chats',
    contactos:    'Contacts',
    productos:    'Products',
    proveedores:  'Vendors',
    ventas:       'Sales',
    notas:        'Notes',
    contratos:    'Contracts',
    calendario:   'Calendar',
    paquetes:      'My plan',
    configuracion: 'Settings',
    trabajadores:  'Users',
    admin:         'Administrator',
    logout:       'Log out',
    darkMode:     'Dark mode',
    lightMode:    'Light mode',
  },
}

export function SettingsProvider({ children }) {
  const [theme,    setTheme]    = useState(() => localStorage.getItem('theme')    || 'light')
  const [lang,     setLang]     = useState(() => localStorage.getItem('lang')     || 'es')
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'MXN')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('lang',     lang)     }, [lang])
  useEffect(() => { localStorage.setItem('currency', currency) }, [currency])

  const toggleTheme    = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const toggleLang     = () => setLang(l => l === 'es' ? 'en' : 'es')
  const cycleCurrency  = () => setCurrency(c => CURRENCIES[(CURRENCIES.indexOf(c) + 1) % CURRENCIES.length])
  const fmtMoney       = (n) => fmtBase(n, currency)

  return (
    <SettingsContext.Provider value={{ theme, lang, currency, setCurrency, toggleTheme, toggleLang, cycleCurrency, fmtMoney, i18n: t[lang] }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
