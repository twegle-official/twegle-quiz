import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from './adminApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('adminSession')
    return raw ? JSON.parse(raw) : null
  })

  async function login(email, password) {
    const data = await apiLogin(email, password)
    localStorage.setItem('adminSession', JSON.stringify(data))
    setSession(data)
  }

  function logout() {
    localStorage.removeItem('adminSession')
    setSession(null)
  }

  function hasRole(...roles) {
    return !!session && roles.includes(session.admin.role)
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
