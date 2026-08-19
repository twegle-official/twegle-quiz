import { io } from 'socket.io-client'

// VITE_API_URL points at .../api (e.g. http://localhost:4000/api) — socket.io
// connects to the bare server origin plus its own namespace, not the REST
// path, so strip the trailing /api before handing it to io().
const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '')

// One shared connection per namespace, reused across mounts/unmounts of
// ConnectFourMultiplayer.jsx (e.g. React StrictMode's double-invoke, or a
// user navigating away and back) instead of opening a fresh socket each
// time. autoConnect is off so a component controls exactly when it joins.
// Live connection used for multiplayer Connect Four matches.
export const connectFourSocket = io(`${SERVER_URL}/connect-four`, { autoConnect: false })
// Live connection used for multiplayer Tic Tac Toe matches.
export const ticTacToeSocket = io(`${SERVER_URL}/tic-tac-toe`, { autoConnect: false })
// Live connection used for multiplayer Snake and Ladder matches.
export const snakeLadderSocket = io(`${SERVER_URL}/snake-ladder`, { autoConnect: false })
// Live connection used for multiplayer Chess matches.
export const chessSocket = io(`${SERVER_URL}/chess`, { autoConnect: false })
// Live connection used for multiplayer Ludo matches.
export const ludoSocket = io(`${SERVER_URL}/ludo`, { autoConnect: false })
// Live connection used for Live Quiz Battle matches.
export const quizBattleSocket = io(`${SERVER_URL}/quiz-battle`, { autoConnect: false })
