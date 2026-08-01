import { Router } from 'express'
import { createGame, getGame, joinGame, makeMove } from '../controllers/ticTacToeController.js'
import { ticTacToeLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// The limiter is only applied to these write actions, not the GET below —
// the frontend polls GET while waiting for the opponent's move (see
// TicTacToeMultiplayer.jsx), so rate-limiting reads here would break that.
router.post('/', ticTacToeLimiter, createGame)
router.get('/:code', getGame)
router.post('/:code/join', ticTacToeLimiter, joinGame)
router.post('/:code/move', ticTacToeLimiter, makeMove)

export default router
