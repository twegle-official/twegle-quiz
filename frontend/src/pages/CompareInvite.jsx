import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchQuizCompare } from '../api'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

export default function CompareInvite() {
  const { quizId: slug, code } = useParams()
  const navigate = useNavigate()
  const [compare, setCompare] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchQuizCompare(slug, code)
      .then((data) => (data ? setCompare(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug, code])

  useEffect(() => {
    if (compare?.joined) {
      navigate(`/quiz/${slug}/vs/${code}/result`, { replace: true })
    }
  }, [compare, slug, code, navigate])

  useDocumentMeta(
    compare && `${compare.personAName} wants to compare "${compare.quizTitle}" results with you!`,
    compare && `Take the quiz and see if you match with ${compare.personAName} — on Twegle!`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That compare link doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back to all quizzes</Link>
      </div>
    )
  }

  if (!compare || compare.joined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse text-center">
        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4" />
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-4" />
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    navigate(`/quiz/${slug}`, { state: { compareCode: code, compareName: name.trim() } })
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <div className="text-5xl mb-4">{compare.quizEmoji || '🆚'}</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {compare.personAName} wants to compare results with you on {compare.quizTitle}!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Take the quiz yourself — you'll both find out if you match right after.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Take the Quiz
        </button>
      </form>

      <Link to="/" className="inline-block mt-10 text-violet-600 font-semibold">
        ← Back home
      </Link>
    </div>
  )
}
