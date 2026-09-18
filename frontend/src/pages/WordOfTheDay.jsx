import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  WORD_LENGTH,
  MAX_GUESSES,
  getTodayWord,
  getDayNumber,
  evaluateGuess,
  loadTodayState,
  saveTodayState,
  buildShareText,
} from '../utils/wordOfTheDay'
import { recordWordStreakCompletion, getWordStreak } from '../utils/dailyQuiz'
import { recordGamePlayed } from '../utils/badges'
import { recordGamePlay, recordEngagement } from '../api'
import { isSoundEnabled, setSoundEnabled, playSound } from '../utils/sound'
import BackButton from '../components/BackButton'
import GameLeaderboard from '../components/GameLeaderboard'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// The daily word-guessing game — same one word for everyone each day (see
// utils/wordOfTheDay.js), 6 guesses to find it, color feedback per letter.
// English-only by design: a Hindi word would need to split cleanly into
// fixed single-letter tiles the way English does, which Devanagari's own
// conjuncts/matras don't support — a genuinely different game, not just a
// translated word list, so this stays English with bilingual surrounding
// chrome only (buttons/labels), same as the rest of the page shell.
//
// Own dedicated page — deliberately bypasses Game.jsx's generic per-slug
// wrapper entirely, same reasoning SkydriftIsles.jsx already established
// for a game whose mechanics don't fit that wrapper's assumptions (a
// "vs the house"/"challenge a friend" framing, infinite replayability).
// This game is once-per-day, has its own persistent daily-lock state, and
// its own spoiler-free share format — none of which the generic wrapper
// was built for. Still listed in games/registry.js like any other game,
// with its own route in App.jsx taking priority over the generic
// `/games/:slug` catch-all, so it shows up normally on the Games tab.
const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

const CELL_COLOR = {
  correct: 'bg-green-500 border-green-500 text-white',
  present: 'bg-amber-400 border-amber-400 text-white',
  absent: 'bg-gray-400 dark:bg-gray-700 border-gray-400 dark:border-gray-700 text-white',
}
const KEY_COLOR = {
  correct: 'bg-green-500 text-white',
  present: 'bg-amber-400 text-white',
  absent: 'bg-gray-400 dark:bg-gray-700 text-white',
}
// Priority when a letter has appeared in more than one past guess with
// different results — 'correct' always wins, 'absent' never overrides
// something better, matching how the real Wordle keyboard behaves.
const STATUS_RANK = { correct: 3, present: 2, absent: 1 }

export default function WordOfTheDay() {
  const answer = useRef(getTodayWord()).current
  const dayNumber = getDayNumber()
  const [state, setState] = useState(() => loadTodayState())
  // Captured once, at mount, before any play happens this session — true
  // only when today's game was already finished on a *previous* visit
  // (reopening the page later the same day), not when it's finished just
  // now by actually playing. Lets the finished screen tell those two
  // cases apart instead of showing identical "you solved it!" copy
  // either way, which read as confusing/ambiguous about what just happened.
  const wasAlreadyDoneOnLoad = useRef(loadTodayState().status !== 'playing').current
  const [currentGuess, setCurrentGuess] = useState('')
  const [shake, setShake] = useState(false) // brief invalid-guess feedback
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const viewedRef = useRef(false)

  useDocumentMeta('Word of the Day', "Guess Twegle's word of the day in 6 tries — a new word every day.")

  useEffect(() => {
    if (viewedRef.current) return
    viewedRef.current = true
    recordEngagement('game', 'word-of-the-day', 'view')
  }, [])

  const finished = state.status !== 'playing'

  // Builds the on-screen keyboard's per-letter color from every guess made
  // so far, taking the best (highest-ranked) status seen for each letter.
  const keyStatus = {}
  for (const guess of state.guesses) {
    const results = evaluateGuess(guess, answer)
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i]
      const status = results[i]
      if (!keyStatus[letter] || STATUS_RANK[status] > STATUS_RANK[keyStatus[letter]]) {
        keyStatus[letter] = status
      }
    }
  }

  function finishGame(nextState, won) {
    setState(nextState)
    saveTodayState(nextState)
    const outcome = won ? 'win' : 'loss'
    recordGamePlay('word-of-the-day', outcome)
    recordGamePlayed('word-of-the-day', outcome)
    if (won) recordWordStreakCompletion()
    playSound(won ? 'win' : 'lose')
  }

  function submitGuess() {
    if (finished) return
    if (currentGuess.length !== WORD_LENGTH) {
      setShake(true)
      setMessage('Not enough letters')
      setTimeout(() => setShake(false), 500)
      return
    }
    setMessage('')
    playSound('click')
    const guesses = [...state.guesses, currentGuess]
    const won = currentGuess === answer
    const lost = !won && guesses.length >= MAX_GUESSES
    setCurrentGuess('')

    if (won || lost) {
      finishGame({ ...state, guesses, status: won ? 'won' : 'lost' }, won)
    } else {
      const next = { ...state, guesses }
      setState(next)
      saveTodayState(next)
    }
  }

  function pressKey(key) {
    if (finished) return
    if (key === 'ENTER') return submitGuess()
    if (key === '⌫') return setCurrentGuess((g) => g.slice(0, -1))
    setCurrentGuess((g) => (g.length < WORD_LENGTH ? g + key : g))
  }

  // Real keyboard support alongside the on-screen one — common Wordle UX,
  // and means this works with no visible text input at all.
  useEffect(() => {
    function handleKeyDown(e) {
      if (finished) return
      if (e.key === 'Enter') return submitGuess()
      if (e.key === 'Backspace') return setCurrentGuess((g) => g.slice(0, -1))
      if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrentGuess((g) => (g.length < WORD_LENGTH ? g + e.key.toUpperCase() : g))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, currentGuess, state])

  async function handleCopyResult() {
    const text = buildShareText(state.guesses, answer, state.status === 'won')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unsupported — silently no-op, same as
      // ShareButtons.jsx's own copy-link fallback.
    }
  }

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev
      setSoundEnabled(next)
      return next
    })
  }

  const streak = getWordStreak()
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < state.guesses.length) return { letters: state.guesses[i].split(''), results: evaluateGuess(state.guesses[i], answer) }
    if (i === state.guesses.length && !finished) return { letters: currentGuess.padEnd(WORD_LENGTH).split(''), results: null }
    return { letters: Array(WORD_LENGTH).fill(''), results: null }
  })

  return (
    <div className="max-w-md mx-auto px-4 py-8 text-center">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <button
          onClick={toggleSound}
          title={soundOn ? 'Mute game sounds' : 'Unmute game sounds'}
          aria-label={soundOn ? 'Mute game sounds' : 'Unmute game sounds'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="text-4xl mb-1">🔤</div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Word of the Day</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Twegle Word #{dayNumber}</p>
      {streak.count > 0 && (
        <p className="text-xs font-semibold text-orange-500 mb-4">🔥 {streak.count}-day streak</p>
      )}
      {streak.count === 0 && <div className="mb-4" />}

      {/* The 6x5 guess grid */}
      <div className={`flex flex-col gap-1.5 mb-5 ${shake ? 'animate-pulse' : ''}`}>
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.letters.map((letter, j) => (
              <div
                key={j}
                className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-lg font-bold rounded border-2 uppercase ${
                  row.results
                    ? CELL_COLOR[row.results[j]]
                    : letter.trim()
                    ? 'border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {letter.trim()}
              </div>
            ))}
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-red-500 mb-3">{message}</p>}

      {finished ? (
        <div className="mb-6">
          {wasAlreadyDoneOnLoad && (
            <p className="inline-block mb-3 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 text-xs font-semibold">
              📅 You already played today's word — here's how it went
            </p>
          )}
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {state.status === 'won' ? `🎉 Solved in ${state.guesses.length}/${MAX_GUESSES}!` : `😔 Out of tries — it was ${answer}`}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {wasAlreadyDoneOnLoad
              ? "You get one word a day — this one's done. A new word (and a new grid) unlocks after midnight."
              : 'Come back tomorrow for a new word.'}
          </p>
          <button
            onClick={handleCopyResult}
            className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            {copied ? 'Copied!' : '📋 Copy Result'}
          </button>
        </div>
      ) : (
        /* The on-screen keyboard — also usable via a real keyboard, see the
           keydown listener above. Sized up (taller keys, larger text) from
           an earlier, cramped-feeling pass — widths stay as they were on
           the smallest letter keys so a 10-key row still fits a 375px
           screen with no horizontal overflow; extra room goes into height
           and font size instead, which is what actually helps thumb
           accuracy on a tightly-packed row like this. */
        <div className="flex flex-col gap-2 mb-6">
          {KEY_ROWS.map((row, i) => (
            <div key={i} className="flex justify-center gap-1">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => pressKey(key)}
                  className={`h-14 rounded font-semibold text-sm sm:text-base transition-colors ${
                    key === 'ENTER' || key === '⌫' ? 'px-3 sm:px-4' : 'w-7 sm:w-9'
                  } ${keyStatus[key] ? KEY_COLOR[keyStatus[key]] : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <GameLeaderboard
        slug="word-of-the-day"
        label="Guesses"
        score={finished && state.status === 'won' ? state.guesses.length : null}
      />

      <Link to="/?tab=games" className="inline-block mt-8 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700">
        ← More games
      </Link>
    </div>
  )
}
