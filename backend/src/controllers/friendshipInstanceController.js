import crypto from 'node:crypto'
import mongoose from 'mongoose'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import FriendshipInstance from '../models/FriendshipInstance.js'
import FriendshipAttempt from '../models/FriendshipAttempt.js'
import { LIMITS } from '../utils/validators.js'

// Makes a random short code to use in a shareable friendship quiz link.
function generateCode() {
  return crypto.randomBytes(6).toString('base64url')
}

// Keeps making codes until it finds one that isn't already used.
async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await FriendshipInstance.findOne({ code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique code')
}

// answers/guesses must be one whole number per question, each a valid index
// into that question's options array — this is what stands in for actual
// user-submitted data here, so it's validated defensively before saving.
// Checks that the submitted answers match up correctly with the quiz's questions.
function validateAnswerIndices(answers, questions) {
  if (!Array.isArray(answers) || answers.length !== questions.length) return false
  return answers.every(
    (answer, i) => Number.isInteger(answer) && answer >= 0 && answer < questions[i].options.length
  )
}

// Builds the full result data shown after a friend's guesses are scored.
function buildAttemptResult({ attempt, instance, quiz }) {
  return {
    attemptId: attempt._id,
    instanceCode: instance.code,
    subjectName: instance.subjectName,
    quizTitle: quiz.title,
    quizEmoji: quiz.emoji,
    gradient: quiz.gradient,
    guesserName: attempt.guesserName,
    score: attempt.score,
    total: quiz.questions.length,
    results: quiz.questions.map((q, i) => ({
      text: q.text,
      options: q.options,
      correctIndex: instance.answers[i],
      guessIndex: attempt.guesses[i],
      correct: instance.answers[i] === attempt.guesses[i],
    })),
  }
}

// --- Public-facing (no auth) ---

// Handles someone creating a friendship quiz about themselves — saves their answers, returns a shareable code.
export async function createInstance(req, res) {
  const { subjectName, answers } = req.body

  const quiz = await FriendshipQuiz.findOne({ slug: req.params.slug, status: 'published' })
  if (!quiz) return res.status(404).json({ error: 'Friendship quiz not found' })

  if (typeof subjectName !== 'string' || !subjectName.trim()) {
    return res.status(400).json({ error: 'Your name is required' })
  }
  if (subjectName.length > LIMITS.MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer` })
  }
  if (!validateAnswerIndices(answers, quiz.questions)) {
    return res.status(400).json({ error: 'Answers do not match this quiz\'s questions' })
  }

  const code = await generateUniqueCode()
  await FriendshipInstance.create({
    friendshipQuiz: quiz._id,
    code,
    subjectName: subjectName.trim(),
    answers,
  })

  res.status(201).json({ code })
}

// Handles a friend opening the link to play — sends the questions but hides the real answers.
export async function getInstanceForPlay(req, res) {
  const instance = await FriendshipInstance.findOne({ code: req.params.code })
  if (!instance) return res.status(404).json({ error: 'Link not found' })

  const quiz = await FriendshipQuiz.findById(instance.friendshipQuiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  // Deliberately does NOT include instance.answers — a friend must guess
  // blind, that's the whole mechanic.
  res.json({
    subjectName: instance.subjectName,
    quizTitle: quiz.title,
    quizEmoji: quiz.emoji,
    gradient: quiz.gradient,
    questions: quiz.questions.map((q) => ({ text: q.text, options: q.options })),
  })
}

// Handles a friend submitting their guesses — scores them against the real answers and saves the attempt.
export async function submitAttempt(req, res) {
  const { guesserName, guesses, anonymousId } = req.body

  const instance = await FriendshipInstance.findOne({ code: req.params.code })
  if (!instance) return res.status(404).json({ error: 'Link not found' })

  const quiz = await FriendshipQuiz.findById(instance.friendshipQuiz)
  if (!quiz) return res.status(404).json({ error: 'Link not found' })

  if (typeof guesserName !== 'string' || !guesserName.trim()) {
    return res.status(400).json({ error: 'Your name is required' })
  }
  if (guesserName.length > LIMITS.MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer` })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }
  if (!validateAnswerIndices(guesses, quiz.questions)) {
    return res.status(400).json({ error: 'Guesses do not match this quiz\'s questions' })
  }

  const score = guesses.filter((guess, i) => guess === instance.answers[i]).length

  const attempt = await FriendshipAttempt.create({
    instance: instance._id,
    friendshipQuiz: quiz._id,
    guesserName: guesserName.trim(),
    guesses,
    score,
    anonymousId,
  })

  res.status(201).json(buildAttemptResult({ attempt, instance, quiz }))
}

// Handles loading one friend's past attempt/result by its id, e.g. for a results page.
export async function getAttempt(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) { // makes sure the id looks like a real database id before searching
    return res.status(404).json({ error: 'Result not found' })
  }
  const attempt = await FriendshipAttempt.findById(req.params.id)
  if (!attempt) return res.status(404).json({ error: 'Result not found' })

  const instance = await FriendshipInstance.findById(attempt.instance)
  const quiz = instance && (await FriendshipQuiz.findById(instance.friendshipQuiz))
  if (!instance || !quiz) return res.status(404).json({ error: 'Result not found' })

  res.json(buildAttemptResult({ attempt, instance, quiz }))
}
