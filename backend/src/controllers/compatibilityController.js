import crypto from 'node:crypto'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import CompatibilitySession from '../models/CompatibilitySession.js'
import { LIMITS } from '../utils/validators.js'

// The "Compatibility / match tester" flow — reuses FriendshipQuiz's exact
// question/options content shape (mode: 'compatibility' templates), but
// unlike the original 'guess' mode (one subject answers for real, friends
// guess), here BOTH people answer the same questions for real, and a %
// match is computed by comparing their answers. Same hybrid pattern as
// every other two-person feature here: REST create/join, Mongo as the
// source of truth, no shared server state.

// Makes a random short code to use in a shareable session link.
function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

// Keeps making codes until it finds one that isn't already used.
async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await CompatibilitySession.findOne({ code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique code')
}

// Checks that a submitted name isn't empty and isn't too long.
function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) return 'Your name is required'
  if (name.length > LIMITS.MAX_NAME_LENGTH) {
    return `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer`
  }
  return null
}

// answers must be one whole number per question, each a valid index into
// that question's options array — same defensive shape-check every other
// two-person quiz feature here applies to submitted answers/guesses.
function validateAnswerIndices(answers, questions) {
  if (!Array.isArray(answers) || answers.length !== questions.length) return false
  return answers.every(
    (answer, i) => Number.isInteger(answer) && answer >= 0 && answer < questions[i].options.length
  )
}

// Turns a % match into a friend-appropriate verdict message — kept neutral
// by default (not romance-only framing) since the site's audience is
// 8-18; an admin can still write romance-flavored question content for a
// "couple quiz" template if they want that angle, this copy just doesn't
// assume it.
function verdictFor(percent) {
  if (percent >= 80) return 'Best friends vibes!'
  if (percent >= 60) return 'Great match!'
  if (percent >= 40) return 'Pretty compatible'
  if (percent >= 20) return "Total opposites, and that's okay!"
  return "Couldn't be more different!"
}

// Before person B has joined, withhold person A's actual answers (only
// their name) so person B can't be biased/copy them — same "don't leak
// before both sides are in" reasoning as quizCompareController.js's
// comparePayload. Question text/options ARE included even pre-join, since
// (unlike Quiz Compare, which sends a friend off to a separate full Quiz
// page) there's no separate page for a compatibility session — person B
// answers directly against this same payload.
// Builds what gets sent back to the browser for a compatibility session's page.
function sessionPayload(quiz, session) {
  const joined = Boolean(session.personBAnswers)
  const base = {
    code: session.code,
    quizSlug: quiz.slug,
    quizTitle: quiz.title,
    quizEmoji: quiz.emoji,
    gradient: quiz.gradient,
    personAName: session.personAName,
    questions: quiz.questions.map((q) => ({ text: q.text, options: q.options })),
    joined,
  }
  if (!joined) return base

  const matches = session.personAAnswers.filter((a, i) => a === session.personBAnswers[i]).length
  const percent = Math.round((matches / session.personAAnswers.length) * 100)

  return {
    ...base,
    personBName: session.personBName,
    percent,
    verdict: verdictFor(percent),
    breakdown: quiz.questions.map((q, i) => ({
      text: q.text,
      personAAnswer: q.options[session.personAAnswers[i]],
      personBAnswer: q.options[session.personBAnswers[i]],
      same: session.personAAnswers[i] === session.personBAnswers[i],
    })),
  }
}

// --- Public-facing (no auth) ---

// Handles person A answering a compatibility quiz for real — saves their
// answers, returns a shareable code for person B.
export async function createSession(req, res) {
  const { name, answers } = req.body

  const quiz = await FriendshipQuiz.findOne({ slug: req.params.slug, status: 'published' })
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })
  if (quiz.mode !== 'compatibility') {
    return res.status(400).json({ error: 'This quiz is not a compatibility quiz' })
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })
  if (!validateAnswerIndices(answers, quiz.questions)) {
    return res.status(400).json({ error: 'Answers do not match this quiz\'s questions' })
  }

  const code = await generateUniqueCode()
  await CompatibilitySession.create({
    friendshipQuiz: quiz._id,
    code,
    personAName: name.trim(),
    personAAnswers: answers,
  })

  res.status(201).json({ code })
}

// Handles opening a compatibility link — shows the questions, and full results once both people have answered.
export async function getSession(req, res) {
  const session = await CompatibilitySession.findOne({ code: req.params.code })
  if (!session) return res.status(404).json({ error: 'Link not found' })

  const quiz = await FriendshipQuiz.findById(session.friendshipQuiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  res.json(sessionPayload(quiz, session))
}

// Handles person B joining via the link and submitting their own real answers.
export async function joinSession(req, res) {
  const { name, answers } = req.body

  const session = await CompatibilitySession.findOne({ code: req.params.code })
  if (!session) return res.status(404).json({ error: 'Link not found' })

  const quiz = await FriendshipQuiz.findById(session.friendshipQuiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  // Already joined — return the existing result instead of erroring, same
  // "double-submit is safe" reasoning joinCompareSession follows.
  if (session.personBAnswers) {
    return res.json(sessionPayload(quiz, session))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })
  if (!validateAnswerIndices(answers, quiz.questions)) {
    return res.status(400).json({ error: 'Answers do not match this quiz\'s questions' })
  }

  session.personBName = name.trim()
  session.personBAnswers = answers
  await session.save()

  res.json(sessionPayload(quiz, session))
}
