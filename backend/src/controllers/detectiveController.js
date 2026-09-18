import DetectiveCase, { DETECTIVE_DIFFICULTIES } from '../models/DetectiveCase.js'
import DetectiveSolve from '../models/DetectiveSolve.js'
import { parsePublishAt } from '../utils/validators.js'
import { logActivity } from '../utils/activityLog.js'
import { parsePagination, paginationMeta } from '../utils/pagination.js'
import { isValidPreviewToken } from '../utils/previewToken.js'

// Same reasoning as quizController.js's slugify — a pure-Hindi (or any
// non-Latin-script) title reduces to an empty string, which would collide
// with every other empty slug since slug has a unique index.
function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || `case-${Date.now().toString(36)}`
}

// Checks the shape of a case submission well enough to catch a broken
// admin form before it saves — not exhaustive per-field validation, same
// depth every other content type's controller stops at.
function validateCasePayload({ title, intro, suspects, clues, deductionQuestions, solution }) {
  if (typeof title !== 'string' || !title.trim()) return 'Title is required'
  if (typeof intro !== 'string' || !intro.trim()) return 'The case introduction/story is required'
  if (!Array.isArray(suspects) || suspects.length < 2) return 'At least 2 suspects are required'
  for (const s of suspects) {
    if (!s.key?.trim() || !s.name?.trim()) return 'Every suspect needs a key and a name'
  }
  const suspectKeys = new Set(suspects.map((s) => s.key.trim()))
  if (suspectKeys.size !== suspects.length) return 'Suspect keys must be unique within a case'
  if (!Array.isArray(clues) || clues.length < 3) return 'At least 3 clues are required'
  for (const c of clues) {
    if (!c.key?.trim() || !c.title?.trim() || !c.description?.trim()) {
      return 'Every clue needs a key, a title, and a description'
    }
  }
  const clueKeys = new Set(clues.map((c) => c.key.trim()))
  if (clueKeys.size !== clues.length) return 'Clue keys must be unique within a case'
  for (const c of clues) {
    for (const dep of c.unlocksAfter || []) {
      if (!clueKeys.has(dep)) return `Clue "${c.key}" depends on an unknown clue key "${dep}"`
    }
  }
  if (!Array.isArray(deductionQuestions) || deductionQuestions.length < 1) {
    return 'At least 1 deduction question is required'
  }
  for (const q of deductionQuestions) {
    if (!q.question?.trim() || !Array.isArray(q.options) || q.options.length < 2) {
      return 'Every deduction question needs text and at least 2 options'
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return 'Every deduction question needs a valid correct option'
    }
  }
  if (!solution?.correctSuspectKey?.trim() || !solution?.explanation?.trim()) {
    return 'A solution (correct suspect + explanation) is required'
  }
  if (!suspectKeys.has(solution.correctSuspectKey.trim())) {
    return 'The solution\'s correct suspect must match one of the case\'s own suspect keys'
  }
  for (const key of solution.provingClueKeys || []) {
    if (!clueKeys.has(key)) return `The solution references an unknown clue key "${key}"`
  }
  return null
}

// Fields safe to send to a visitor before they've solved the case — never
// the solution, never a deduction question's correctIndex.
const PUBLIC_CASE_FIELDS =
  'title slug description intro difficulty estimatedMinutes emoji gradient language status suspects clues hints publishAt createdAt'

function stripDeductionAnswers(caseDoc) {
  return {
    ...caseDoc,
    deductionQuestions: (caseDoc.deductionQuestions || []).map((q) => ({
      question: q.question,
      options: q.options,
    })),
  }
}

// --- Admin-facing (requires auth) ---

export async function listDetectiveCasesAdmin(req, res) {
  const { search, difficulty, language, status } = req.query
  const filter = {}
  if (search && typeof search === 'string' && search.trim()) {
    filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }
  if (DETECTIVE_DIFFICULTIES.includes(difficulty)) filter.difficulty = difficulty
  if (language === 'hi' || language === 'en') filter.language = language
  if (status === 'draft' || status === 'published') filter.status = status

  const { page, limit, skip } = parsePagination(req.query)
  const [cases, total] = await Promise.all([
    DetectiveCase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DetectiveCase.countDocuments(filter),
  ])
  res.json({ cases, pagination: paginationMeta(page, limit, total) })
}

export async function getDetectiveCaseAdmin(req, res) {
  const detectiveCase = await DetectiveCase.findById(req.params.id)
  if (!detectiveCase) return res.status(404).json({ error: 'Case not found' })
  res.json({ case: detectiveCase })
}

export async function createDetectiveCase(req, res) {
  const body = req.body
  const validationError = validateCasePayload(body)
  if (validationError) return res.status(400).json({ error: validationError })
  const parsedPublishAt = parsePublishAt(body.publishAt)
  if (parsedPublishAt === 'INVALID') return res.status(400).json({ error: 'Publish date is not valid' })

  const slug = typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(body.title)
  const existing = await DetectiveCase.findOne({ slug })
  if (existing) return res.status(409).json({ error: 'A case with a matching slug already exists' })

  const detectiveCase = await DetectiveCase.create({
    title: body.title,
    slug,
    description: body.description,
    intro: body.intro,
    difficulty: DETECTIVE_DIFFICULTIES.includes(body.difficulty) ? body.difficulty : 'rookie',
    estimatedMinutes: body.estimatedMinutes,
    emoji: body.emoji,
    gradient: body.gradient,
    language: body.language === 'hi' ? 'hi' : 'en',
    status: body.status,
    publishAt: parsedPublishAt || null,
    suspects: body.suspects,
    clues: body.clues,
    deductionQuestions: body.deductionQuestions,
    hints: body.hints || [],
    solution: body.solution,
    createdBy: req.admin.id,
  })

  await logActivity({
    admin: req.admin,
    action: 'create',
    resourceType: 'detectiveCase',
    resourceId: detectiveCase._id,
    resourceLabel: detectiveCase.title,
  })

  res.status(201).json({ case: detectiveCase })
}

export async function updateDetectiveCase(req, res) {
  const body = req.body
  const validationError = validateCasePayload(body)
  if (validationError) return res.status(400).json({ error: validationError })
  const parsedPublishAt = parsePublishAt(body.publishAt)
  if (parsedPublishAt === 'INVALID') return res.status(400).json({ error: 'Publish date is not valid' })

  const detectiveCase = await DetectiveCase.findById(req.params.id)
  if (!detectiveCase) return res.status(404).json({ error: 'Case not found' })

  detectiveCase.title = body.title
  detectiveCase.description = body.description
  detectiveCase.intro = body.intro
  if (DETECTIVE_DIFFICULTIES.includes(body.difficulty)) detectiveCase.difficulty = body.difficulty
  detectiveCase.estimatedMinutes = body.estimatedMinutes
  detectiveCase.emoji = body.emoji
  detectiveCase.gradient = body.gradient
  detectiveCase.language = body.language === 'hi' ? 'hi' : 'en'
  detectiveCase.status = body.status
  detectiveCase.publishAt = parsedPublishAt
  detectiveCase.suspects = body.suspects
  detectiveCase.clues = body.clues
  detectiveCase.deductionQuestions = body.deductionQuestions
  detectiveCase.hints = body.hints || []
  detectiveCase.solution = body.solution

  await detectiveCase.save()

  await logActivity({
    admin: req.admin,
    action: 'update',
    resourceType: 'detectiveCase',
    resourceId: detectiveCase._id,
    resourceLabel: detectiveCase.title,
  })

  res.json({ case: detectiveCase })
}

export async function deleteDetectiveCase(req, res) {
  const detectiveCase = await DetectiveCase.findByIdAndDelete(req.params.id)
  if (detectiveCase) {
    await logActivity({
      admin: req.admin,
      action: 'delete',
      resourceType: 'detectiveCase',
      resourceId: detectiveCase._id,
      resourceLabel: detectiveCase.title,
    })
  }
  res.status(204).send()
}

// --- Public-facing (no auth, published only) ---

export async function listPublishedDetectiveCases(req, res) {
  const filter = {
    status: 'published',
    $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
  }
  if (req.query.language === 'hi' || req.query.language === 'en') filter.language = req.query.language
  if (DETECTIVE_DIFFICULTIES.includes(req.query.difficulty)) filter.difficulty = req.query.difficulty

  const cases = await DetectiveCase.find(filter).select(PUBLIC_CASE_FIELDS).sort({ createdAt: -1 })
  // Deduction question text/options are fine to list (a player needs to see
  // what they'll be asked isn't shown until Start Investigation anyway) —
  // no stripping needed here since deductionQuestions isn't in
  // PUBLIC_CASE_FIELDS's projection for the list view at all; kept out
  // entirely to keep the list payload small, fetched via the single-case
  // response instead.
  res.json({ cases })
}

export async function getPublishedDetectiveCaseBySlug(req, res) {
  const detectiveCase = await DetectiveCase.findOne({ slug: req.params.slug }).select(`${PUBLIC_CASE_FIELDS} deductionQuestions`)
  if (!detectiveCase) return res.status(404).json({ error: 'Case not found' })
  const isLive = detectiveCase.status === 'published' && (!detectiveCase.publishAt || detectiveCase.publishAt <= new Date())
  if (!isLive && !isValidPreviewToken(req.query.preview, 'detectiveCase', detectiveCase._id)) {
    return res.status(404).json({ error: 'Case not found' })
  }
  res.json({ case: stripDeductionAnswers(detectiveCase.toObject()) })
}

// Checks a player's final accusation + deduction answers against the real
// solution, server-side — the one part of the investigation that's
// actually verified rather than trusted from the client (see
// DetectiveCase.js's comment on why nothing else needs to be). Stateless:
// takes the player's claimed suspect/answers/clue count and returns
// whether they were right plus the full reveal, exactly like Puzzle's
// reveal-on-demand just gates it behind a real check instead of a client
// flag, since here the "right answer" genuinely isn't public yet.
export async function solveDetectiveCase(req, res) {
  const detectiveCase = await DetectiveCase.findOne({ slug: req.params.slug, status: 'published' })
  if (!detectiveCase) return res.status(404).json({ error: 'Case not found' })

  const { chosenSuspectKey, deductionAnswers, cluesFoundCount, hintsUsed } = req.body
  if (typeof chosenSuspectKey !== 'string' || !Array.isArray(deductionAnswers)) {
    return res.status(400).json({ error: 'A chosen suspect and deduction answers are required' })
  }

  const correctSuspect = chosenSuspectKey === detectiveCase.solution.correctSuspectKey
  const deductionResults = detectiveCase.deductionQuestions.map((q, i) => ({
    correct: deductionAnswers[i] === q.correctIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }))
  const deductionsCorrectCount = deductionResults.filter((r) => r.correct).length

  const totalClues = detectiveCase.clues.length
  const cluesFound = Math.max(0, Math.min(Number(cluesFoundCount) || 0, totalClues))
  const hints = Math.max(0, Number(hintsUsed) || 0)

  // Simple, generous scoring — a child should get a good score for
  // carefully solving the mystery, not just for being fast (per the
  // feature's own spec, no time component at all rather than risk
  // punishing a careful reader).
  const suspectPoints = correctSuspect ? 500 : 0
  const deductionPoints = deductionsCorrectCount * 100
  const cluePoints = totalClues > 0 ? Math.round((cluesFound / totalClues) * 200) : 0
  const hintPenalty = Math.min(hints * 30, 150)
  const score = Math.max(0, suspectPoints + deductionPoints + cluePoints - hintPenalty)

  // req.user is set by middleware/userAuth.js's optionalUserAuth — present
  // only when the solver was logged in. Only their best score per case is
  // kept (see DetectiveSolve.js), so replaying a solved case doesn't grow
  // the collection or bump a worse score over a better one. A guest solve
  // is never recorded — same "accounts-only ranking" call the weekly game
  // leaderboard already made, and there's no nickname field here to
  // attribute a guest row to anyway.
  if (req.user) {
    const existing = await DetectiveSolve.findOne({ detectiveCase: detectiveCase._id, endUser: req.user.id })
    if (!existing || score > existing.score) {
      await DetectiveSolve.findOneAndUpdate(
        { detectiveCase: detectiveCase._id, endUser: req.user.id },
        { score, cluesFound, totalClues, correctSuspect, deductionsCorrectCount, totalDeductions: detectiveCase.deductionQuestions.length },
        { upsert: true }
      )
    }
  }

  res.json({
    correctSuspect,
    deductionResults,
    solution: {
      correctSuspectKey: detectiveCase.solution.correctSuspectKey,
      explanation: detectiveCase.solution.explanation,
      provingClueKeys: detectiveCase.solution.provingClueKeys,
    },
    score,
    cluesFound,
    totalClues,
    deductionsCorrectCount,
    totalDeductions: detectiveCase.deductionQuestions.length,
    hintsUsed: hints,
  })
}

// Top 10 best scores for one case, best-first — called when a solved case's
// reveal screen loads its leaderboard. Works for any case, including one
// created five minutes ago, since it queries by the case's own id rather
// than a hardcoded per-case config (see DetectiveSolve.js's own comment).
export async function getDetectiveCaseLeaderboard(req, res) {
  const detectiveCase = await DetectiveCase.findOne({ slug: req.params.slug, status: 'published' }).select('_id')
  if (!detectiveCase) return res.status(404).json({ error: 'Case not found' })

  const entries = await DetectiveSolve.find({ detectiveCase: detectiveCase._id })
    .sort({ score: -1 })
    .limit(10)
    .populate('endUser', 'displayName avatar')

  // A deleted/since-cleaned-up account leaves `endUser` unpopulated (`null`
  // after populate, even though the field itself was set) — same filter the
  // weekly game leaderboard already applies for the same reason.
  res.json({ entries: entries.filter((e) => e.endUser) })
}
