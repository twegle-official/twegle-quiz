import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from './adminApi'

// Holds who is currently logged into the admin panel, shared across the whole app
const AuthContext = createContext(null)

// Wraps the whole admin panel so every page can check who's logged in and log
// in/out. Keeps the admin's session (token + role) in state and in
// localStorage so a page refresh doesn't log them out.
export function AuthProvider({ children }) {
  // The logged-in admin's session — loaded from localStorage on first render
  // so a page refresh keeps the admin logged in
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('adminSession')
    return raw ? JSON.parse(raw) : null
  })

  // Called from the login page — checks the email/password with the backend,
  // then saves the returned session so the admin is logged in
  async function login(email, password) {
    const data = await apiLogin(email, password)
    localStorage.setItem('adminSession', JSON.stringify(data))
    setSession(data)
  }

  // Logs the admin out by clearing the saved session
  function logout() {
    localStorage.removeItem('adminSession')
    setSession(null)
  }

  // Checks whether the logged-in admin has one of the given roles (e.g. 'superadmin', 'editor')
  function hasRole(...roles) {
    return !!session && roles.includes(session.admin.role)
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook used throughout the admin panel to read the current session and call login/logout/hasRole
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
