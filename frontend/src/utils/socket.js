import { io } from 'socket.io-client'

// VITE_API_URL points at .../api (e.g. http://localhost:4000/api) — socket.io
// connects to the bare server origin plus its own namespace, not the REST
// path, so strip the trailing /api before handing it to io().
const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '')

// One shared connection per namespace, reused across mounts/unmounts of
// ConnectFourMultiplayer.jsx (e.g. React StrictMode's double-invoke, or a
// user navigating away and back) instead of opening a fresh socket each
// time. autoConnect is off so a component controls exactly when it joins.
export const connectFourSocket = io(`${SERVER_URL}/connect-four`, { autoConnect: false })
export const ticTacToeSocket = io(`${SERVER_URL}/tic-tac-toe`, { autoConnect: false })
export const snakeLadderSocket = io(`${SERVER_URL}/snake-ladder`, { autoConnect: false })
export const chessSocket = io(`${SERVER_URL}/chess`, { autoConnect: false })
