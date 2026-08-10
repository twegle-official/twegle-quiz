const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function fetchQuizzes(language, category) {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  if (category) params.set('category', category)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/quizzes${qs}`)
  if (!res.ok) throw new Error('Failed to load quizzes')
  const data = await res.json()
  return data.quizzes
}

export async function fetchGameCounts() {
  const res = await fetch(`${API_URL}/games/counts`)
  if (!res.ok) throw new Error('Failed to load game counts')
  const data = await res.json()
  return data.counts
}

export async function recordGamePlay(slug, outcome) {
  await fetch(`${API_URL}/games/${slug}/plays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome, anonymousId: getAnonymousId() }),
  })
}

export async function fetchGameLeaderboard(slug) {
  const res = await fetch(`${API_URL}/games/${slug}/leaderboard`)
  if (!res.ok) return null
  const data = await res.json()
  return data.entries
}

export async function submitGameScore(slug, nickname, value) {
  return postJson(`/games/${slug}/leaderboard`, { nickname, value })
}

export async function fetchLevelLeaderboard() {
  const res = await fetch(`${API_URL}/leaderboard/levels`)
  if (!res.ok) return null
  const data = await res.json()
  return data.leaderboard
}

export async function searchContent(q, language) {
  const params = new URLSearchParams({ q })
  if (language) params.set('language', language)
  const res = await fetch(`${API_URL}/search?${params.toString()}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data.results
}

// previewToken is only ever passed by an admin's preview link (see
// AdminPreviewButton.jsx) — a guest visitor's normal fetch call omits it
// entirely, so this is purely additive to the existing published-only path.
export async function fetchQuizBySlug(slug, previewToken) {
  const qs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
  const res = await fetch(`${API_URL}/quizzes/${slug}${qs}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.quiz
}

export async function recordPlay(slug, resultKey) {
  await fetch(`${API_URL}/quizzes/${slug}/plays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultKey, anonymousId: getAnonymousId() }),
  })
}

export async function fetchPosts(category, language) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (language) params.set('language', language)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/posts${qs}`)
  if (!res.ok) throw new Error('Failed to load posts')
  const data = await res.json()
  return data.posts
}

export async function fetchStories(language, category) {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  if (category) params.set('category', category)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/stories${qs}`)
  if (!res.ok) throw new Error('Failed to load stories')
  const data = await res.json()
  return data.stories
}

export async function fetchStoryBySlug(slug, previewToken) {
  const qs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
  const res = await fetch(`${API_URL}/stories/${slug}${qs}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.story
}

export async function fetchPuzzles(language, difficulty) {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  if (difficulty) params.set('difficulty', difficulty)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/puzzles${qs}`)
  if (!res.ok) throw new Error('Failed to load puzzles')
  const data = await res.json()
  return data.puzzles
}

export async function fetchPuzzleById(id, previewToken) {
  const qs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
  const res = await fetch(`${API_URL}/puzzles/${id}${qs}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.puzzle
}

export async function fetchPostById(id, previewToken) {
  const qs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
  const res = await fetch(`${API_URL}/posts/${id}${qs}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.post
}

export async function fetchPostReactionsBatch(ids) {
  if (!ids || ids.length === 0) return {}
  const res = await fetch(`${API_URL}/posts/reactions?ids=${ids.join(',')}`)
  if (!res.ok) return {}
  const data = await res.json()
  return data.counts
}

export async function fetchPostReactions(id) {
  const res = await fetch(`${API_URL}/posts/${id}/reactions`)
  if (!res.ok) return null
  const data = await res.json()
  return data.counts
}

export async function setPostReaction(id, emoji) {
  const data = await postJson(`/posts/${id}/reactions`, { emoji, anonymousId: getAnonymousId() })
  return data.counts
}

export async function recordPostEngagement(id, action) {
  await fetch(`${API_URL}/posts/${id}/engagement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, anonymousId: getAnonymousId() }),
  })
}

// Same "view"/"share" tracking Posts have via recordPostEngagement, applied
// to the other four content types (quiz/friendshipQuiz/game/story) — see
// Engagement.js on the backend. contentId is that content's own Mongo _id
// for quiz/friendshipQuiz/story, or the game's slug for games.
export async function recordEngagement(contentType, contentId, action) {
  await fetch(`${API_URL}/engagement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType, contentId, action, anonymousId: getAnonymousId() }),
  })
}

async function postJson(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Something went wrong')
  return data
}

export async function submitFeedback(message, email) {
  return postJson('/feedback', { message, email: email || undefined })
}

// A "report" is just a feedback entry with content* fields set — see
// Feedback.js on the backend. contentId is the quiz's/post's Mongo _id.
export async function submitReport({ contentType, contentId, contentLabel, reason, message }) {
  return postJson('/feedback', {
    message: message?.trim() || `Reported as "${reason}" — no additional details given.`,
    contentType,
    contentId,
    contentLabel,
    reason,
  })
}

export async function fetchFriendshipQuizzes(language) {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/friendship/quizzes${qs}`)
  if (!res.ok) throw new Error('Failed to load friendship quizzes')
  const data = await res.json()
  return data.quizzes
}

export async function fetchFriendshipQuizBySlug(slug, previewToken) {
  const qs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
  const res = await fetch(`${API_URL}/friendship/quizzes/${slug}${qs}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.quiz
}

export async function createFriendshipInstance(slug, subjectName, answers) {
  const data = await postJson(`/friendship/quizzes/${slug}/instances`, { subjectName, answers })
  return data.code
}

export async function fetchFriendshipInstance(code) {
  const res = await fetch(`${API_URL}/friendship/instances/${code}`)
  if (!res.ok) return null
  return res.json()
}

export async function submitFriendshipAttempt(code, guesserName, guesses) {
  return postJson(`/friendship/instances/${code}/attempts`, {
    guesserName,
    guesses,
    anonymousId: getAnonymousId(),
  })
}

export async function fetchFriendshipAttempt(id) {
  const res = await fetch(`${API_URL}/friendship/attempts/${id}`)
  if (!res.ok) return null
  return res.json()
}

export function getFriendshipShareUrl(code) {
  return `${API_URL}/share/friendship/${code}`
}

export function getFriendshipResultShareUrl(attemptId) {
  return `${API_URL}/share/friendship-result/${attemptId}`
}

export async function createQuizCompare(slug, name, resultKey) {
  const data = await postJson(`/quizzes/${slug}/compare`, { name, resultKey })
  return data.code
}

export async function fetchQuizCompare(slug, code) {
  const res = await fetch(`${API_URL}/quizzes/${slug}/compare/${code}`)
  if (!res.ok) return null
  return res.json()
}

export async function joinQuizCompare(slug, code, name, resultKey) {
  return postJson(`/quizzes/${slug}/compare/${code}/join`, { name, resultKey })
}

export function getQuizCompareShareUrl(code) {
  return `${API_URL}/share/quiz-compare/${code}`
}

export async function createTicTacToeGame(name) {
  return postJson('/tictactoe', { name })
}

export async function fetchTicTacToeGame(code) {
  const res = await fetch(`${API_URL}/tictactoe/${code}`)
  if (!res.ok) return null
  return res.json()
}

export async function joinTicTacToeGame(code, name) {
  return postJson(`/tictactoe/${code}/join`, { name })
}

export function getTicTacToeShareUrl(code) {
  return `${API_URL}/share/tictactoe/${code}`
}

export async function createConnectFourGame(name) {
  return postJson('/connect-four', { name })
}

export async function fetchConnectFourGame(code) {
  const res = await fetch(`${API_URL}/connect-four/${code}`)
  if (!res.ok) return null
  return res.json()
}

export async function joinConnectFourGame(code, name) {
  return postJson(`/connect-four/${code}/join`, { name })
}

export function getConnectFourShareUrl(code) {
  return `${API_URL}/share/connect-four/${code}`
}

// URLs for the "Copy link" / WhatsApp share buttons. These point at the
// backend's /api/share/* routes rather than the React page directly — see
// shareController.js on the backend for why (link-preview crawlers don't run
// JavaScript, so a plain SPA URL never gets a proper preview card).
export function getQuizShareUrl(slug, resultKey) {
  return `${API_URL}/share/quiz/${slug}/${resultKey}`
}

export function getQuizIntroShareUrl(slug) {
  return `${API_URL}/share/quiz/${slug}`
}

export function getPostShareUrl(id) {
  return `${API_URL}/share/post/${id}`
}

export function getStoryShareUrl(slug) {
  return `${API_URL}/share/story/${slug}`
}

export function getPuzzleShareUrl(id) {
  return `${API_URL}/share/puzzle/${id}`
}

export function getGameShareUrl(slug) {
  return `${API_URL}/share/game/${slug}`
}

export function getFriendshipQuizIntroShareUrl(slug) {
  return `${API_URL}/share/friendship-quiz/${slug}`
}

export async function fetchZodiacSigns(language) {
  const params = new URLSearchParams()
  if (language) params.set('language', language)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/horoscope/signs${qs}`)
  if (!res.ok) throw new Error('Failed to load zodiac signs')
  const data = await res.json()
  return data.signs
}

export async function fetchHoroscope(sign, period, language) {
  const params = new URLSearchParams({ period })
  if (language) params.set('language', language)
  const res = await fetch(`${API_URL}/horoscope/${sign}?${params.toString()}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.horoscope
}

export function getHoroscopeShareUrl(sign, period, language) {
  const params = new URLSearchParams({ period })
  if (language) params.set('language', language)
  return `${API_URL}/share/horoscope/${sign}?${params.toString()}`
}

// A random id kept in this browser only — never sent alongside any personal
// information. See "Legal & Compliance" in DEVELOPMENT_PLAN.md.
function getAnonymousId() {
  let id = localStorage.getItem('anonymousId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('anonymousId', id)
  }
  return id
}
