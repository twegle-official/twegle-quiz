import { createContext, useContext, useState } from 'react'
import { signupUser, loginUser } from './userApi'

// Separate, parallel context from admin/AuthContext.jsx — different name,
// different localStorage key (`userSession` vs `adminSession`), wraps only
// the public site. Logging in here is entirely optional: every existing
// anonymous/localStorage-based feature (daily streak, badges, game
// leaderboard nicknames) keeps working exactly as before whether or not a
// visitor ever creates an account — this context is purely additive.
const UserAuthContext = createContext(null)

export function UserAuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('userSession')
    return raw ? JSON.parse(raw) : null
  })

  async function signup(username, password, displayName) {
    const data = await signupUser(username, password, displayName)
    localStorage.setItem('userSession', JSON.stringify({ token: data.token, user: data.user }))
    setSession({ token: data.token, user: data.user })
    return data.recoveryCode
  }

  async function login(username, password) {
    const data = await loginUser(username, password)
    localStorage.setItem('userSession', JSON.stringify(data))
    setSession(data)
  }

  function logout() {
    localStorage.removeItem('userSession')
    setSession(null)
  }

  function updateSession(next) {
    localStorage.setItem('userSession', JSON.stringify(next))
    setSession(next)
  }

  return (
    <UserAuthContext.Provider value={{ session, signup, login, logout, updateSession }}>
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext)
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider')
  return ctx
}
