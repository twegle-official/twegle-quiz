import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams, Link } from 'react-router-dom'
import { fetchQuizBySlug, joinQuizCompare, recordEngagement } from '../api'
import ProgressBar from '../components/ProgressBar'
import BackButton from '../components/BackButton'
import PreviewBanner from '../components/PreviewBanner'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordRecentlyViewed } from '../utils/recentlyViewed'

function pickWinningResult(scores) {
  let bestKey = null
  let bestCount = -1
  for (const [key, count] of Object.entries(scores)) {
    if (count > bestCount) {
      bestKey = key
      bestCount = count
    }
  }
  return bestKey
}

// Trivia quizzes reuse the exact same per-option "result" tally as
// personality quizzes (see handleAnswer below) — the option's `result` is
// just the literal string 'correct'/'incorrect' instead of a personality
// key, so `scores.correct` already ends up holding the right numeric score
// with no extra tallying code needed. Picking the result is different
// though: instead of "whichever key got the most votes," it's "whichever
// result's minScore-maxScore range contains this score."
function pickTriviaResult(quiz, scores) {
  const score = scores.correct || 0
  const match = quiz.results.find((r) => score >= r.minScore && score <= r.maxScore)
  return { key: match?.key || quiz.results[0]?.key, score }
}

// The page that shows one quiz question at a time and lets the player
// click an answer, then moves on to the next question (or the result page).
export default function Quiz() {
  const { quizId: slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const previewToken = searchParams.get('preview')
  const { compareCode, compareName } = location.state || {}

  // The quiz data loaded from the server (questions, options, etc.)
  const [quiz, setQuiz] = useState(null)
  // True if no quiz matches this URL
  const [notFound, setNotFound] = useState(false)
  // Which question the player is currently on
  const [questionIndex, setQuestionIndex] = useState(0)
  // Running tally of points per result/answer key as the player answers
  const [scores, setScores] = useState({})
  const viewedRef = useRef(false)

  // Loads the quiz for this URL when the page first opens
  useEffect(() => {
    fetchQuizBySlug(slug, previewToken)
      .then((data) => (data ? setQuiz(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    // Previewing an unpublished draft shouldn't inflate its real view count
    // once it actually goes live — same reasoning as the recordPlay/badge
    // guards further down and in Result.jsx.
    if (!quiz || viewedRef.current || previewToken) return
    viewedRef.current = true
    recordEngagement('quiz', quiz._id, 'view')
    recordRecentlyViewed({ type: 'quiz', url: `/quiz/${quiz.slug}`, title: quiz.title, emoji: quiz.emoji, gradient: quiz.gradient })
  }, [quiz, previewToken])

  useDocumentMeta(quiz?.title, quiz?.description)

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That quiz doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back to all quizzes</Link>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-6" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
        <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const question = quiz.questions[questionIndex]
  const isLast = questionIndex === quiz.questions.length - 1

  async function handleAnswer(resultKey) {
    const nextScores = { ...scores, [resultKey]: (scores[resultKey] || 0) + 1 }

    if (isLast) {
      const isTrivia = quiz.type === 'trivia'
      const winningResult = isTrivia ? pickTriviaResult(quiz, nextScores).key : pickWinningResult(nextScores)

      if (compareCode && compareName) {
        try {
          await joinQuizCompare(slug, compareCode, compareName, winningResult)
          // `replace: true` — the quiz's own question-by-question steps
          // never push their own history entries (questionIndex is plain
          // component state), so without this the quiz page itself is still
          // the previous history entry. Replacing it means Back from the
          // result page goes straight to wherever the player was before
          // starting the quiz, instead of back into the finished quiz.
          navigate(`/quiz/${slug}/vs/${compareCode}/result`, { replace: true })
          return
        } catch {
          // Link expired/invalid — fall through to the normal result page
          // rather than stranding the player on a dead end.
        }
      }

      // `finished: true` is the signal Result.jsx uses to tell "this browser
      // just played it" apart from a cold visit to a shared result link
      // (same URL either way) — score/total only exist for trivia quizzes,
      // but every quiz needs that signal so "already attempted" tracking
      // (badges.js's quizzesCompleted) works for personality quizzes too,
      // not just trivia.
      const state = isTrivia
        ? { score: nextScores.correct || 0, total: quiz.questions.length, finished: true }
        : { finished: true }
      const previewQs = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : ''
      // `replace: true` — see comment above; same reasoning applies here.
      navigate(`/result/${slug}/${winningResult}${previewQs}`, { state, replace: true })
      return
    }

    setScores(nextScores)
    setQuestionIndex((i) => i + 1)
  }

  // Schema.org Quiz structured data — same JSON-LD pattern Home.jsx
  // (WebSite) and Faq.jsx (FAQPage) already use. Doesn't change anything
  // visible; it's purely for how a quiz link can be described in Google's
  // search results.
  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quiz.title,
    description: quiz.description,
    url: `${window.location.origin}/quiz/${quiz.slug}`,
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <script type="application/ld+json">{JSON.stringify(quizSchema)}</script>
      {previewToken && <PreviewBanner />}
      <BackButton className="mb-4" />
      {/* Clearly disclosed, not hidden — the actual legal-disclosure moment
          for a sponsored quiz, unlike the tile badge which is easy to miss. */}
      {quiz.sponsor?.name && (
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-4">
          ✨ Sponsored by{' '}
          {quiz.sponsor.url ? (
            <a href={quiz.sponsor.url} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
              {quiz.sponsor.logo} {quiz.sponsor.name}
            </a>
          ) : (
            <>{quiz.sponsor.logo} {quiz.sponsor.name}</>
          )}
        </p>
      )}
      <ProgressBar current={questionIndex} total={quiz.questions.length} />

      {/* The current question and its clickable answer buttons */}
      <div key={questionIndex} className="animate-fade-slide-in">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
          Question {questionIndex + 1} of {quiz.questions.length}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{question.text}</h1>
        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <button
              key={option.text}
              onClick={() => handleAnswer(option.result)}
              className="text-left px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-800 dark:text-gray-200"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
