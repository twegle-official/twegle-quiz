import { useState } from 'react'

// Plays 4 of Adventure World's built text/choice mini-challenge types in
// place, inline on the location screen — no separate page, since each is
// meant to take well under a minute. The other 3 (find-it/memory/reaction)
// are genuinely game-shaped rather than answer-shaped — see
// AdventureMiniGameChallenge.jsx for those. Payload shapes, chosen to keep
// admin-authored JSON as small as possible (see AdventureChallengeForm.jsx):
//   guess:        { question, options: [string, ...], correctIndex }
//   quick-brain:  { question, answer }   — free-text riddle
//   code-breaker: { cipher, answer }     — free-text, cipher shown as the puzzle text
//   observation:  { scene, question, options: [string, ...], correctIndex }
//                 — same multiple-choice shape as 'guess', but with a short
//                 scene description shown first; the question tests a
//                 detail from that scene rather than being self-contained.
export default function AdventureAnswerChallenge({ challenge, onComplete }) {
  const [choice, setChoice] = useState(null) // for 'guess'/'observation': the selected option index
  const [textAnswer, setTextAnswer] = useState('') // for 'quick-brain'/'code-breaker'
  const [result, setResult] = useState(null) // null | 'correct' | 'wrong'
  const [submitting, setSubmitting] = useState(false)
  const payload = challenge.payload || {}

  async function handleGuessSubmit(index) {
    if (result || submitting) return
    setChoice(index)
    const correct = index === payload.correctIndex
    setResult(correct ? 'correct' : 'wrong')
    if (correct) {
      setSubmitting(true)
      await onComplete()
      setSubmitting(false)
    }
  }

  async function handleTextSubmit(e) {
    e.preventDefault()
    if (result || submitting) return
    const correct = textAnswer.trim().toLowerCase() === String(payload.answer || '').trim().toLowerCase()
    setResult(correct ? 'correct' : 'wrong')
    if (correct) {
      setSubmitting(true)
      await onComplete()
      setSubmitting(false)
    }
  }

  if (challenge.type === 'guess' || challenge.type === 'observation') {
    return (
      <div>
        {challenge.type === 'observation' && payload.scene && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{payload.scene}</p>
        )}
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{payload.question}</p>
        <div className="space-y-2">
          {(payload.options || []).map((opt, i) => {
            const isChosen = choice === i
            const showCorrect = result && i === payload.correctIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleGuessSubmit(i)}
                disabled={!!result}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  showCorrect
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-400 text-green-700 dark:text-green-400'
                    : isChosen
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500'
                } disabled:cursor-default`}
              >
                {opt}
              </button>
            )
          })}
        </div>
        {result === 'wrong' && <p className="text-sm text-red-500 mt-2">Not quite — try again!</p>}
        {result === 'correct' && <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">🎉 Correct!</p>}
        {result === 'wrong' && (
          <button onClick={() => { setResult(null); setChoice(null) }} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline mt-2">
            Try again
          </button>
        )}
      </div>
    )
  }

  // 'quick-brain' and 'code-breaker' share the same free-text-answer shape.
  return (
    <form onSubmit={handleTextSubmit}>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {challenge.type === 'code-breaker' ? payload.cipher : payload.question}
      </p>
      <div className="flex gap-2">
        <input
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          disabled={result === 'correct'}
          placeholder="Type your answer..."
          className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={result === 'correct' || submitting || !textAnswer.trim()}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
        >
          Check
        </button>
      </div>
      {result === 'wrong' && <p className="text-sm text-red-500 mt-2">Not quite — try again!</p>}
      {result === 'correct' && <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">🎉 Correct!</p>}
    </form>
  )
}
