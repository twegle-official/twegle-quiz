import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchQuizBySlug, recordPlay, recordEngagement } from '../api'
import ProgressBar from '../components/ProgressBar'

// Same scoring logic as Quiz.jsx's own (private, unexported) helpers —
// deliberately duplicated rather than imported. This page is meant to
// stand completely alone with no dependency on the full Quiz.jsx flow
// (no header/footer, no battle-a-friend, no compare-with-a-friend), so a
// future change to that page's own scoring shouldn't have to worry about
// an embed-page import breaking — same "self-contained over shared" call
// this codebase already makes for e.g. each game's own room-code
// generator.
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

function pickTriviaResult(quiz, scores) {
  const score = scores.correct || 0
  const match = quiz.results.find((r) => score >= r.minScore && score <= r.maxScore)
  return { key: match?.key || quiz.results[0]?.key, score }
}

// The `/embed/quiz/:quizId` page — a deliberately bare-bones, iframe-sized
// version of the quiz-taking flow (see App.jsx: this route sits outside
// PublicSite, so it renders with none of the site's own Header/Footer/
// ShareSidebar chrome). This is what a visitor sees when a third-party
// site embeds one of our quizzes — see the "Embed this quiz" panel on
// Quiz.jsx for where the <iframe> snippet pointing here comes from.
//
// No CORS/auth wrinkle to worry about here: this page is still served
// from and running on twegle.in's own origin even when it's shown inside
// someone else's page (an iframe's *document* keeps its own origin,
// regardless of which page embeds it) — so every existing API call below
// works exactly as it does anywhere else on the site.
export default function EmbedQuiz() {
  const { quizId: slug } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [scores, setScores] = useState({})
  const [result, setResult] = useState(null) // set once the last question is answered
  const viewedRef = useRef(false)
  const playedRef = useRef(false)

  useEffect(() => {
    fetchQuizBySlug(slug)
      .then((data) => (data ? setQuiz(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug])

  // Counts as a real view, same as the full quiz page — an embedded play
  // is still a real play, worth the same analytics signal.
  useEffect(() => {
    if (!quiz || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('quiz', quiz._id, 'view')
  }, [quiz])

  function handleAnswer(resultKey) {
    const nextScores = { ...scores, [resultKey]: (scores[resultKey] || 0) + 1 }
    const isLast = questionIndex === quiz.questions.length - 1

    if (!isLast) {
      setScores(nextScores)
      setQuestionIndex((i) => i + 1)
      return
    }

    const isTrivia = quiz.type === 'trivia'
    const winning = isTrivia ? pickTriviaResult(quiz, nextScores) : { key: pickWinningResult(nextScores) }
    const finalResult = quiz.results.find((r) => r.key === winning.key) || quiz.results[0]
    setResult({ ...finalResult, score: winning.score, total: quiz.questions.length, isTrivia })

    if (!playedRef.current) {
      playedRef.current = true
      recordPlay(slug, winning.key).catch(() => {})
    }
  }

  function handleReplay() {
    setQuestionIndex(0)
    setScores({})
    setResult(null)
  }

  // A quiet, credit-only footer link — always visible, so even a visitor
  // who never finishes the quiz still sees whose site this content is
  // from. `target="_top"` breaks out of the embedding page's iframe
  // entirely rather than trying to load twegle.in nested inside it.
  function PoweredByFooter() {
    return (
      <a
        href="https://twegle.in"
        target="_top"
        rel="noopener noreferrer"
        className="block text-center text-[11px] text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800"
      >
        🎯 Powered by Twegle — free quizzes, games &amp; more
      </a>
    )
  }

  const shellClassName = 'w-full min-h-screen bg-white dark:bg-gray-900 px-4 py-4 flex flex-col'

  if (notFound) {
    return (
      <div className={shellClassName}>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm my-auto">
          That quiz doesn't exist or isn't published anymore.
        </p>
        <PoweredByFooter />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className={`${shellClassName} animate-pulse`}>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
        <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className={shellClassName}>
        <div className="text-center my-auto">
          <div className="text-4xl mb-2">{result.emoji}</div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{result.title}</h1>
          {result.isTrivia && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {result.score}/{result.total}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{result.description}</p>
          <button
            onClick={handleReplay}
            className="px-4 py-2 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            🔁 Try again
          </button>
        </div>
        <PoweredByFooter />
      </div>
    )
  }

  const question = quiz.questions[questionIndex]

  return (
    <div className={shellClassName}>
      <ProgressBar current={questionIndex} total={quiz.questions.length} />
      <div key={questionIndex} className="animate-fade-slide-in flex-1">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
          {quiz.language === 'hi'
            ? `सवाल ${questionIndex + 1} / ${quiz.questions.length}`
            : `Question ${questionIndex + 1} of ${quiz.questions.length}`}
        </p>
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">{question.text}</h1>
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              key={option.text}
              onClick={() => handleAnswer(option.result)}
              className="text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-800 dark:text-gray-200"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
      <PoweredByFooter />
    </div>
  )
}
