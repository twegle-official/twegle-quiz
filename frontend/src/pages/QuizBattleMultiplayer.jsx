import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchQuizBattle, joinQuizBattle, fetchQuizBySlug, getQuizBattleShareUrl } from '../api'
import { quizBattleSocket } from '../utils/socket'
import ShareButtons from '../components/ShareButtons'
import BackButton from '../components/BackButton'
import ProgressBar from '../components/ProgressBar'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { playSound } from '../utils/sound'

// No accounts, so each browser remembers its own role for a given battle
// code in localStorage — set to 'A' the moment the creator's "Battle a
// friend live" flow makes the battle (see Quiz.jsx), and set to 'B' here
// the moment a friend fills in the join form. Same pattern as
// ConnectFourMultiplayer.jsx's connectfour-role-${code}.
function roleStorageKey(code) {
  return `quizbattle-role-${code}`
}

// The live two-player Quiz Battle page — unlike the board games, this isn't
// turn-based on shared state: each player races through the same quiz's
// questions independently, at their own pace. The server only tracks
// aggregate progress (answeredCount/correctCount) per player, not which
// exact question either player is on, so "which question to show next" is
// purely local state here, resynced from the server's answeredCount on load
// (covers a mid-battle page refresh).
export default function QuizBattleMultiplayer() {
  const { quizId: slug, code } = useParams()
  // The battle doc as last received from the server (progress, status, winner)
  const [game, setGame] = useState(null)
  // The full quiz doc (questions/options), fetched once we know its slug
  const [quiz, setQuiz] = useState(null)
  // True if no battle matches this invite code
  const [notFound, setNotFound] = useState(false)
  // 'A' or 'B' — which side this browser is playing, remembered in localStorage
  const [role, setRole] = useState(() => localStorage.getItem(roleStorageKey(code)))
  // The name typed into the "join" form
  const [joinName, setJoinName] = useState('')
  // True while the join request is in progress
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  // This browser's own current question — purely local, resynced below
  const [myQuestionIndex, setMyQuestionIndex] = useState(0)
  const answeringRef = useRef(false)

  const load = useCallback(() => {
    fetchQuizBattle(code)
      .then((data) => (data ? setGame(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  // The battle doc only stores quizSlug/quizTitle/totalQuestions, not the
  // actual questions — load the real quiz content once we know its slug,
  // same call Quiz.jsx makes for solo play.
  useEffect(() => {
    if (!game?.quizSlug) return
    fetchQuizBySlug(game.quizSlug).then((data) => data && setQuiz(data))
  }, [game?.quizSlug])

  // Resyncs the local question cursor to this player's server-side progress
  // — covers a mid-battle refresh landing back on the right question.
  useEffect(() => {
    if (!game || !role) return
    const mine = role === 'A' ? game.playerA : game.playerB
    setMyQuestionIndex(mine.answeredCount)
  }, [game, role])

  // Live updates replace polling entirely, same as every other multiplayer
  // page: connect once we know our role, join the room named after the
  // code, and let every 'gameState' broadcast update local state directly.
  useEffect(() => {
    if (!role) return

    function handleGameState(data) {
      setGame(data)
    }
    function handleError(message) {
      setError(message)
    }
    function joinRoom() {
      quizBattleSocket.emit('joinRoom', { code, role })
    }

    quizBattleSocket.on('gameState', handleGameState)
    quizBattleSocket.on('errorMsg', handleError)
    quizBattleSocket.on('connect', joinRoom)

    quizBattleSocket.connect()
    if (quizBattleSocket.connected) joinRoom()

    return () => {
      quizBattleSocket.off('gameState', handleGameState)
      quizBattleSocket.off('errorMsg', handleError)
      quizBattleSocket.off('connect', joinRoom)
      quizBattleSocket.disconnect()
    }
  }, [code, role])

  useDocumentMeta(
    game ? `${game.playerA.name}'s "${game.quizTitle}" Live Quiz Battle` : 'Live Quiz Battle',
    'A real-time, timed quiz race against a friend on Twegle.'
  )

  // Same win/lose tones every other live game already uses — fires once
  // per battle, the instant the server marks it finished.
  useEffect(() => {
    if (game?.status === 'finished' && role && game.winner !== 'draw') {
      playSound(game.winner === role ? 'win' : 'lose')
    }
  }, [game?.status, game?.winner, role])

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setError('')
    try {
      const data = await joinQuizBattle(code, joinName.trim())
      localStorage.setItem(roleStorageKey(code), 'B')
      setRole('B')
      setGame(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  // Sends this player's pick for their own current question. Advances the
  // local cursor optimistically for snappy pacing — the server's own
  // questionIndex-must-match-answeredCount check is the real guard against
  // a duplicate/rapid double-click submission, not this debounce.
  function handleAnswer(optionIndex) {
    if (answeringRef.current) return
    if (!role || !game || game.status !== 'in_progress') return
    answeringRef.current = true
    playSound('click')
    quizBattleSocket.emit('answerQuestion', { code, role, questionIndex: myQuestionIndex, optionIndex })
    setMyQuestionIndex((i) => i + 1)
    setTimeout(() => {
      answeringRef.current = false
    }, 200)
  }

  function handleRematch() {
    quizBattleSocket.emit('rematch', { code, role })
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That battle doesn't exist (or the link's wrong).</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!game || !quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-6" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
        <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // No saved role — either a friend opening the invite link for the first
  // time (the common case, if the battle is still waiting), or someone who
  // opened the link after two players already matched up.
  if (!role) {
    if (game.status !== 'waiting') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">This battle already has two players.</p>
          <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
        </div>
      )
    }
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🆚</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {game.playerA.name} challenged you to a live "{game.quizTitle}" battle!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Enter your name to join — whoever gets the most correct fastest wins.
        </p>
        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}
        <form onSubmit={handleJoin}>
          <input
            required
            autoFocus
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-4"
          />
          <button
            type="submit"
            disabled={!joinName.trim() || joining}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {joining ? 'Joining...' : 'Join the battle'}
          </button>
        </form>
      </div>
    )
  }

  const me = role === 'A' ? game.playerA : game.playerB
  const opponent = role === 'A' ? game.playerB : game.playerA
  const shareUrl = getQuizBattleShareUrl(code)

  // Waiting for an opponent to join at all
  if (game.status === 'waiting') {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <BackButton className="mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{game.quizTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Waiting for your friend to join...</p>
        <ShareButtons
          title={game.quizTitle}
          url={shareUrl}
          shareText={`${game.playerA.name} challenged you to a live "${game.quizTitle}" battle on Twegle!`}
        />
      </div>
    )
  }

  // Finished — winner screen, no per-question review, bragging rights only
  if (game.status === 'finished') {
    let status
    if (game.winner === 'draw') status = "It's a dead heat — perfectly tied!"
    else if (game.winner === role) status = 'You win! 🎉'
    else status = `${opponent.name} wins this one.`

    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <BackButton className="mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{game.quizTitle}</h1>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{status}</p>
        <div className="flex justify-center gap-8 mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">You</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {me.correctCount}/{game.totalQuestions}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">{opponent.name || 'Opponent'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {opponent.correctCount}/{game.totalQuestions}
            </p>
          </div>
        </div>
        <button
          onClick={handleRematch}
          className="w-full mb-4 px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90"
        >
          🔁 Battle Again
        </button>
        <ShareButtons
          title={game.quizTitle}
          url={shareUrl}
          shareText={
            game.winner === role
              ? `I beat ${opponent.name} in a live "${game.quizTitle}" battle on Twegle!`
              : game.winner === 'draw'
              ? `I tied with ${opponent.name} in a live "${game.quizTitle}" battle on Twegle!`
              : `${opponent.name} beat me in "${game.quizTitle}" — think you can do better?`
          }
        />
      </div>
    )
  }

  // Live racing — my current question, plus opponent's live progress readout.
  // "Done" is based on the optimistic local cursor, not the server's
  // answeredCount — right after answering the last question, myQuestionIndex
  // already points past the end while the server's ack for that answer is
  // still in flight, and quiz.questions[myQuestionIndex] would be undefined.
  const iAmDone = myQuestionIndex >= game.totalQuestions
  const question = iAmDone ? null : quiz.questions[myQuestionIndex]

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <BackButton className="mb-4" />
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2 text-center">
        {opponent.name || 'Opponent'}: {opponent.answeredCount}/{game.totalQuestions} answered · {opponent.correctCount} correct
      </p>
      <ProgressBar current={me.answeredCount} total={game.totalQuestions} />

      {iAmDone ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          You're done! Waiting for {opponent.name} to finish...
        </p>
      ) : (
        <div key={myQuestionIndex} className="animate-fade-slide-in">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
            Question {myQuestionIndex + 1} of {game.totalQuestions}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{question.text}</h1>
          <div className="flex flex-col gap-3">
            {question.options.map((option, i) => (
              <button
                key={option.text}
                onClick={() => handleAnswer(i)}
                className="text-left px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-800 dark:text-gray-200"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-4 text-center">
          {error}
        </p>
      )}
    </div>
  )
}
