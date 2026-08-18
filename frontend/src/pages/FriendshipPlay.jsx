import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchFriendshipInstance, submitFriendshipAttempt } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// The page where a friend guesses how someone else answered a set of
// personal questions, as part of the "Friendship Quiz" feature.
export default function FriendshipPlay() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [instance, setInstance] = useState(null) // the quiz details and questions to guess
  const [notFound, setNotFound] = useState(false) // true if this friendship quiz link doesn't exist
  const [guesserName, setGuesserName] = useState('') // the friend's own name, typed into the form
  const [guesses, setGuesses] = useState([]) // the friend's picked answer for each question
  const [submitting, setSubmitting] = useState(false) // true while the guesses are being scored
  const [error, setError] = useState('') // holds any error message to show the user

  // Loads the friendship quiz's questions using the code from the URL.
  useEffect(() => {
    fetchFriendshipInstance(code)
      .then((data) => {
        if (!data) return setNotFound(true)
        setInstance(data)
        setGuesses(new Array(data.questions.length).fill(null))
      })
      .catch(() => setNotFound(true))
  }, [code])

  useDocumentMeta(
    instance && `How well do you know ${instance.subjectName}?`,
    instance && `Guess what ${instance.subjectName} would really say and see your score — on Twegle.`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">This link doesn't exist or has expired.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
        ))}
      </div>
    )
  }

  const allAnswered = guesses.every((g) => g !== null)

  // Submits the friend's name and guesses, then goes to the results page.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!guesserName.trim() || !allAnswered) return
    setSubmitting(true)
    setError('')
    try {
      const result = await submitFriendshipAttempt(code, guesserName.trim(), guesses)
      navigate(`/friendship/result/${result.attemptId}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{instance.quizEmoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          How well do you know {instance.subjectName}?
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Guess what {instance.subjectName} would really say — no peeking!</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your name</label>
          <input
            required
            value={guesserName}
            onChange={(e) => setGuesserName(e.target.value)}
            placeholder="e.g. Priya"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
          />
        </div>

        {/* The list of questions, each with clickable answer options */}
        <div className="space-y-6">
          {instance.questions.map((question, qIndex) => (
            <div key={qIndex}>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {qIndex + 1}. {question.text}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option, oIndex) => (
                  <button
                    type="button"
                    key={oIndex}
                    onClick={() =>
                      setGuesses((g) => g.map((val, i) => (i === qIndex ? oIndex : val)))
                    }
                    className={`text-left px-4 py-3 rounded-xl border font-medium transition-colors ${
                      guesses[qIndex] === oIndex
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={!guesserName.trim() || !allAnswered || submitting}
          className="mt-8 w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Scoring your guesses...' : 'See My Score'}
        </button>
      </form>
    </div>
  )
}
