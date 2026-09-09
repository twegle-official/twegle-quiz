import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCompatibilitySession, getCompatibilityShareUrl } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Shows a compatibility match's result once both people have answered — or
// a "still waiting" screen if only person A has so far. Structurally
// mirrors CompareResult.jsx's waiting/reveal duality, and FriendshipResult.jsx's
// answer-by-answer breakdown list.
export default function CompatibilityResult() {
  const { code } = useParams()
  const [session, setSession] = useState(null) // the session data (percent/verdict once both have answered)
  const [notFound, setNotFound] = useState(false) // true if this session doesn't exist

  useEffect(() => {
    fetchCompatibilitySession(code)
      .then((data) => (data ? setSession(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useDocumentMeta(
    session?.joined && `${session.personAName} & ${session.personBName} are ${session.percent}% compatible!`,
    session?.joined && 'Take the quiz yourself and see how compatible you are — on Twegle!'
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that result.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const isHindi = session.quizLanguage === 'hi'

  if (!session.joined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isHindi ? 'अभी भी तुम्हारे मैच का इंतज़ार है!' : 'Still waiting on your match!'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {isHindi
            ? `अपना लिंक शेयर करो और "${session.quizTitle}" के जवाब आने के बाद वापस देखो।`
            : `Share your link and check back once "${session.quizTitle}" has been answered.`}
        </p>
        <ShareButtons
          title={
            isHindi
              ? `${session.personAName} के साथ तुम कितने कम्पैटिबल हो?`
              : `How compatible are you with ${session.personAName}?`
          }
          url={getCompatibilityShareUrl(code)}
          shareText={
            isHindi
              ? `${session.personAName} जानना चाहता/चाहती है तुम कितने कम्पैटिबल हो — क्विज़ लो और पता लगाओ!`
              : `${session.personAName} wants to see how compatible you are — take the quiz and find out!`
          }
        />
        <Link to="/" className="inline-block mt-10 text-violet-600 font-semibold">
          {isHindi ? '← होम पर वापस जाएं' : '← Back home'}
        </Link>
      </div>
    )
  }

  const shareUrl = getCompatibilityShareUrl(code)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{session.quizTitle}</p>

      <div className={`animate-pop-in rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br ${session.gradient} mb-6`}>
        <p className="text-lg font-medium mb-1">
          {session.personAName} &amp; {session.personBName}
        </p>
        <p className="text-5xl font-extrabold mb-3">{session.percent}%</p>
        <p className="text-white/90">{session.verdict}</p>
      </div>

      <ShareButtons
        title={
          isHindi
            ? `${session.personAName} और ${session.personBName} ${session.percent}% कम्पैटिबल हैं!`
            : `${session.personAName} & ${session.personBName} are ${session.percent}% compatible!`
        }
        url={shareUrl}
        shareText={
          isHindi
            ? `${session.personAName} और ${session.personBName} "${session.quizTitle}" पर ${session.percent}% कम्पैटिबल हैं — खुद भी ट्राई करो!`
            : `${session.personAName} & ${session.personBName} are ${session.percent}% compatible on ${session.quizTitle} — take it yourself!`
        }
      />

      {/* The breakdown showing each question and whether both answers matched */}
      <div className="mt-10 text-left">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
          {isHindi ? 'सवाल दर सवाल' : 'Answer by answer'}
        </h2>
        <div className="space-y-3">
          {session.breakdown.map((r, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                r.same
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {r.same ? '✅' : '➖'} {r.text}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.personAName}: <span className="font-semibold">{r.personAAnswer}</span>
              </p>
              {!r.same && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {session.personBName}: {r.personBAnswer}
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
        {isHindi ? 'और देखें' : 'See more'}
      </Link>
    </div>
  )
}
