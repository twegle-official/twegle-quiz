import { createContext, useContext, useEffect, useState } from 'react'
import { signupUser, loginUser, fetchCurrentUser } from './userApi'
import { syncStatsOnLogin } from './utils/statsSync'

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

  // The cached session (including displayName/avatar) is only ever written
  // at login/signup or by an explicit updateSession() call on *this*
  // device — a profile change made on another device (or another browser
  // on the same device) never reaches an already-open session here. Found
  // directly: an account logged into both a phone and a desktop browser
  // showed two different avatars, since only the device the change was
  // made on had the new value. Refetching once on load keeps this device's
  // cache in sync with whatever the account actually looks like server-side
  // right now, without needing a fresh login.
  useEffect(() => {
    if (!session?.token) return
    fetchCurrentUser(session.token)
      .then((data) => updateSession({ token: session.token, user: data.user }))
      .catch(() => {})
    // Merges this device's local streak/badge progress with the account's
    // server-side copy (see statsSync.js) — runs on every load a session
    // exists, not just right after login, so two devices that were never
    // both open "at once" still converge the next time either one loads.
    syncStatsOnLogin(session.token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signup(username, password, displayName) {
    const data = await signupUser(username, password, displayName)
    localStorage.setItem('userSession', JSON.stringify({ token: data.token, user: data.user }))
    setSession({ token: data.token, user: data.user })
    syncStatsOnLogin(data.token)
    return data.recoveryCode
  }

  async function login(username, password) {
    const data = await loginUser(username, password)
    localStorage.setItem('userSession', JSON.stringify(data))
    setSession(data)
    syncStatsOnLogin(data.token)
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
