const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email)
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= LIMITS.MIN_PASSWORD_LENGTH
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
