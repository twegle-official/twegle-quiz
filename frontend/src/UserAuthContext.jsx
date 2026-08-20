import { createContext, useContext, useEffect, useState } from 'react'
import { signupUser, loginUser, fetchCurrentUser } from './userApi'
import { syncStatsOnLogin } from './utils/statsSync'
import { clearLocalStats } from './utils/badges'
import { clearLocalStreaks } from './utils/dailyQuiz'
import { clearDailyActivity } from './utils/weeklyRecap'
import { getStoredReferralCode, clearStoredReferralCode } from './utils/referral'

// Separate, parallel context from admin/AuthContext.jsx — different name,
// different localStorage key (`userSession` vs `adminSession`), wraps only
// the public site. Logging in here is entirely optional: every existing
// anonymous/localStorage-based feature (daily streak, badges, game
// leaderboard nicknames) keeps working exactly as before whether or not a
// visitor ever creates an account — this context is purely additive.
const UserAuthContext = createContext(null)

// Wraps the public site and makes the logged-in user's session (or null, for
// a guest) available to every page via useUserAuth() below.
export function UserAuthProvider({ children }) {
  // The current session — starts from whatever was saved in localStorage
  // last time, so a returning visitor stays logged in across page loads.
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

    // A one-time sync on load isn't enough on its own — this provider wraps
    // the whole app and doesn't remount on client-side navigation, so a
    // visitor who stays on one tab (switching between the Quizzes/Puzzles
    // tabs, or between pages) never re-syncs after that first load, even if
    // another device (or tab) changed something server-side in the
    // meantime. Found directly: revealed a puzzle on mobile, the desktop
    // tab (already loaded before that happened) never picked it up without
    // a full reload.
    //
    // First fix was re-syncing on visibilitychange — but that only fires
    // when the tab itself is hidden/shown (switching browser tabs, apps, or
    // minimizing). Reported directly as still not working: switching
    // in-app between the Games and Quizzes homepage tabs never hides the
    // page at all, so visibilitychange never fires there, even though it's
    // exactly the moment a visitor is most likely to check. A full reload
    // "worked" only because a reload always re-syncs on mount regardless.
    // Closed that gap with a plain interval poll instead — re-syncs every
    // 20s while a session exists, independent of any visibility or
    // navigation event, so switching between in-app tabs (or just leaving
    // the tab open) converges on its own within a few seconds either way.
    function handleVisibility() {
      if (document.visibilityState === 'visible') syncStatsOnLogin(session.token)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    const intervalId = setInterval(() => syncStatsOnLogin(session.token), 20000)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token])

  // Creates a new account, logs it in, and returns the recovery code to show
  // the visitor once (see Signup.jsx).
  async function signup(username, password, displayName) {
    // Consumed on this one attempt regardless of outcome — see
    // utils/referral.js. An invalid/unknown code is silently ignored by the
    // backend (never blocks signup), so there's no reason to keep retrying it.
    const referralCode = getStoredReferralCode()
    const data = await signupUser(username, password, displayName, referralCode)
    clearStoredReferralCode()
    localStorage.setItem('userSession', JSON.stringify({ token: data.token, user: data.user }))
    setSession({ token: data.token, user: data.user })
    syncStatsOnLogin(data.token)
    return data.recoveryCode
  }

  // Logs an existing account in.
  async function login(username, password) {
    const data = await loginUser(username, password)
    localStorage.setItem('userSession', JSON.stringify(data))
    setSession(data)
    syncStatsOnLogin(data.token)
  }

  // Logs the visitor out on this device. Also wipes this browser's local
  // badge/streak progress — without this, it kept looking like the
  // just-logged-out account to every localStorage-driven read (Badges.jsx,
  // Account.jsx, "already attempted" tile marks), and could even get
  // merged into a completely different account that logged in next on the
  // same device (see statsSync.js's merge-on-login). Dispatches the same
  // event Home.jsx already listens for so anything still mounted picks up
  // the reset immediately rather than waiting for a full page reload.
  function logout() {
    localStorage.removeItem('userSession')
    clearLocalStats()
    clearLocalStreaks()
    clearDailyActivity()
    setSession(null)
    window.dispatchEvent(new CustomEvent('twegle-stats-synced'))
  }

  // Replaces the cached session (e.g. after a profile change) and saves it.
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

// Hook pages call to read the current session and the login/signup/logout functions above.
export function useUserAuth() {
  const ctx = useContext(UserAuthContext)
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider')
  return ctx
}
