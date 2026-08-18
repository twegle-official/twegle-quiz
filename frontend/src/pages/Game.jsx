import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { GAMES } from '../games/registry'
import TicTacToe from '../games/TicTacToe'
import ConnectFour from '../games/ConnectFour'
import SnakeLadder from '../games/SnakeLadder'
import Chess from '../games/Chess'
import RockPaperScissors from '../games/RockPaperScissors'
import MemoryMatch from '../games/MemoryMatch'
import Game2048 from '../games/Game2048'
import WordGuess from '../games/WordGuess'
import GuessTheNumber from '../games/GuessTheNumber'
import Sudoku from '../games/Sudoku'
import SimonSays from '../games/SimonSays'
import WhackAMole from '../games/WhackAMole'
import { recordGamePlay, createTicTacToeGame, createConnectFourGame, createSnakeLadderGame, createChessGame, createLudoGame, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import BackButton from '../components/BackButton'
import GameLeaderboard from '../components/GameLeaderboard'
import ContentReactions from '../components/ContentReactions'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import { recordGamePlayed } from '../utils/badges'
import { recordRecentlyViewed } from '../utils/recentlyViewed'
import { isSoundEnabled, setSoundEnabled, playSound } from '../utils/sound'

// Only games with a natural numeric result get a leaderboard — Tic-Tac-Toe
// (vs. an unbeatable minimax AI) and Rock Paper Scissors (pure luck) don't
// produce a meaningful score to compete on. Must match GAME_LEADERBOARDS on
// the backend (gameScoreController.js).
const LEADERBOARD_LABEL = {
  '2048': 'Score',
  'memory-match': 'Moves',
  'word-guess': 'Lives left',
  'guess-the-number': 'Tries',
  'simon-says': 'Rounds reached',
  'whack-a-mole': 'Moles whacked',
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
  'simon-says': {
    win: () => `I mastered Simon Says on Twegle! Can you keep up with the pattern?`,
    loss: (title) => `Tripped up by ${title} on Twegle — how many rounds can you remember?`,
  },
  'whack-a-mole': {
    win: () => `I whacked my way to a high score on Twegle! Beat it if you can.`,
    loss: (title) => `Only got a few moles in ${title} on Twegle — think you're faster?`,
  },
}

function getShareText(slug, outcome, title) {
  const builder = SHARE_TEXT_OVERRIDES[slug]?.[outcome] || DEFAULT_SHARE_TEXT[outcome]
  return builder(title)
}

export default function Game() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const game = GAMES.find((g) => g.slug === slug)
  const [outcome, setOutcome] = useState(null)
  const [score, setScore] = useState(null)
  // Arriving via the homepage's "2 Player" filter (Connect Four's card
  // appends ?mode=friend for games that also have a single-player mode —
  // see GameCard.jsx) means the visitor already chose that mode, so open
  // straight to the challenge form instead of the default single-player board.
  const [showChallengeForm, setShowChallengeForm] = useState(searchParams.get('mode') === 'friend')
  const [challengeName, setChallengeName] = useState('')
  // Ludo's own challenge form defaults to 2 (its vs-House flow — see
  // handlePlayVsHouse — is also always exactly 2, so 2 is the common case
  // for this field even when a friend is actually being challenged).
  const [challengeMaxPlayers, setChallengeMaxPlayers] = useState(2)
  const [challengeSubmitting, setChallengeSubmitting] = useState(false)
  const [challengeError, setChallengeError] = useState('')
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const viewedRef = useRef(false)

  useDocumentMeta(game?.title, game?.description)

  useEffect(() => {
    if (!game || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('game', game.slug, 'view')
    recordRecentlyViewed({ type: 'game', url: `/games/${game.slug}`, title: game.title, emoji: game.emoji, gradient: game.gradient })
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
    recordGamePlayed(slug, result)
    playSound(result === 'win' ? 'win' : 'lose')
  }

  function handleGameReset() {
    setOutcome(null)
    setScore(null)
  }

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev
      setSoundEnabled(next)
      return next
    })
  }

  // A single click listener on the whole game area (rather than wiring a
  // click sound into all nine separate game components) — plays a short
  // blip whenever the click actually landed on a button, which is every
  // meaningful interaction any of the games have (a cell, a card, a number
  // pad key, etc.), without needing to touch each game's own code.
  function handleGameAreaClick(e) {
    if (e.target.closest('button')) playSound('click')
  }

  async function handleChallengeSubmit(e) {
    e.preventDefault()
    if (!challengeName.trim()) return
    setChallengeSubmitting(true)
    setChallengeError('')
    try {
      if (game.slug === 'connect-four') {
        const data = await createConnectFourGame(challengeName.trim())
        localStorage.setItem(`connectfour-role-${data.code}`, 'red')
        navigate(`/games/connect-four/${data.code}`)
      } else if (game.slug === 'snake-ladder') {
        const data = await createSnakeLadderGame(challengeName.trim())
        localStorage.setItem(`snakeladder-role-${data.code}`, 'one')
        navigate(`/games/snake-ladder/${data.code}`)
      } else if (game.slug === 'chess') {
        const data = await createChessGame(challengeName.trim())
        localStorage.setItem(`chess-role-${data.code}`, 'white')
        navigate(`/games/chess/${data.code}`)
      } else if (game.slug === 'ludo') {
        const data = await createLudoGame(challengeName.trim(), challengeMaxPlayers)
        // Unlike every other game's fixed creator role, Ludo's 3-/4-player
        // color sequence starts at 'blue' rather than 'red' — storing the
        // server's actual assigned role (not a hardcoded guess) is what
        // fixes "Start match" never appearing for the real host in a
        // 3-or-4-player match.
        localStorage.setItem(`ludo-role-${data.code}`, data.role)
        navigate(`/games/ludo/${data.code}`)
      } else {
        const data = await createTicTacToeGame(challengeName.trim())
        localStorage.setItem(`tictactoe-role-${data.code}`, 'X')
        navigate(`/games/tic-tac-toe/${data.code}`)
      }
    } catch (err) {
      setChallengeError(err.message)
    } finally {
      setChallengeSubmitting(false)
    }
  }

  // Ludo's own "vs the house" — unlike Tic-Tac-Toe/Connect Four/Chess/Snake
  // and Ladder, there's no separate single-player component; this reuses
  // the live match infrastructure with the second seat auto-filled by an
  // AI opponent (see LudoMultiplayer.jsx's vsHouse effect). No name prompt,
  // same as every other game's single-player mode — "You" is a fine label
  // for a solo match nobody else will ever see the lobby for.
  const [vsHouseSubmitting, setVsHouseSubmitting] = useState(false)
  async function handlePlayVsHouse() {
    setVsHouseSubmitting(true)
    setChallengeError('')
    try {
      const data = await createLudoGame('You', 2, true)
      localStorage.setItem(`ludo-role-${data.code}`, data.role)
      navigate(`/games/ludo/${data.code}`)
    } catch (err) {
      setChallengeError(err.message)
    } finally {
      setVsHouseSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <button
          onClick={toggleSound}
          title={soundOn ? 'Mute game sounds' : 'Unmute game sounds'}
          aria-label={soundOn ? 'Mute game sounds' : 'Unmute game sounds'}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>
      <div className="text-5xl mb-3">{game.emoji}</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{game.title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{game.description}</p>

      {(game.slug === 'tic-tac-toe' || game.slug === 'connect-four' || game.slug === 'snake-ladder' || game.slug === 'chess' || game.slug === 'ludo') && (
        <div className="mb-8 max-w-xs mx-auto">
          {showChallengeForm ? (
            <form onSubmit={handleChallengeSubmit} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">🆚 Challenge friends</p>
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
              {game.slug === 'ludo' && (
                <div className="mb-3 text-left">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Max players</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setChallengeMaxPlayers(n)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${
                          challengeMaxPlayers === n
                            ? 'bg-violet-500 text-white border-violet-500'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={!challengeName.trim() || challengeSubmitting}
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {challengeSubmitting ? 'Creating your match...' : 'Get My Challenge Link'}
              </button>
            </form>
          ) : game.slug === 'ludo' ? (
            <div>
              <button
                onClick={handlePlayVsHouse}
                disabled={vsHouseSubmitting}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {vsHouseSubmitting ? 'Setting up your match...' : '🏠 Play vs House'}
              </button>
              {challengeError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-3">{challengeError}</p>
              )}
              <button
                onClick={() => setShowChallengeForm(true)}
                className="mt-3 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
              >
                🆚 Challenge friends to a real match instead
              </button>
            </div>
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

      <div onClick={handleGameAreaClick}>
        {game.slug === 'tic-tac-toe' && (
          <TicTacToe onGameEnd={handleGameEnd} onReset={handleGameReset} />
        )}
        {game.slug === 'connect-four' && (
          <ConnectFour onGameEnd={handleGameEnd} onReset={handleGameReset} />
        )}
        {game.slug === 'snake-ladder' && (
          <SnakeLadder onGameEnd={handleGameEnd} onReset={handleGameReset} />
        )}
        {game.slug === 'chess' && (
          <Chess onGameEnd={handleGameEnd} onReset={handleGameReset} />
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
        {game.slug === 'simon-says' && (
          <SimonSays onGameEnd={handleGameEnd} onReset={handleGameReset} />
        )}
        {game.slug === 'whack-a-mole' && (
          <WhackAMole onGameEnd={handleGameEnd} onReset={handleGameReset} />
        )}
      </div>

      {outcome && (
        <div className="mt-6">
          <ContentReactions contentType="game" contentId={game.slug} />
        </div>
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
