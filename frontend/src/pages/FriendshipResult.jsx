import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchFriendshipAttempt, getFriendshipResultShareUrl, getFriendshipShareUrl } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordShare } from '../utils/badges'

// Picks an encouraging message to show based on how many guesses were correct.
function scoreMessage(score, total) {
  const pct = score / total
  if (pct === 1) return "Perfect score! You truly know them."
  if (pct >= 0.75) return 'Impressive — you really know them well.'
  if (pct >= 0.5) return 'Not bad! Room to know them even better.'
  return "Time to hang out more — there's a lot to learn!"
}

// Shows how well a friend guessed someone's answers in the "Friendship
// Quiz" — the score, an answer-by-answer breakdown, and ways to share it.
export default function FriendshipResult() {
  const { attemptId } = useParams()
  const [result, setResult] = useState(null) // the scored result once loaded
  const [notFound, setNotFound] = useState(false) // true if this result doesn't exist

  // Loads this attempt's result using the id from the URL.
  useEffect(() => {
    fetchFriendshipAttempt(attemptId)
      .then((data) => (data ? setResult(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [attemptId])

  useDocumentMeta(
    result && `I scored ${result.score}/${result.total} on ${result.subjectName}'s friendship quiz!`,
    result && 'Take your own guess on Twegle and see how well you know them.'
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that result.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const shareUrl = getFriendshipResultShareUrl(attemptId)
  const challengeUrl = getFriendshipShareUrl(result.instanceCode)
  const challengeText = `I scored ${result.score}/${result.total} on ${result.subjectName}'s friendship quiz — think you know them better?`

  // Shares (or copies) a link inviting another friend to take this same guessing quiz.
  async function handleChallenge() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Challenge Your Friend', text: challengeText, url: challengeUrl })
        recordShare()
        return
      } catch {
        return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${challengeText} ${challengeUrl}`)}`, '_blank', 'noopener')
    recordShare()
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <div
        className={`animate-pop-in rounded-3xl p-10 text-white shadow-lg bg-gradient-to-br ${result.gradient}`}
      >
        <div className="text-6xl mb-4">{result.quizEmoji}</div>
        <p className="text-lg font-medium mb-1">
          {result.guesserName}, you scored
        </p>
        <p className="text-5xl font-extrabold mb-3">
          {result.score}/{result.total}
        </p>
        <p className="text-white/90">{scoreMessage(result.score, result.total)}</p>
      </div>

      <p className="mt-6 text-sm font-semibold text-gray-600 dark:text-gray-400">
        Think your friend can do better?
      </p>
      <button
        onClick={handleChallenge}
        className="mt-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
      >
        🏆 Challenge Your Friend
      </button>

      <div className="mt-4">
        <ShareButtons
          title={`I scored ${result.score}/${result.total} on ${result.subjectName}'s friendship quiz!`}
          url={shareUrl}
          shareText={`I scored ${result.score}/${result.total} on ${result.subjectName}'s friendship quiz!`}
        />
      </div>

      {/* The breakdown showing each question, the real answer, and whether the guess was right */}
      <div className="mt-10 text-left">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Answer by answer</h2>
        <div className="space-y-3">
          {result.results.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                r.correct
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {r.correct ? '✅' : '❌'} {r.text}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {result.subjectName} picked: <span className="font-semibold">{r.options[r.correctIndex]}</span>
              </p>
              {!r.correct && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  You guessed: {r.options[r.guessIndex]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <AdSlot />
      </div>

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        See more
      </Link>
    </div>
  )
}
