import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchFriendshipQuizBySlug, createFriendshipInstance, getFriendshipShareUrl, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import PreviewBanner from '../components/PreviewBanner'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Where someone fills in the answers "about themselves" for a friendship
// quiz, before sharing the resulting link with a friend to guess.
export default function FriendshipSetup() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const previewToken = searchParams.get('preview')
  const [quiz, setQuiz] = useState(null) // the friendship quiz's questions, once loaded
  const [notFound, setNotFound] = useState(false)
  const [subjectName, setSubjectName] = useState('') // the name of the person the quiz is about
  const [answers, setAnswers] = useState([]) // the chosen option index for each question
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState(null) // the share code returned once the quiz is created
  const viewedRef = useRef(false)

  // Loads the friendship quiz's questions when the page first opens.
  useEffect(() => {
    fetchFriendshipQuizBySlug(slug, previewToken)
      .then((data) => {
        if (!data) return setNotFound(true)
        setQuiz(data)
        setAnswers(new Array(data.questions.length).fill(null))
      })
      .catch(() => setNotFound(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Logs a "view" once the quiz has loaded (but not for preview links).
  useEffect(() => {
    if (!quiz || viewedRef.current || previewToken) return
    viewedRef.current = true
    recordEngagement('friendshipQuiz', quiz._id, 'view')
  }, [quiz, previewToken])

  useDocumentMeta(quiz?.title, quiz?.description)

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That friendship quiz doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
        ))}
      </div>
    )
  }

  if (code) {
    const shareUrl = getFriendshipShareUrl(code)
    return (
      <div className="max-w-xl mx-auto px-4 py-14 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your link is ready!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Send this to a friend and see how well they know you. Anyone who opens it can take a guess
          — send it to as many people as you like.
        </p>
        <ShareButtons
          title={`How well do you know ${subjectName}?`}
          url={shareUrl}
          shareText={`How well do you actually know ${subjectName}? Take the quiz and find out!`}
          onShare={() => recordEngagement('friendshipQuiz', quiz._id, 'share')}
        />
        <Link to="/" className="inline-block mt-10 text-violet-600 font-semibold">
          ← Back home
        </Link>
      </div>
    )
  }

  const allAnswered = answers.every((a) => a !== null)

  // Runs when the "Get My Shareable Link" form is submitted.
  async function handleSubmit(e) {
    e.preventDefault()
    if (!subjectName.trim() || !allAnswered) return
    setSubmitting(true)
    setError('')
    try {
      const newCode = await createFriendshipInstance(slug, subjectName.trim(), answers)
      setCode(newCode)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {previewToken && <PreviewBanner />}
      <BackButton className="mb-4" />
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{quiz.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{quiz.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{quiz.description}</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
      )}

      {/* The setup form: your name + an answer for each question */}
      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your name</label>
          <input
            required
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="e.g. Ashish"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl"
          />
        </div>

        <div className="space-y-6">
          {quiz.questions.map((question, qIndex) => (
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
          disabled={!subjectName.trim() || !allAnswered || submitting}
          className="mt-8 w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Creating your link...' : 'Get My Shareable Link'}
        </button>
      </form>
    </div>
  )
}
