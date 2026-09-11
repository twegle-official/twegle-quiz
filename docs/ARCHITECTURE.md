# Twegle — Architecture

This document is the map: how the system is put together, how a request
flows through it, and where to look for more detail. It's written for a
developer who has never seen this codebase before. It does **not** try to
describe every feature — for that, see the "Where to go next" section at
the bottom, which explains what each of the other docs in this folder
covers.

Twegle (twegle.in) is a free, no-signup-required content/quiz site aimed
at an 8-18 year-old audience: personality and right/wrong quizzes, puzzles,
posts (jokes/quotes), short stories, a light-hearted horoscope, a small
library of browser games (some single-player, some real-time multiplayer),
and a "Friendship Quiz" / compatibility feature two friends play together.
Optional end-user accounts exist to sync streaks/badges across devices,
but every feature also works fully anonymously.

---

## 1. Tech stack at a glance

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + React Router 7, Tailwind CSS v4, installable as a PWA |
| Backend | Node.js + Express 5, Socket.IO 4 for real-time games |
| Database | MongoDB (Mongoose 9 ODM) |
| Auth | Hand-rolled JWT (`jsonwebtoken` + `bcryptjs`), no third-party auth provider |
| Frontend hosting | Vercel (auto-deploys `main`) |
| Backend hosting | Render (auto-deploys `main`) |
| Database hosting | MongoDB Atlas (production) |
| Backend tests | Vitest + Supertest, against an in-memory MongoDB |

No TypeScript, no GraphQL, no ORM beyond Mongoose, no state-management
library (no Redux/Zustand) — plain React state/Context plus `localStorage`
covers everything the frontend needs. This is a deliberate, consistent
choice throughout the codebase: prefer the platform's own tools over
adding a dependency, unless a real need shows up.

---

## 2. Repository layout

```
Twegle-Quiz/
├── backend/                 Express API — see §4
│   ├── src/
│   │   ├── server.js        Entry point: builds the app, wires sockets, connects DB, listens
│   │   ├── app.js           The plain Express app (routes/middleware only) — see §4.1
│   │   ├── config/db.js     MongoDB connection (real URI, or an in-memory fallback for local dev)
│   │   ├── models/          One file per Mongoose schema — see §6
│   │   ├── controllers/     One file per feature's request handlers
│   │   ├── routes/          One file per feature's Express router (wires paths → controllers)
│   │   ├── middleware/      Auth (admin + end-user), rate limiting, request sanitization
│   │   ├── realtime/        Socket.IO handlers, one per real-time game
│   │   ├── utils/           Shared pure-logic helpers (validators, scoring, date-deterministic content)
│   │   └── scripts/         One-off/boot-time scripts (seeding content, admin bootstrap, migrations)
│   ├── tests/                Vitest + Supertest backend test suite — see §8
│   └── vitest.config.js
├── frontend/                 React app — see §5
│   └── src/
│       ├── main.jsx          Entry point
│       ├── App.jsx           Every route, public and admin
│       ├── api.js            Fetch wrappers for the public site's API calls
│       ├── userApi.js        Fetch wrappers for end-user account API calls
│       ├── UserAuthContext.jsx  End-user session state, available app-wide
│       ├── pages/            One file per public route
│       ├── components/       Shared UI pieces (cards, banners, buttons, header/footer)
│       ├── games/            Each game's own board/logic component
│       ├── utils/            Shared frontend logic (streaks, badges, localStorage helpers)
│       └── admin/            The entire admin panel — its own routes, pages, API layer, auth context
└── docs/                     You are here — see §9 for what's in each file
```

---

## 3. How a request flows through the system

**A normal page view (e.g. opening a quiz):**

1. Browser loads the React SPA from Vercel (static build).
2. React Router renders the matching page component (e.g. `Quiz.jsx`).
3. That component calls a function from `frontend/src/api.js` (e.g.
   `fetchQuizBySlug(slug)`), which does a plain `fetch()` to the Render-hosted
   API (`VITE_API_URL`, falling back to `http://localhost:4000/api` locally).
4. Express (`backend/src/app.js`) runs the request through its middleware
   stack (CORS → Helmet security headers → JSON body parsing → NoSQL-injection
   sanitization → route-specific rate limiter, if any), then the matching
   controller.
5. The controller talks to MongoDB via a Mongoose model and returns JSON.
6. React renders the result. No server-side rendering — this is a pure
   client-side SPA. Two things fill the gap that leaves: `sitemapController.js`
   serves a plain XML sitemap for search engines, and `shareController.js`
   serves small server-rendered HTML pages (proper OG/meta tags per item)
   specifically for link-preview crawlers (WhatsApp, social apps) that
   don't execute JavaScript — a shared link points there, then redirects a
   real browser on to the normal SPA page.

**A real-time multiplayer game turn** follows the same path for the
one-time "create/join a game" REST calls, but in-game moves go over a
Socket.IO WebSocket connection instead (see §4.4) — no polling.

---

## 4. Backend architecture

### 4.1 `app.js` vs `server.js`

`app.js` exports `createApp()` — a plain Express app with every route and
middleware wired up, but no database connection, no Socket.IO, and no
`.listen()`. `server.js` is the actual entry point (`npm run dev` /
`npm start`): it calls `createApp()`, wraps it in a plain `http.Server` so
Socket.IO can share the same port, wires up every real-time game's socket
handler, connects to MongoDB, runs a couple of one-time boot tasks (ensure
an admin account exists, a couple of data-cleanup migrations), and only
then starts listening.

This split exists specifically so the test suite (§8) can import
`createApp()` directly and drive it with Supertest, with zero real network
port and zero real database involved.

### 4.2 Routes → Controllers → Models

Every feature follows the same three-file pattern:
- **`routes/xRoutes.js`** — an Express `Router`, mapping HTTP verb + path to
  a controller function. Nothing else lives here.
- **`controllers/xController.js`** — the actual request handling: read
  `req.body`/`req.params`/`req.query`, validate, talk to one or more
  Mongoose models, respond with JSON (or an error status + `{ error }`
  body).
- **`models/X.js`** — a Mongoose schema. Nothing but schema definitions and
  the occasional schema-level default/validator lives here; business logic
  stays in controllers.

Each feature's routes are mounted under its own path prefix in `app.js`
(e.g. `/api/quizzes`, `/api/friendship`, `/api/puzzles`). Admin-only
routes for the same content type get their own separate router, mounted
under `/api/admin/...` and gated by the admin auth middleware — e.g.
`quizRoutes.js` (public) vs `adminQuizRoutes.js` (admin CRUD), both
ultimately reading/writing the same `Quiz` model.

### 4.3 Two separate JWT auth systems

There is no unified "user" concept — **admins** (who manage content) and
**end users** (site visitors with an optional account) are entirely
separate:

| | Admin | End user |
|---|---|---|
| Model | `Admin.js` | `EndUser.js` |
| Login | username/email + password | username + password (no email/phone collected, anywhere, by design) |
| Middleware | `middleware/auth.js`'s `requireAuth` | `middleware/userAuth.js`'s `requireUserAuth` |
| JWT claim | `{ role: ... }` | `{ type: 'user' }` |
| Roles | Superadmin / Editor / Analyst (`requireRole(...)` gates specific actions per route) | none — every account is equal |
| Password reset | normal | no email exists to reset via — a one-time "Recovery Code" shown once at signup is the only way back in |

Both token types are signed with the same `JWT_SECRET`, so each
middleware explicitly checks its own expected claim shape (`role` vs
`type: 'user'`) — this is what stops an admin token from being replayed
against a user-only route, or vice versa.

A third, much lighter mechanism — **preview tokens**
(`utils/previewToken.js`) — lets an admin share a link to unpublished/
scheduled content without a real login, by embedding a short-lived signed
token in the URL's query string. Unrelated to either JWT system above.

### 4.4 Real-time multiplayer games

Every real-time feature — Tic-Tac-Toe, Connect Four, Chess, Ludo, Snake &
Ladder, live Quiz Battle, and the Skydrift Isles social space — has its
own `realtime/xSocket.js` handler. MongoDB is still the source of truth
for game state, not the socket connection itself: a socket handler
reads/writes the same Mongoose model (`ConnectFourGame.js`, etc.) a REST
controller would.
Creating/joining a game is a plain REST call (so a shareable room-code
link works even before a socket connects); moves after that go over the
socket, broadcast to the room. Every game independently generates its own
short shareable room code the same way (`crypto.randomBytes(6).toString
('base64url')`, retried on collision) — a deliberately repeated pattern
rather than a shared helper, matching how each game controller otherwise
stays self-contained.

### 4.5 Cross-cutting middleware (`app.js`, applied to every/most requests)

- **`cors`** — locked to `CORS_ORIGIN` in production, open (`*`) by
  default for local dev.
- **`helmet`** — standard security headers.
- **`express.json({ limit: '100kb' })`** — parses request bodies, caps
  size.
- **`sanitizeBody`** (`middleware/sanitize.js`) — strips anything that
  looks like a NoSQL-injection attempt (e.g. a `$where` operator smuggled
  into a field that's supposed to be a plain string) from every request
  body.
- **`middleware/rateLimiters.js`** — per-route limiters (login, signup,
  quiz plays, friendship-quiz instance creation, feedback, etc.), each
  tuned to that endpoint's realistic abuse risk, not a single blanket
  limit.

### 4.6 Content lifecycle (Quiz/Post/Puzzle/Story/FriendshipQuiz all follow this)

Every admin-authored content type shares the same `status: 'draft' |
'published'` field, plus an optional `publishAt` date for scheduled
publishing — a published item with a future `publishAt` still doesn't
show up in the public API until that time passes. All of it defaults to
`language: 'en' | 'hi'`, since every content type is written natively in
both languages (never machine-translated) — see `docs/FRONTEND.md` for
the Hindi-localization work and its current known gaps.

---

## 5. Frontend architecture

### 5.1 Routing and the two "apps" in one

`App.jsx` defines two route trees under one React Router instance: every
public page (`/`, `/quiz/:slug`, `/games/:slug`, ...) and the entire admin
panel under `/admin/...`, gated by `admin/ProtectedRoute.jsx`. They share
almost nothing — separate auth contexts (`UserAuthContext.jsx` for public
end-user sessions vs `admin/AuthContext.jsx` for admin sessions), separate
API wrapper files (`api.js`/`userApi.js` vs `admin/adminApi.js`), separate
localStorage keys for their sessions (`userSession` vs `adminSession`).

### 5.2 State management: Context + localStorage, no global store

- **`UserAuthContext.jsx`** wraps the whole public app and exposes the
  current end-user session (or `null` for a guest) plus
  `login`/`signup`/`logout`. Every other feature's state is local to the
  page/component that needs it — there's no app-wide store.
- **`localStorage`** is where anonymous (and cached logged-in) progress
  lives: quiz/puzzle daily streaks (`utils/dailyQuiz.js`), badge/points
  progress (`utils/badges.js`), a rolling daily-activity log for the
  "Twegle Wrapped" recap (`utils/weeklyRecap.js`). For a logged-in
  visitor, this local data is periodically synced to their account
  server-side (`utils/statsSync.js`) and namespaced per-account
  (`utils/accountScope.js`) so two different accounts used on the same
  browser can't cross-contaminate each other's numbers.

### 5.3 The "deterministic by date, no cron job" pattern

Several features pick "today's" content purely by computing a date-derived
index client-side — no scheduled job, no server state:
- **Quiz/Puzzle of the Day** (`utils/dailyQuiz.js`) — day-of-year modulo
  the content list's length.
- **Horoscope** (`backend/src/utils/horoscope.js`) — same idea,
  server-side, combining a per-sign trait with a per-period action.
- **Festive banner** (`utils/festiveBanner.js`) — a fixed lunar/solar
  festival calendar checked against today's date, rather than a rotation.

All three are just pure functions of `new Date()` — reloading the page
never shows different "today" content, and nothing needs to run
overnight to make the date change take effect.

### 5.4 Translation pattern

There's no i18n library. Content items (`Quiz`, `Post`, etc.) each carry
their own `language` field and are written natively per-language by
admins. UI chrome (button labels, category names, badges) that isn't
tied to a specific content item uses small shared `{en, hi}` lookup
helpers — `utils/ctaLabels.js`'s `ctaLabel()`/`pickLabel()`, and a local
`pick()` helper in `Home.jsx` — keyed off whichever `language` value is
in scope (either the page's own URL param, or the specific item's own
`.language` field). There's currently no *global* language preference —
seeing the whole site consistently in Hindi means the browser/page
happens to have that context available; some chrome (header, footer,
search) doesn't yet, and is a known, tracked gap — see
`docs/PENDING_TASKS.md`.

### 5.5 Admin panel

A conventional CRUD admin: a paginated list page + a create/edit form
page per content type, all behind `requireAuth/requireRole`-protected
API routes. `admin/adminApi.js` is a thin fetch wrapper mirroring the
public `api.js`'s pattern, always attaching the admin JWT.

---

## 6. Data model map

Grouped by domain — see each model file's own comments for full field
detail.

**Content (admin-authored, `status`/`language`/`publishAt` on all of them)**
`Quiz`, `Post`, `Puzzle`, `Story`, `FriendshipQuiz`

**Content engagement/analytics**
`PlaySession` (quiz play + result), `PostEngagement`, `Engagement`
(generic view/share counters), `Reaction`, `Feedback`

**Two-person features** (each with its own session model, despite similar
shapes — see `docs/BACKEND.md`'s Compatibility entry for why they aren't
unified)
`QuizCompare`, `FriendshipInstance` + `FriendshipAttempt` (guess mode),
`CompatibilitySession` (compatibility mode)

**Accounts**
`Admin` (role: Superadmin/Editor), `EndUser` (optional public account —
username/password/recovery-code hashes, stats, referral fields; no
email/phone field exists anywhere on this model, by design)

**Real-time games**
`TicTacToeGame`, `ConnectFourGame`, `ChessGame`, `LudoGame`,
`SnakeLadderGame`, `QuizBattleGame`, `SkydriftIsland`, plus `GameScore`/
`GameSession` for leaderboards

**Ops**
`ActivityLog` (admin audit trail)

---

## 7. Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `MONGODB_URI` | backend | Real MongoDB (Atlas in production). If unset, `config/db.js` falls back to a local, file-backed in-memory MongoDB for development only — **never** unset in production. |
| `JWT_SECRET` | backend | Signs both admin and end-user tokens. |
| `PORT` | backend | Defaults to 4000. |
| `CORS_ORIGIN` | backend | Locks down which origin may call the API; defaults to `*` for local dev. |
| `FRONTEND_URL` | backend | Used to build absolute links (sitemap URLs, share-preview pages). Defaults to `http://localhost:5173`. |
| `SEED_ADMIN_*` | backend | Bootstraps the first admin account on boot if none exists. |
| `VITE_API_URL` | frontend | Base URL the frontend's `fetch()` calls target, e.g. `https://api.twegle.in/api` in production. Defaults to `http://localhost:4000/api` for local dev. |

Backend tests (§8) deliberately never read any of these from a real
`.env` — they set their own fixed `JWT_SECRET` and always use a
throwaway in-memory database, so a test run can never touch real
credentials or data.

---

## 8. Testing

`backend/tests/` — Vitest + Supertest, run with `npm test` from
`backend/`. Every test drives `createApp()` (§4.1) directly against a
fresh in-memory MongoDB (`mongodb-memory-server`) that's created before
the run and destroyed after — it can never touch the real local dev
database or production. Covers the login/signup flow, the public
quiz-taking flow, and the full Friendship Quiz guess-and-score flow.
There is no frontend test suite yet — a browser end-to-end suite is a
tracked backlog item (`docs/PENDING_TASKS.md`).

---

## 9. Where to go next

This document explains the *shape* of the system. For everything else:

- **`docs/PENDING_TASKS.md`** — the living backlog and changelog. Every
  shipped feature, bug fix, and decision has a dated entry here, including
  the *why*, not just the *what*. This is usually the most up-to-date doc
  in the repo — check here first for "has X already been done?"
- **`docs/BACKEND.md`** — a running log of every backend feature/decision
  in detail, in the order they were built.
- **`docs/FRONTEND.md`** — the frontend equivalent.
- **`docs/HOW_TWEGLE_WORKS.md`** — a plain-language explainer of what the
  site does and how, written for a non-engineer (useful for the "why does
  this feature exist" question, not "how is it coded").
- **`docs/APPLICATION_FLOW.md`** — walks through specific user journeys
  end to end (e.g. "a visitor takes a quiz," "two friends play a
  compatibility quiz").
- **`docs/ORIGINAL_PLAN.md`** — the original project plan/pitch this was
  built from. Mostly of historical interest at this point — check
  `PENDING_TASKS.md` for current status instead.

When in doubt: `PENDING_TASKS.md` for "what's the current state of X,"
this document for "how does the system fit together," `BACKEND.md`/
`FRONTEND.md` for "why was X built this specific way."
