import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchHoroscope, getHoroscopeShareUrl, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import { useDocumentMeta } from '../utils/useDocumentMeta'

const PERIODS = [
  { key: 'day', label: { en: 'Day', hi: 'दिन' } },
  { key: 'week', label: { en: 'Week', hi: 'सप्ताह' } },
  { key: 'month', label: { en: 'Month', hi: 'महीना' } },
  { key: 'year', label: { en: 'Year', hi: 'साल' } },
]

export default function HoroscopeView() {
  const { sign } = useParams()
  const [language, setLanguage] = useState('en')
  const [period, setPeriod] = useState('day')
  const [horoscope, setHoroscope] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setHoroscope(null)
    setNotFound(false)
    fetchHoroscope(sign, period, language)
      .then((data) => (data ? setHoroscope(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [sign, period, language])

  // A horoscope has no single database row to count a "view" against — it's
  // computed, not stored — so this is tracked against the sign itself,
  // grouping all periods/languages of the same sign into one engagement
  // count rather than tracking a fresh contentId per period switch.
  useEffect(() => {
    if (!horoscope) return
    recordEngagement('horoscope', sign, 'view')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign])

  useDocumentMeta(
    horoscope && `${horoscope.emoji} ${horoscope.signName} Horoscope`,
    horoscope && `${horoscope.text} — just for fun, on Twegle.`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That zodiac sign doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!horoscope) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const shareUrl = getHoroscopeShareUrl(sign, period, language)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <div
        className={`animate-pop-in rounded-3xl p-10 text-white shadow-lg bg-gradient-to-br ${horoscope.gradient}`}
      >
        <div className="text-6xl mb-4">{horoscope.emoji}</div>
        <h1 className="text-2xl font-bold leading-snug">{horoscope.signName}</h1>
        <p className="text-xs font-bold uppercase tracking-wide text-white/80 mt-2">{horoscope.dateRange}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              language === 'en' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              language === 'hi' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              period === p.key
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500'
            }`}
          >
            {p.label[language]}
          </button>
        ))}
      </div>

      <div className="mt-6 text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{horoscope.text}</p>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">{horoscope.disclaimer}</p>

      <div className="mt-6">
        <ShareButtons
          title={`${horoscope.signName} Horoscope`}
          url={shareUrl}
          shareText={`${horoscope.text} — check your own sign on Twegle!`}
          onShare={() => recordEngagement('horoscope', sign, 'share')}
        />
      </div>

      <div className="mt-8">
        <AdSlot />
      </div>

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        Back to Twegle
      </Link>
    </div>
  )
}
