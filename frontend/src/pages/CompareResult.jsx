import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchQuizCompare, getQuizCompareShareUrl } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { shareOrDownloadCompareImage } from '../utils/shareImage'
import { recordShare } from '../utils/badges'

// A small card showing one person's name and quiz result.
function PersonCard({ person }) {
  return (
    <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{person.name}</p>
      <div className="text-4xl mb-2">{person.resultEmoji}</div>
      <p className="font-bold text-gray-900 dark:text-gray-100">{person.resultTitle}</p>
    </div>
  )
}

// Shows whether two friends matched on a quiz once both have taken it —
// or a "still waiting" screen if only one of them has so far.
export default function CompareResult() {
  const { quizId: slug, code } = useParams()
  const [compare, setCompare] = useState(null) // the comparison data (both people's results)
  const [notFound, setNotFound] = useState(false) // true if this comparison doesn't exist
  const [generating, setGenerating] = useState(false) // true while the shareable image is being made

  // Loads the comparison data for the quiz and code in the URL.
  useEffect(() => {
    fetchQuizCompare(slug, code)
      .then((data) => (data ? setCompare(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug, code])

  useDocumentMeta(
    compare?.joined &&
      `${compare.personA.name} & ${compare.personB.name} ${compare.match ? 'matched!' : 'got different results'} on ${compare.quizTitle}`,
    compare?.joined && 'Take the quiz yourself and see if you match with your friends too — on Twegle!'
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that comparison.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!compare) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  if (!compare.joined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Still waiting on your friend!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Share your link and check back once they've taken the "{compare.quizTitle}" quiz.
        </p>
        <ShareButtons
          title={`Compare your "${compare.quizTitle}" result with me!`}
          url={getQuizCompareShareUrl(code)}
          shareText={`I got "${compare.personA.resultTitle}" on ${compare.quizTitle} — take the quiz and see if we match!`}
        />
        <Link to="/" className="inline-block mt-10 text-violet-600 font-semibold">
          ← Back home
        </Link>
      </div>
    )
  }

  const shareUrl = getQuizCompareShareUrl(code)

  // Makes a shareable image of both people's results and starts the share/download flow.
  async function handleShareImage() {
    setGenerating(true)
    try {
      await shareOrDownloadCompareImage(
        {
          gradient: compare.gradient,
          quizTitle: compare.quizTitle,
          match: compare.match,
          personA: { name: compare.personA.name, emoji: compare.personA.resultEmoji, resultTitle: compare.personA.resultTitle },
          personB: { name: compare.personB.name, emoji: compare.personB.resultEmoji, resultTitle: compare.personB.resultTitle },
        },
        {
          filename: `twegle-compare-${code}.png`,
          title: compare.quizTitle,
          text: `${compare.match ? 'We matched!' : 'We got different results!'} ${shareUrl}`,
        }
      )
      recordShare()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{compare.quizTitle}</p>

      <div className={`animate-pop-in rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${compare.gradient} mb-6`}>
        <div className="text-5xl mb-3">{compare.match ? '🎉' : '🔀'}</div>
        <h1 className="text-2xl font-extrabold">
          {compare.match ? "You two matched!" : "You got different results!"}
        </h1>
      </div>

      {/* The two side-by-side result cards, one per friend */}
      <div className="flex gap-4 mb-8">
        <PersonCard person={compare.personA} />
        <PersonCard person={compare.personB} />
      </div>

      <button
        onClick={handleShareImage}
        disabled={generating}
        className="mb-4 px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {generating ? 'Preparing image...' : '📸 Share as Image'}
      </button>

      <ShareButtons
        title={`${compare.personA.name} & ${compare.personB.name} ${compare.match ? 'matched' : 'got different results'} on ${compare.quizTitle}!`}
        url={shareUrl}
        shareText={`${compare.personA.name} & ${compare.personB.name} ${compare.match ? 'matched' : 'got different results'} on ${compare.quizTitle} — take it yourself!`}
      />

      <div className="mt-8">
        <AdSlot />
      </div>

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        Take another quiz
      </Link>
    </div>
  )
}
