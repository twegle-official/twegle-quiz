import crypto from 'node:crypto'
import Quiz from '../models/Quiz.js'
import QuizCompare from '../models/QuizCompare.js'
import { LIMITS } from '../utils/validators.js'

// Makes a random short code to use in a shareable compare link.
function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

// Keeps making codes until it finds one that isn't already used.
async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await QuizCompare.findOne({ code })
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

// Builds the small chunk of data shown for one person's quiz result.
function personPayload(quiz, name, resultKey) {
  const result = quiz.results.find((r) => r.key === resultKey)
  return {
    name,
    resultKey,
    resultEmoji: result?.emoji || '',
    resultTitle: result?.title || '',
    resultDescription: result?.description || '',
  }
}

// Before a friend has played, we deliberately withhold person A's result —
// just their name — so seeing it can't bias the friend's own answers. Once
// the friend has played too, both full results are revealed together.
// Builds what gets sent back to the browser for a compare link's page.
function comparePayload(quiz, compare) {
  const joined = Boolean(compare.personBResultKey)
  const base = {
    code: compare.code,
    quizSlug: quiz.slug,
    quizTitle: quiz.title,
    quizEmoji: quiz.emoji,
    gradient: quiz.gradient,
    personAName: compare.personAName,
    joined,
  }
  if (!joined) return base
  return {
    ...base,
    personA: personPayload(quiz, compare.personAName, compare.personAResultKey),
    personB: personPayload(quiz, compare.personBName, compare.personBResultKey),
    match: compare.personAResultKey === compare.personBResultKey,
  }
}

// --- Public-facing (no auth) ---

// Handles person A starting a compare link — saves their name and result, then returns a shareable code.
export async function createCompareSession(req, res) {
  const { name, resultKey } = req.body

  const quiz = await Quiz.findOne({ slug: req.params.slug, status: 'published' })
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  if (!quiz.results.some((r) => r.key === resultKey)) {
    return res.status(400).json({ error: 'That result does not belong to this quiz' })
  }

  const code = await generateUniqueCode()
  await QuizCompare.create({
    quiz: quiz._id,
    code,
    personAName: name.trim(),
    personAResultKey: resultKey,
  })

  res.status(201).json({ code })
}

// Handles someone opening a compare link — shows the current status and results if both people have played.
export async function getCompareSession(req, res) {
  const compare = await QuizCompare.findOne({ code: req.params.code })
  if (!compare) return res.status(404).json({ error: 'Link not found' })

  const quiz = await Quiz.findById(compare.quiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  res.json(comparePayload(quiz, compare))
}

// Handles person B joining via the link and submitting their own result.
export async function joinCompareSession(req, res) {
  const { name, resultKey } = req.body

  const compare = await QuizCompare.findOne({ code: req.params.code })
  if (!compare) return res.status(404).json({ error: 'Link not found' })

  const quiz = await Quiz.findById(compare.quiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  // Already joined — return the existing comparison instead of erroring, so
  // a double-submit (retry, back button, or a third person opening an
  // already-used link) just shows the same result rather than failing.
  if (compare.personBResultKey) {
    return res.json(comparePayload(quiz, compare))
  }

  const nameError = validateName(name)
  if (nameError) return res.status(400).json({ error: nameError })

  if (!quiz.results.some((r) => r.key === resultKey)) {
    return res.status(400).json({ error: 'That result does not belong to this quiz' })
  }

  compare.personBName = name.trim()
  compare.personBResultKey = resultKey
  await compare.save()

  res.json(comparePayload(quiz, compare))
}
