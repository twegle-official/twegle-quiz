import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GAMES } from '../games/registry'
import TicTacToe from '../games/TicTacToe'
import RockPaperScissors from '../games/RockPaperScissors'
import MemoryMatch from '../games/MemoryMatch'
import Game2048 from '../games/Game2048'
import WordGuess from '../games/WordGuess'
import GuessTheNumber from '../games/GuessTheNumber'
import Sudoku from '../games/Sudoku'
import { recordGamePlay, createTicTacToeGame, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import GameLeaderboard from '../components/GameLeaderboard'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// Only games with a natural numeric result get a leaderboard — Tic-Tac-Toe
// (vs. an unbeatable minimax AI) and Rock Paper Scissors (pure luck) don't
// produce a meaningful score to compete on. Must match GAME_LEADERBOARDS on
// the backend (gameScoreController.js).
const LEADERBOARD_LABEL = {
  '2048': 'Score',
  'memory-match': 'Moves',
  'word-guess': 'Lives left',
  'guess-the-number': 'Tries',
}

// Tic-Tac-Toe/Rock Paper Scissors are explicitly framed as "vs the house," so
// the default wording fits both. The other games aren't an opponent-beating
// framing (a memory game or 2048 has no "house" to beat), so they override
// with wording that actually matches what happened.
const DEFAULT_SHARE_TEXT = {
  win: (title) => `I actually beat the house at ${title} on Twegle! Think you can?`,
  draw: (title) => `I drew with the house at ${title} on Twegle — can you beat it?`,
  loss: (title) => `The house beat me at ${title} on Twegle — bet you can't beat it either!`,
}

const SHARE_TEXT_OVERRIDES = {
  'memory-match': {
    win: (title) => `I just solved ${title} on Twegle! Give it a try.`,
  },
  2048: {
    win: () => `I hit 2048 on Twegle! Can you get there too?`,
    loss: (title) => `Ran out of moves in ${title} on Twegle — see how far you get!`,
  },
  'word-guess': {
    win: (title) => `I guessed the word on Twegle's ${title}! Your turn.`,
    loss: (title) => `Stumped by ${title} on Twegle — think you can guess it?`,
  },
  'guess-the-number': {
    win: () => `I guessed the number on Twegle! Can you do it in fewer tries?`,
    loss: (title) => `Couldn't crack ${title} on Twegle — think you can?`,
  },
  sudoku: {
    win: (title) => `I just solved a ${title} puzzle on Twegle! Give it a try.`,
  },
}

function getShareText(slug, outcome, title) {
  const builder = SHARE_TEXT_OVERRIDES[slug]?.[outcome] || DEFAULT_SHARE_TEXT[outcome]
  return builder(title)
}

export default function Game() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const game = GAMES.find((g) => g.slug === slug)
  const [outcome, setOutcome] = useState(null)
  const [score, setScore] = useState(null)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [challengeName, setChallengeName] = useState('')
  const [challengeSubmitting, setChallengeSubmitting] = useState(false)
  const [challengeError, setChallengeError] = useState('')
  const viewedRef = useRef(false)

  useDocumentMeta(game?.title, game?.description)

  useEffect(() => {
    if (!game || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('game', game.slug, 'view')
  }, [game])

  if (!game) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That game doesn't exist.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  function handleGameEnd(result, gameScore) {
    setOutcome(result)
    setScore(gameScore ?? null)
    recordGamePlay(slug, result)
  }

  function handleGameReset() {
    setOutcome(null)
    setScore(null)
  }

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    if (!challengeName.trim()) return
    setChallengeSubmitting(true)
    setChallengeError('')
    try {
      const data = await createTicTacToeGame(challengeName.trim())
      localStorage.setItem(`tictactoe-role-${data.code}`, 'X')
      navigate(`/games/tic-tac-toe/${data.code}`)
    } catch (err) {
      setChallengeError(err.message)
    } finally {
      setChallengeSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="text-left mb-4"><BackButton /></div>
      <div className="text-5xl mb-3">{game.emoji}</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{game.title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{game.description}</p>

      {game.slug === 'tic-tac-toe' && (
        <div className="mb-8 max-w-xs mx-auto">
          {showChallengeForm ? (
            <form onSubmit={handleChallengeSubmit} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">🆚 Challenge a friend</p>
              {challengeError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-3">{challengeError}</p>
              )}
              <input
                required
                autoFocus
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl mb-3 text-sm"
              />
              <button
                type="submit"
                disabled={!challengeName.trim() || challengeSubmitting}
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {challengeSubmitting ? 'Creating your match...' : 'Get My Challenge Link'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowChallengeForm(true)}
              className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >
              🆚 Challenge a friend to a real match
            </button>
          )}
        </div>
      )}

      {game.slug === 'tic-tac-toe' && (
        <TicTacToe onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === 'rock-paper-scissors' && (
        <RockPaperScissors onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === 'memory-match' && (
        <MemoryMatch onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === '2048' && (
        <Game2048 onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === 'word-guess' && (
        <WordGuess onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === 'guess-the-number' && (
        <GuessTheNumber onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}
      {game.slug === 'sudoku' && (
        <Sudoku onGameEnd={handleGameEnd} onReset={handleGameReset} />
      )}

      {outcome && (
        <div className="mt-8">
          <ShareButtons
            title={game.title}
            url={window.location.href}
            shareText={getShareText(game.slug, outcome, game.title)}
            onShare={() => recordEngagement('game', game.slug, 'share')}
          />
        </div>
      )}

      {outcome && LEADERBOARD_LABEL[game.slug] && (
        <GameLeaderboard slug={game.slug} label={LEADERBOARD_LABEL[game.slug]} score={score} />
      )}

      <div className="mt-8">
        <AdSlot />
      </div>
    </div>
  )
}
