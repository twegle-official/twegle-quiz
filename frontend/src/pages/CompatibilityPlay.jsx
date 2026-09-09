import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchCompatibilitySession, joinCompatibilitySession } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// The page person B lands on for a "Compatibility / match tester" link —
// answers the SAME questions person A did, for real (not guessing), then
// gets sent to the result page. Structurally mirrors FriendshipPlay.jsx,
// but submits real answers rather than guesses against a hidden answer key.
export default function CompatibilityPlay() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null) // the session details and questions to answer
  const [notFound, setNotFound] = useState(false) // true if this compatibility link doesn't exist
  const [name, setName] = useState('') // person B's own name, typed into the form
  const [answers, setAnswers] = useState([]) // person B's picked answer for each question
  const [submitting, setSubmitting] = useState(false) // true while the answers are being scored
  const [error, setError] = useState('') // holds any error message to show the user

  // Loads the compatibility session's questions using the code from the URL.
  useEffect(() => {
    fetchCompatibilitySession(code)
      .then((data) => {
        if (!data) return setNotFound(true)
        setSession(data)
        setAnswers(new Array(data.questions.length).fill(null))
      })
      .catch(() => setNotFound(true))
  }, [code])

  // If someone (person B, or a third person opening an already-used link)
  // has already joined, skip straight to the result instead of re-asking.
  useEffect(() => {
    if (session?.joined) {
      navigate(`/friendship/compat/${code}/result`, { replace: true })
    }
  }, [session, code, navigate])

  useDocumentMeta(
    session && `How compatible are you with ${session.personAName}?`,
    session && `Answer the same questions as ${session.personAName} and find out your match — on Twegle.`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">This link doesn't exist or has expired.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!session || session.joined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
        ))}
      </div>
    )
  }

  const isHindi = session.quizLanguage === 'hi'
  const allAnswered = answers.every((a) => a !== null)

  // Submits person B's name and real answers, then goes to the results page.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !allAnswered) return
    setSubmitting(true)
    setError('')
    try {
      await joinCompatibilitySession(code, name.trim(), answers)
      navigate(`/friendship/compat/${code}/result`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{session.quizEmoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isHindi
            ? `${session.personAName} के साथ तुम कितने कम्पैटिबल हो?`
            : `How compatible are you with ${session.personAName}?`}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isHindi
            ? 'असली जवाब दो — तुम दोनों को तुरंत बाद अपना मैच पता चल जाएगा।'
            : "Answer for real — you'll both find out your match right after."}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {isHindi ? 'आपका नाम' : 'Your name'}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isHindi ? 'जैसे प्रिया' : 'e.g. Priya'}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
          />
        </div>

        <div className="space-y-6">
          {session.questions.map((question, qIndex) => (
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
                      setAnswers((a) => a.map((val, i) => (i === qIndex ? oIndex : val)))
                    }
                    className={`text-left px-4 py-3 rounded-xl border font-medium transition-colors ${
                      answers[qIndex] === oIndex
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
          disabled={!name.trim() || !allAnswered || submitting}
          className="mt-8 w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting
            ? isHindi ? 'तुम्हारा मैच खोजा जा रहा है...' : 'Finding your match...'
            : isHindi ? 'हमारी कम्पैटिबिलिटी देखें' : 'See Our Compatibility'}
        </button>
      </form>
    </div>
  )
}
