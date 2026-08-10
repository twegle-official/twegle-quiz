const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Letters/numbers/underscore only, 3-20 chars — deliberately excludes `@`,
// `+`, spaces, and dashes, so it naturally rejects someone pasting an email
// or a formatted phone number in out of habit (end-user accounts collect no
// email/phone at all — see EndUser.js).
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

// Fixed preset avatars for end-user accounts — deliberately emoji, not
// image uploads, so no file storage is ever needed for this.
// First 14 are the original set; the next 7 are a "cute" batch and the
// final 7 a "gamer" batch, added 2026-08-10 on direct request. Must match
// frontend/src/pages/Account.jsx's AVATAR_OPTIONS exactly.
export const AVATAR_OPTIONS = [
  '🦄', '🐱', '🐼', '🦊', '🐸', '🌟', '🔥', '😎', '🐶', '🐰', '🦁', '🐨', '🎉', '🌈',
  '🐹', '🐧', '🐢', '🦋', '🐥', '🐻', '🦉',
  '🎮', '🕹️', '👾', '🤖', '⚡', '🎯', '🎧',
]

export const LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_QUESTIONS: 30,
  MAX_OPTIONS_PER_QUESTION: 8,
  MAX_RESULTS: 20,
  MAX_FRIENDSHIP_QUESTIONS: 20,
  MAX_FRIENDSHIP_OPTIONS: 6,
  MAX_FEEDBACK_MESSAGE_LENGTH: 2000,
  MAX_DISPLAY_NAME_LENGTH: 30,
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email)
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= LIMITS.MIN_PASSWORD_LENGTH
}

export function isValidUsername(username) {
  return typeof username === 'string' && USERNAME_RE.test(username)
}

export function isValidDisplayName(displayName) {
  return (
    typeof displayName === 'string' &&
    displayName.trim().length > 0 &&
    displayName.length <= LIMITS.MAX_DISPLAY_NAME_LENGTH
  )
}

export function isValidAvatar(avatar) {
  return AVATAR_OPTIONS.includes(avatar)
}

// Used for the optional scheduled-publishing field. Returns:
// - `undefined` if the field wasn't sent at all (leave whatever's already stored alone)
// - `null` if explicitly cleared (empty string/null — publish immediately)
// - a `Date` if a valid date/time was sent
// - `'INVALID'` (a sentinel string, never a real value) if the input can't be parsed
export function parsePublishAt(value) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'INVALID'
  return date
}

// Returns an error message string if the quiz payload is invalid, or null if it's fine.
export function validateQuizPayload({ title, questions, results, type }) {
  if (title && title.length > LIMITS.MAX_TITLE_LENGTH) {
    return `Title must be ${LIMITS.MAX_TITLE_LENGTH} characters or fewer`
  }
  if (questions?.length > LIMITS.MAX_QUESTIONS) {
    return `A quiz can have at most ${LIMITS.MAX_QUESTIONS} questions`
  }
  if (questions?.some((q) => q.options?.length > LIMITS.MAX_OPTIONS_PER_QUESTION)) {
    return `A question can have at most ${LIMITS.MAX_OPTIONS_PER_QUESTION} answer options`
  }
  if (results?.length > LIMITS.MAX_RESULTS) {
    return `A quiz can have at most ${LIMITS.MAX_RESULTS} results`
  }
  // Trivia quizzes pick a result by score range instead of by tallying
  // option->result-key votes, so every result needs a numeric range and at
  // least one question needs a correct answer for scoring to mean anything.
  if (type === 'trivia') {
    if (results?.some((r) => typeof r.minScore !== 'number' || typeof r.maxScore !== 'number')) {
      return 'Every result needs a numeric min and max score for a trivia quiz'
    }
    if (questions?.length && !questions.some((q) => q.options?.some((o) => o.result === 'correct'))) {
      return 'At least one question needs an answer marked correct'
    }
  }
  return null
}

// Returns an error message string if the friendship quiz payload is invalid, or null if it's fine.
export function validateFriendshipQuizPayload({ title, questions }) {
  if (title && title.length > LIMITS.MAX_TITLE_LENGTH) {
    return `Title must be ${LIMITS.MAX_TITLE_LENGTH} characters or fewer`
  }
  if (questions?.length > LIMITS.MAX_FRIENDSHIP_QUESTIONS) {
    return `A friendship quiz can have at most ${LIMITS.MAX_FRIENDSHIP_QUESTIONS} questions`
  }
  if (questions?.some((q) => !q.options || q.options.length < 2)) {
    return 'Every question needs at least 2 answer options'
  }
  if (questions?.some((q) => q.options.length > LIMITS.MAX_FRIENDSHIP_OPTIONS)) {
    return `A question can have at most ${LIMITS.MAX_FRIENDSHIP_OPTIONS} answer options`
  }
  return null
}
