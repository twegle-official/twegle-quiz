import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { fetchQuizBySlug, joinQuizCompare, recordEngagement } from '../api'
import ProgressBar from '../components/ProgressBar'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

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

export default function Quiz() {
  const { quizId: slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { compareCode, compareName } = location.state || {}

  const [quiz, setQuiz] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [scores, setScores] = useState({})
  const viewedRef = useRef(false)

  useEffect(() => {
    fetchQuizBySlug(slug)
      .then((data) => (data ? setQuiz(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug])

  useEffect(() => {
    if (!quiz || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('quiz', quiz._id, 'view')
  }, [quiz])

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
          navigate(`/quiz/${slug}/vs/${compareCode}/result`)
          return
        } catch {
          // Link expired/invalid — fall through to the normal result page
          // rather than stranding the player on a dead end.
        }
      }

      const state = isTrivia ? { score: nextScores.correct || 0, total: quiz.questions.length } : undefined
      navigate(`/result/${slug}/${winningResult}`, { state })
      return
    }

    setScores(nextScores)
    setQuestionIndex((i) => i + 1)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <ProgressBar current={questionIndex} total={quiz.questions.length} />

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
