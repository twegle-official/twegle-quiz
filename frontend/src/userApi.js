// All the API calls for a logged-in visitor's own account (signup, login,
// password reset, profile, and syncing their stats). See UserAuthContext.jsx
// for where these get used.
// Mirrors admin/adminApi.js's request() helper (Bearer-token support, JSON
// in/out, thrown Error on failure) — cleaner for auth calls than the ad hoc
// fetch style the rest of api.js uses for anonymous, unauthenticated traffic.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Shared helper that every function below calls — sends the request, adds
// the auth token if given, and throws an Error if the server says it failed.
async function request(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

// Creates a new account and returns a login token + a one-time recovery code.
// referralCode is optional — the inviting friend's own personal code, if
// this signup arrived via someone's invite link (see utils/referral.js).
export const signupUser = (username, password, displayName, referralCode) =>
  request('/users/signup', { method: 'POST', body: { username, password, displayName, referralCode } })

// Logs an existing user in and returns a login token.
export const loginUser = (username, password) =>
  request('/users/login', { method: 'POST', body: { username, password } })

// Resets a forgotten password using the recovery code shown at signup.
export const resetUserPassword = (username, recoveryCode, newPassword) =>
  request('/users/reset-password', { method: 'POST', body: { username, recoveryCode, newPassword } })

// Fetches the logged-in user's own profile.
export const fetchCurrentUser = (token) => request('/users/me', { token })

// Changes the display name shown on the account.
export const updateDisplayName = (token, displayName) =>
  request('/users/me', { token, method: 'PATCH', body: { displayName } })

// Changes the account's avatar.
export const updateAvatar = (token, avatar) =>
  request('/users/me', { token, method: 'PATCH', body: { avatar } })

// Sets/clears the public-profile handle and whether the profile is visible.
export const updatePublicProfile = (token, { handle, isProfilePublic }) =>
  request('/users/me', { token, method: 'PATCH', body: { handle, isProfilePublic } })

// Generates a fresh recovery code (invalidates the old one).
export const regenerateRecoveryCode = (token) =>
  request('/users/me/regenerate-recovery-code', { token, method: 'POST' })

// Fetches the account's saved streak/badge/points stats from the server.
export const fetchStats = (token) => request('/users/me/stats', { token })

// Saves this device's local stats up to the account, merging with the server's copy.
export const pushStats = (token, stats) =>
  request('/users/me/stats', { token, method: 'PUT', body: { stats } })
