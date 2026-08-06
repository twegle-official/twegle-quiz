import mongoose from 'mongoose'
import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import FriendshipInstance from '../models/FriendshipInstance.js'
import FriendshipAttempt from '../models/FriendshipAttempt.js'
import QuizCompare from '../models/QuizCompare.js'
import TicTacToeGame from '../models/TicTacToeGame.js'
import Story from '../models/Story.js'
import Puzzle from '../models/Puzzle.js'
import { findZodiacSign } from '../data/zodiacSigns.js'
import { computeHoroscope } from '../utils/horoscope.js'

// These endpoints exist ONLY for link-preview crawlers (WhatsApp, Instagram,
// Facebook, Twitter/X, etc.) — they fetch a URL and read whatever plain HTML
// <meta> tags are already there, without running JavaScript. Our actual site
// is a client-side React app, so a normal page visit can't set those tags in
// time for a crawler to see them. This route renders static HTML with the
// right og:title/og:description for the specific quiz result or post, then
// immediately redirects a real visitor's browser to the real app page via a
// meta-refresh + JS redirect (both included so it works either way).
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

function renderSharePage({ title, description, redirectUrl, image }) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeRedirect = escapeHtml(redirectUrl)
  const safeImage = image ? escapeHtml(image) : null
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:type" content="website">
<meta property="og:url" content="${safeRedirect}">
${safeImage ? `<meta property="og:image" content="${safeImage}">` : ''}
<meta name="twitter:card" content="${safeImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
${safeImage ? `<meta name="twitter:image" content="${safeImage}">` : ''}
<meta http-equiv="refresh" content="0; url=${safeRedirect}">
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
<p>Redirecting to <a href="${safeRedirect}">${safeTitle}</a>...</p>
</body>
</html>`
}

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

// Games aren't admin-authored database content (see gameController.js's
// GAME_SLUGS) — this mirrors frontend/src/games/registry.js so a share
// preview has a title/description to show. Keep the two in sync by hand
// whenever a game is added or renamed, same as GAME_SLUGS already is.
const GAME_META = {
  'tic-tac-toe': {
    title: 'Tic-Tac-Toe',
    emoji: '⭕',
    description: 'Classic 3x3 — think you can outsmart the house?',
  },
  'rock-paper-scissors': {
    title: 'Rock Paper Scissors',
    emoji: '✂️',
    description: 'One round, no tricks — the house plays completely at random.',
  },
  'memory-match': {
    title: 'Memory Match',
    emoji: '🧠',
    description: 'Flip cards, find the pairs — how few moves can you do it in?',
  },
  2048: {
    title: '2048',
    emoji: '🔢',
    description: 'Slide and merge tiles to reach 2048.',
  },
  'word-guess': {
    title: 'Word Guess',
    emoji: '🔤',
    description: 'Guess the word one letter at a time before you run out of lives.',
  },
  'guess-the-number': {
    title: 'Guess the Number',
    emoji: '🎯',
    description: "We're thinking of a number 1-100 — can you find it?",
  },
  sudoku: {
    title: 'Sudoku',
    emoji: '🔢',
    description: 'Fill the grid so every row, column, and 3x3 box has 1-9.',
  },
}

export async function shareQuizIntro(req, res) {
  const { slug } = req.params
  const quiz = await Quiz.findOne({ slug, status: 'published' })
  if (!quiz) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${quiz.emoji || ''} ${quiz.title}`.trim(),
      description: `${quiz.description} — take it on Twegle!`,
      redirectUrl: `${frontendUrl()}/quiz/${slug}`,
    })
  )
}

export async function shareQuizResult(req, res) {
  const { slug, resultKey } = req.params
  const quiz = await Quiz.findOne({ slug, status: 'published' })
  const result = quiz?.results?.find((r) => r.key === resultKey)
  if (!quiz || !result) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${result.emoji} ${result.title}`.trim(),
      description: `${result.description} — take the "${quiz.title}" quiz on Twegle!`,
      redirectUrl: `${frontendUrl()}/result/${slug}/${resultKey}`,
    })
  )
}

export async function shareGameIntro(req, res) {
  const { slug } = req.params
  const meta = GAME_META[slug]
  if (!meta) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${meta.emoji} ${meta.title}`.trim(),
      description: `${meta.description} — play it on Twegle!`,
      redirectUrl: `${frontendUrl()}/games/${slug}`,
    })
  )
}

export async function shareFriendshipQuizIntro(req, res) {
  const { slug } = req.params
  const quiz = await FriendshipQuiz.findOne({ slug, status: 'published' })
  if (!quiz) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${quiz.emoji || ''} ${quiz.title}`.trim(),
      description: `${quiz.description} — see how well your friends know you, on Twegle!`,
      redirectUrl: `${frontendUrl()}/friendship/${quiz.slug}`,
    })
  )
}

export async function shareTicTacToe(req, res) {
  const { code } = req.params
  const game = await TicTacToeGame.findOne({ code })
  if (!game) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `⭕ ${game.playerXName} wants to play Tic-Tac-Toe with you!`,
      description: 'Take your turn and see who wins — on Twegle!',
      redirectUrl: `${frontendUrl()}/games/tic-tac-toe/${code}`,
    })
  )
}

export async function shareStory(req, res) {
  const { slug } = req.params
  const story = await Story.findOne({ slug, status: 'published' })
  if (!story) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${story.emoji || ''} ${story.title}`.trim(),
      description: `${story.body.slice(0, 140)}${story.body.length > 140 ? '...' : ''} — read it on Twegle!`,
      redirectUrl: `${frontendUrl()}/story/${slug}`,
    })
  )
}

export async function sharePuzzle(req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send('Not found')
  }

  const puzzle = await Puzzle.findOne({ _id: id, status: 'published' })
  if (!puzzle) return res.status(404).send('Not found')

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${puzzle.emoji || ''} Can you solve this?`.trim(),
      description: `${puzzle.question} — try it on Twegle!`,
      redirectUrl: `${frontendUrl()}/puzzle/${id}`,
      image: puzzle.imageUrl || null,
    })
  )
}

export async function sharePost(req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send('Not found')
  }

  const post = await Post.findOne({ _id: id, status: 'published' })
  if (!post) return res.status(404).send('Not found')

  const displayText = post.text || ''

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: post.author ? `"${displayText}" — ${post.author}` : displayText,
      description: 'Shared from Twegle — quizzes, quotes & chaos for everyone.',
      redirectUrl: `${frontendUrl()}/post/${id}`,
      image: post.imageUrl || null,
    })
  )
}

// Like shareGameIntro — horoscopes are computed, not database rows, so this
// just recomputes the same deterministic text a real visit would show
// rather than looking anything up.
export async function shareHoroscope(req, res) {
  const { sign } = req.params
  const period = ['day', 'week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'day'
  if (!findZodiacSign(sign)) {
    return res.status(404).send('Not found')
  }

  const horoscope = computeHoroscope(sign, period, req.query.language)

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${horoscope.emoji} ${horoscope.signName} Horoscope`,
      description: `${horoscope.text} — for fun only, on Twegle!`,
      redirectUrl: `${frontendUrl()}/horoscope/${sign}`,
    })
  )
}

export async function shareFriendshipInstance(req, res) {
  const { code } = req.params
  const instance = await FriendshipInstance.findOne({ code })
  const quiz = instance && (await FriendshipQuiz.findById(instance.friendshipQuiz))
  if (!instance || !quiz) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `How well do you know ${instance.subjectName}?`,
      description: `Take "${quiz.title}" and see how many you get right — on Twegle!`,
      redirectUrl: `${frontendUrl()}/friendship/play/${code}`,
    })
  )
}

export async function shareQuizCompare(req, res) {
  const { code } = req.params
  const compare = await QuizCompare.findOne({ code })
  const quiz = compare && (await Quiz.findById(compare.quiz))
  if (!compare || !quiz) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `${compare.personAName} wants to compare "${quiz.title}" results with you!`,
      description: `Take the quiz and see if you match with ${compare.personAName} — on Twegle!`,
      redirectUrl: `${frontendUrl()}/quiz/${quiz.slug}/vs/${code}`,
    })
  )
}

export async function shareFriendshipAttempt(req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send('Not found')
  }

  const attempt = await FriendshipAttempt.findById(id)
  const instance = attempt && (await FriendshipInstance.findById(attempt.instance))
  const quiz = instance && (await FriendshipQuiz.findById(instance.friendshipQuiz))
  if (!attempt || !instance || !quiz) {
    return res.status(404).send('Not found')
  }

  res.set('Content-Type', 'text/html')
  res.send(
    renderSharePage({
      title: `I scored ${attempt.score}/${quiz.questions.length} on ${instance.subjectName}'s friendship quiz!`,
      description: 'Take your own guess on Twegle and see how well you know them.',
      redirectUrl: `${frontendUrl()}/friendship/result/${id}`,
    })
  )
}
