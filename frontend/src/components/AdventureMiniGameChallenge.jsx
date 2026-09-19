import { useEffect, useRef, useState } from 'react'

// Plays 3 of Adventure World's mini-challenge types in place, inline on the
// location screen — the genuinely game-shaped ones (a grid tap, a memorize-
// then-recall sequence, a timed reaction), as opposed to AdventureAnswerChallenge's
// text/choice-answer shapes (guess/quick-brain/code-breaker/observation).
// Payload shapes, same "keep admin-authored JSON small" reasoning as
// AdventureAnswerChallenge.jsx:
//   find-it:  { prompt, items: [string, ...] (emoji), targetIndex }
//   memory:   { prompt, sequence: [string, ...] (emoji, in order to remember) }
//   reaction: { prompt }
export default function AdventureMiniGameChallenge({ challenge, onComplete }) {
  if (challenge.type === 'find-it') return <FindIt payload={challenge.payload || {}} onComplete={onComplete} />
  if (challenge.type === 'memory') return <Memory payload={challenge.payload || {}} onComplete={onComplete} />
  if (challenge.type === 'reaction') return <Reaction payload={challenge.payload || {}} onComplete={onComplete} />
  return null
}

function FindIt({ payload, onComplete }) {
  const [wrong, setWrong] = useState(null) // index of the last wrong tap, for a brief shake/highlight
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const items = payload.items || []

  async function handleTap(i) {
    if (submitting || done) return
    if (i === payload.targetIndex) {
      setDone(true)
      setSubmitting(true)
      await onComplete()
      setSubmitting(false)
    } else {
      setWrong(i)
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{payload.prompt}</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleTap(i)}
            disabled={done}
            className={`aspect-square text-3xl rounded-xl border flex items-center justify-center transition-colors ${
              done && i === payload.targetIndex
                ? 'bg-green-50 dark:bg-green-950/40 border-green-400'
                : wrong === i
                ? 'bg-red-50 dark:bg-red-950/40 border-red-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500'
            } disabled:cursor-default`}
          >
            {item}
          </button>
        ))}
      </div>
      {wrong !== null && <p className="text-sm text-red-500 mt-2">Not quite — try again!</p>}
      {done && <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">🎉 Found it!</p>}
    </div>
  )
}

// A short memorize-then-recall game: show the sequence for a few seconds,
// hide it, then ask the player to tap the same (shuffled) items back in the
// original order. A wrong tap re-shows the sequence rather than just
// resetting the selection — replaying the memorize step is the honest way
// to let a kid retry without turning it into "guess the order by trial and
// error."
function Memory({ payload, onComplete }) {
  const sequence = payload.sequence || []
  const [phase, setPhase] = useState('memorize') // 'memorize' | 'recall'
  const [shuffled, setShuffled] = useState(() => shuffle(sequence))
  const [selected, setSelected] = useState([])
  const [wrong, setWrong] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const memorizeMs = 1500 + sequence.length * 1200
    timerRef.current = setTimeout(() => setPhase('recall'), memorizeMs)
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'memorize' ? shuffled : null])

  async function handlePick(i) {
    if (done || submitting) return
    const next = [...selected, i]
    const soFarCorrect = next.every((idx, pos) => shuffled[idx] === sequence[pos])
    if (!soFarCorrect) {
      setWrong(true)
      setTimeout(() => {
        setWrong(false)
        setSelected([])
        setShuffled(shuffle(sequence))
        setPhase('memorize')
      }, 900)
      return
    }
    setSelected(next)
    if (next.length === sequence.length) {
      setDone(true)
      setSubmitting(true)
      await onComplete()
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{payload.prompt}</p>
      {phase === 'memorize' ? (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Memorize this order!</p>
          <div className="flex gap-2 flex-wrap">
            {sequence.map((item, i) => (
              <div key={i} className="w-14 h-14 text-3xl rounded-xl border border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                {item}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Now tap them back in the same order! ({selected.length}/{sequence.length})</p>
          <div className="flex gap-2 flex-wrap">
            {shuffled.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePick(i)}
                disabled={done || selected.includes(i)}
                className={`w-14 h-14 text-3xl rounded-xl border flex items-center justify-center transition-colors ${
                  selected.includes(i)
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-400 opacity-50'
                    : wrong
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500'
                } disabled:cursor-default`}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
      {wrong && <p className="text-sm text-red-500 mt-2">Not quite — let's peek again!</p>}
      {done && <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">🎉 Perfect memory!</p>}
    </div>
  )
}

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// A simple reaction-time game: wait for a random delay, then tap as soon as
// the target appears. Tapping before it appears counts as "too soon" and
// restarts the wait, rather than trivially completing on a spam-tap.
function Reaction({ payload, onComplete }) {
  const [phase, setPhase] = useState('waiting') // 'waiting' | 'ready' | 'done'
  const [tooSoon, setTooSoon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const delay = 1200 + Math.random() * 2000
    timerRef.current = setTimeout(() => setPhase('ready'), delay)
    return () => clearTimeout(timerRef.current)
  }, [phase === 'waiting' ? tooSoon : null]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTap() {
    if (phase === 'done' || submitting) return
    if (phase === 'waiting') {
      clearTimeout(timerRef.current)
      setTooSoon(true)
      setTimeout(() => setTooSoon(false), 700)
      return
    }
    setPhase('done')
    setSubmitting(true)
    await onComplete()
    setSubmitting(false)
  }

  return (
    <div>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{payload.prompt || 'Tap the button the moment it turns green!'}</p>
      <button
        type="button"
        onClick={handleTap}
        disabled={phase === 'done'}
        className={`w-full py-8 rounded-xl border-2 text-lg font-bold transition-colors ${
          phase === 'ready'
            ? 'bg-green-400 border-green-500 text-white'
            : tooSoon
            ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-600 dark:text-red-400'
            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
        } disabled:cursor-default`}
      >
        {phase === 'ready' ? '👆 Tap now!' : tooSoon ? 'Too soon — wait for it!' : 'Wait for it...'}
      </button>
      {phase === 'done' && <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">🎉 Nice reflexes!</p>}
    </div>
  )
}
