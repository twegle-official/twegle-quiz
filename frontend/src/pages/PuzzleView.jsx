import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPuzzleById, fetchPuzzles, getPuzzleShareUrl, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import PuzzleCard from '../components/PuzzleCard'
import CrossPromo from '../components/CrossPromo'
import ReportButton from '../components/ReportButton'
import BackButton from '../components/BackButton'
import { shuffleArray } from '../utils/shuffle'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { pickPuzzleOfTheDay, recordDailyActivityCompletion } from '../utils/dailyQuiz'

const SUGGESTION_COUNT = 4
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export default function PuzzleView() {
  const { id } = useParams()
  const [puzzle, setPuzzle] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [dailyStreak, setDailyStreak] = useState(null)
  const [isDailyPuzzle, setIsDailyPuzzle] = useState(false)
  const viewedRef = useRef(false)

  useEffect(() => {
    fetchPuzzleById(id)
      .then((data) => (data ? setPuzzle(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [id])

  useEffect(() => {
    if (!puzzle || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('puzzle', puzzle._id, 'view')
  }, [puzzle])

  useEffect(() => {
    if (!puzzle) return
    fetchPuzzles(puzzle.language)
      .then((all) => {
        const others = all.filter((p) => p._id !== puzzle._id)
        const sameDifficulty = shuffleArray(others.filter((p) => p.difficulty === puzzle.difficulty))
        const rest = shuffleArray(others.filter((p) => p.difficulty !== puzzle.difficulty))
        setSuggestions([...sameDifficulty, ...rest].slice(0, SUGGESTION_COUNT))

        // Same date-derived pick Home.jsx's PuzzleOfTheDayBanner uses — see
        // dailyQuiz.js. Just knowing the pick matches isn't enough on its
        // own to record the streak; that only happens once the visitor
        // actually reveals the answer (handleReveal below).
        const todaysPuzzle = pickPuzzleOfTheDay(all)
        setIsDailyPuzzle(todaysPuzzle?._id === puzzle._id)
      })
      .catch(() => {})
  }, [puzzle])

  function handleReveal() {
    if (revealed) return
    setRevealed(true)
    if (isDailyPuzzle) {
      setDailyStreak(recordDailyActivityCompletion(puzzle._id, puzzle._id))
    }
  }

  useDocumentMeta(
    puzzle && `${puzzle.emoji || '🧩'} Puzzle`,
    puzzle && `${puzzle.question} — try it on Twegle!`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const shareUrl = getPuzzleShareUrl(puzzle._id)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <div
        className={`animate-pop-in rounded-3xl p-10 text-white shadow-lg bg-gradient-to-br ${puzzle.gradient}`}
      >
        <div className="text-6xl mb-4">{puzzle.emoji || '🧩'}</div>
        <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">
          {DIFFICULTY_LABEL[puzzle.difficulty] || 'Easy'} Puzzle
        </p>
        <h1 className="text-2xl font-bold leading-snug">{puzzle.question}</h1>
      </div>

      {puzzle.imageUrl && (
        <img
          src={puzzle.imageUrl}
          alt=""
          className="mt-6 w-full rounded-2xl shadow-sm"
        />
      )}

      <div className="mt-6">
        {!revealed ? (
          <button
            onClick={handleReveal}
            className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            🔍 Reveal Answer
          </button>
        ) : (
          <div className="text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Answer</p>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{puzzle.answer}</p>
          </div>
        )}
      </div>

      {revealed && isDailyPuzzle && dailyStreak?.count > 0 && (
        <p className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
          🔥 {dailyStreak.count}-day streak!
        </p>
      )}

      <div className="mt-6">
        <ShareButtons
          title="Can you solve this?"
          url={shareUrl}
          shareText={`${puzzle.question} — try it on Twegle!`}
          onShare={() => recordEngagement('puzzle', puzzle._id, 'share')}
        />
      </div>

      <div className="mt-8">
        <AdSlot />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((p, i) => (
              <PuzzleCard key={p._id} puzzle={p} index={i} />
            ))}
          </div>
        </div>
      )}

      <CrossPromo language={puzzle.language} secondary="post" />

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        See more
      </Link>

      <div className="mt-6">
        <ReportButton contentType="puzzle" contentId={puzzle._id} contentLabel={puzzle.question} />
      </div>
    </div>
  )
}
