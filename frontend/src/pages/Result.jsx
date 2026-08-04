import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { fetchQuizBySlug, fetchQuizzes, recordPlay, getQuizShareUrl, createQuizCompare, getQuizCompareShareUrl, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import QuizCard from '../components/QuizCard'
import ReportButton from '../components/ReportButton'
import BackButton from '../components/BackButton'
import { shareOrDownloadImage } from '../utils/shareImage'
import { shuffleArray } from '../utils/shuffle'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { pickQuizOfTheDay, recordDailyQuizCompletion } from '../utils/dailyQuiz'

const SUGGESTION_COUNT = 4

export default function Result() {
  const { quizId: slug, resultKey } = useParams()
  const location = useLocation()
  // Only present for the player who just finished (passed via navigate()
  // from Quiz.jsx) — a cold visit to a shared result link has no router
  // state, so the score line below is a nice-to-have, not load-bearing;
  // the result's own authored title/description still convey the tier either way.
  const { score, total } = location.state || {}
  const [quiz, setQuiz] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [dailyStreak, setDailyStreak] = useState(null)
  const [isDailyQuiz, setIsDailyQuiz] = useState(false)
  const recordedRef = useRef(false)

  const [showCompareForm, setShowCompareForm] = useState(false)
  const [compareName, setCompareName] = useState('')
  const [compareCode, setCompareCode] = useState(null)
  const [compareSubmitting, setCompareSubmitting] = useState(false)
  const [compareError, setCompareError] = useState('')

  useEffect(() => {
    fetchQuizBySlug(slug)
      .then((data) => (data ? setQuiz(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug])

  useEffect(() => {
    if (recordedRef.current) return
    recordedRef.current = true
    recordPlay(slug, resultKey)
  }, [slug, resultKey])

  useEffect(() => {
    if (!quiz) return
    fetchQuizzes(quiz.language)
      .then((all) => {
        const others = all.filter((q) => q.slug !== slug)
        const sameCategory = shuffleArray(others.filter((q) => q.category === quiz.category))
        const rest = shuffleArray(others.filter((q) => q.category !== quiz.category))
        setSuggestions([...sameCategory, ...rest].slice(0, SUGGESTION_COUNT))

        // Same-language list, same date-derived pick Home.jsx's banner uses
        // — see dailyQuiz.js. Only actually updates the stored streak if
        // this quiz is today's pick.
        const todaysQuiz = pickQuizOfTheDay(all)
        if (todaysQuiz?.slug === slug) {
          setIsDailyQuiz(true)
          setDailyStreak(recordDailyQuizCompletion(slug, todaysQuiz.slug))
        }
      })
      .catch(() => {})
  }, [quiz, slug])

  const result = quiz?.results?.find((r) => r.key === resultKey)

  useDocumentMeta(
    result && `I got "${result.title}" on ${quiz.title}!`,
    result?.description
  )

  async function handleShareImage() {
    setGenerating(true)
    try {
      await shareOrDownloadImage(
        {
          gradient: quiz.gradient,
          emoji: result.emoji,
          title: result.title,
          text: result.description,
          tag: quiz.title,
        },
        {
          filename: `twegle-${slug}-${resultKey}.png`,
          title: result.title,
          text: `I got "${result.title}" on ${quiz.title}!`,
        }
      )
    } finally {
      setGenerating(false)
    }
  }

  async function handleCompareSubmit(e) {
    e.preventDefault()
    if (!compareName.trim()) return
    setCompareSubmitting(true)
    setCompareError('')
    try {
      const newCode = await createQuizCompare(slug, compareName.trim(), resultKey)
      setCompareCode(newCode)
    } catch (err) {
      setCompareError(err.message)
    } finally {
      setCompareSubmitting(false)
    }
  }

  if (notFound || (quiz && !result)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that result.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back to all quizzes</Link>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-4" />
        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4" />
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-4" />
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded mx-auto mb-2" />
        <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
      </div>
    )
  }

  const shareUrl = getQuizShareUrl(slug, resultKey)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{quiz.title}</p>
      <div className="animate-pop-in">
        <div className="text-6xl mb-3">{result.emoji}</div>
        {quiz.type === 'trivia' && typeof score === 'number' && (
          <p className="text-lg font-bold text-violet-600 dark:text-violet-400 mb-1">You scored {score}/{total}!</p>
        )}
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">{result.title}</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{result.description}</p>

      {isDailyQuiz && dailyStreak?.count > 0 && (
        <p className="inline-block mb-6 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-bold">
          🔥 {dailyStreak.count}-day streak — that was today's Quiz of the Day!
        </p>
      )}

      <button
        onClick={handleShareImage}
        disabled={generating}
        className="mb-4 px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {generating ? 'Preparing image...' : '📸 Share as Image'}
      </button>

      <ShareButtons
        title={result.title}
        url={shareUrl}
        onShare={() => recordEngagement('quiz', quiz._id, 'share')}
      />

      <div className="mt-8 max-w-sm mx-auto">
        {compareCode ? (
          <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 p-6">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🆚 Your link is ready!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Send this to a friend — once they take the quiz, you'll both see if you match.
            </p>
            <ShareButtons
              title={`Compare your "${quiz.title}" result with me!`}
              url={getQuizCompareShareUrl(compareCode)}
              shareText={`I got "${result.title}" on ${quiz.title} — take the quiz and see if we match!`}
            />
          </div>
        ) : showCompareForm ? (
          <form onSubmit={handleCompareSubmit} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">🆚 Compare with a friend</p>
            {compareError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{compareError}</p>
            )}
            <input
              required
              autoFocus
              value={compareName}
              onChange={(e) => setCompareName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-3"
            />
            <button
              type="submit"
              disabled={!compareName.trim() || compareSubmitting}
              className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {compareSubmitting ? 'Creating your link...' : 'Get My Compare Link'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowCompareForm(true)}
            className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
          >
            🆚 Compare with a friend
          </button>
        )}
      </div>

      <div className="mt-8">
        <AdSlot />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
        This page may contain affiliate links — we may earn a commission at no extra cost to you.
      </p>

      {suggestions.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <QuizCard key={s._id} quiz={s} />
            ))}
          </div>
        </div>
      )}

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        Take another quiz
      </Link>

      <div className="mt-6">
        <ReportButton contentType="quiz" contentId={quiz._id} contentLabel={quiz.title} />
      </div>
    </div>
  )
}
