# Backend — What's Been Built

**Status:** Working, tested end-to-end (auth, roles, quiz CRUD, public API, analytics, security hardening)

## How to run it

```bash
cd backend
npm install
npm run start      # or: npm run dev (auto-restarts on file changes)
```

Runs on `http://localhost:4000` by default.

### First-time setup

Copy `.env.example` to `.env` and fill in real values before deploying anywhere public. For local development, this repo already has a working `.env` with a random `JWT_SECRET` and a `SEED_ADMIN_*` block.

**The first Super Admin is created automatically.** On boot, if no admin accounts exist yet and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set in `.env`, the server creates that account as `superadmin`. This means:
- Locally, it "just works" — the seeded admin already exists after `npm run start`.
- On a real deployment (Render, Railway, etc.) where you can't easily run a one-off script, set those env vars once, boot the server, then you can remove them (they're only used when zero admins exist).
- Alternatively, `npm run seed:admin -- "Your Name" you@example.com "a-strong-password"` does the same thing as a one-off command, if you have shell access to wherever it's running.

## Database

Locally, this project uses the **MongoDB you already have installed and running** (Windows service, `127.0.0.1:27017`) — set in `.env` as `MONGODB_URI=mongodb://127.0.0.1:27017/twegle-quiz-dev`. This is a real, persistent database: data survives server restarts normally.

**For a real deployment** (once the site goes live), replace that with a MongoDB Atlas connection string (see "Non-Technical Tasks" in `ORIGINAL_PLAN.md`) — a local Windows machine isn't reachable by the internet, so production needs a cloud-hosted database.

**If `MONGODB_URI` is left blank**, the server falls back to a temporary in-memory MongoDB so it still runs without any setup — but that fallback does not reliably persist data across restarts (see the note below), so the real local MongoDB is the better option whenever it's available, which it now is.

**Fixing live production content directly — use the admin panel/API, not a local script (learned the hard way, 2026-08-09):** local `.env`'s `MONGODB_URI` points at the local dev database above, completely separate from the real production Atlas cluster — a one-off Node script run locally against `.env` will silently touch dev data only, never production, with no error to indicate the mismatch. Pointing a local script at the *real* Atlas connection string instead (from `credentials.txt`) also isn't reliable from this dev machine: the ISP's default DNS resolver doesn't support the `SRV`/`TXT` lookups `mongodb+srv://` needs (fails with `ECONNREFUSED` on `querySrv`), and even forcing Google's DNS (`dns.setServers(['8.8.8.8'])`) to get past that, the connection then fails authentication for reasons not fully diagnosed. The reliable path that actually works: log into the live admin panel (`/admin/login`, credentials in `credentials.txt`) and either use the UI directly, or — for a bulk change across many documents — pull the JWT out of `localStorage.getItem('adminSession')` in the browser console and drive `fetch()` calls straight at `https://twegle-quiz.onrender.com/api/admin/...` (the real deployed API, already reachable and authenticated), which is both faster than clicking through many edit forms and confirmed reliable.

## How auth and roles work

1. `POST /api/auth/login` — email + password, returns a JWT valid for 12 hours.
2. Every admin-only route requires `Authorization: Bearer <token>`.
3. Three roles, enforced by middleware (`src/middleware/auth.js`):
   - **superadmin** — everything, including creating/deleting other admin accounts (`/api/admins`).
   - **editor** — can create/edit/delete/publish quizzes, cannot manage admin accounts.
   - **analyst** — read-only: can view quizzes and analytics, cannot create/edit/delete anything.
4. Tested directly with real HTTP requests: login, viewing as analyst (allowed), creating a quiz as analyst (blocked, 403), managing admins as analyst (blocked, 403), and missing/invalid tokens (401).

End users (quiz takers) never *have to* authenticate — every feature works fully as a guest, see the "Access Model" in `ORIGINAL_PLAN.md`. They can optionally create an account (see below); this is entirely separate from admin auth.

## End-user accounts (optional, no email/phone collected)

Regular visitors can optionally sign up for an account at `/signup` to keep a persistent "Gamer Tag" — no feature on the site is gated behind this. By design, **no email address or phone number is ever collected**, to avoid holding anything personally identifying.

- **Model** (`src/models/EndUser.js`): `username` (unique, lowercase, 3-20 chars, letters/numbers/underscore only — `isValidUsername` in `src/utils/validators.js`), `passwordHash`, `recoveryCodeHash`, `displayName` (the public "Gamer Tag", 1-30 chars, freely changeable, unrelated to the username), `avatar` (nullable — one of 28 fixed preset emoji, `AVATAR_OPTIONS` in `src/utils/validators.js` (grown from 14 to 28 on 2026-08-10, adding a "cute" batch and a "gamer" batch on direct request); falls back to the Gamer Tag's initial letter on the frontend until one is chosen), `stats` (`Mixed`, default `{}` — the synced daily-streak/badge-progress blob, see below). Deliberately a fixed emoji preset rather than image uploads, so no file storage was ever needed for this.
- **No password-reset email exists**, since there's no email on file. Instead, a one-time **Recovery Code** (format `TWEGLE-XXXX-XXXX`, generated via `crypto.randomInt` over an alphabet that excludes visually-ambiguous characters `0/O/1/I/L`) is shown to the user exactly once at signup, and again every time it's used to reset a password or explicitly regenerated — each use rotates a brand-new code, invalidating the old one immediately. Only the bcrypt hash of the code is ever stored, same as the password, so a database leak doesn't expose a usable code. If both the password and the current recovery code are lost, the account cannot be recovered — this is stated plainly to the user.
- **Controller** (`src/controllers/endUserAuthController.js`): `signup`, `login`, `resetPassword`, `me`, `updateProfile`, `regenerateRecoveryCode` — all using the same generic-error-message convention as admin auth (e.g. "Invalid username or password", never leaking which field was wrong).
- **JWT isolation**: end-user tokens share the same `JWT_SECRET` as admin tokens (no new env var needed) but carry a `{ id, type: 'user' }` payload, versus admin's `{ id, role, name }`. `requireUserAuth` (`src/middleware/userAuth.js`) explicitly checks `payload.type === 'user'` before accepting a token, so an admin token can never be replayed against a user route, or vice versa.
- **Routes** (`src/routes/endUserAuthRoutes.js`), mounted at `/api/users`: `POST /signup`, `POST /login`, `POST /reset-password`, `GET /me` (auth required), `PATCH /me` (auth required, updates `displayName` and/or `avatar` — either field is optional per request, but `avatar` is server-validated against the fixed preset list regardless of what the client sends, so a tampered request can't set an arbitrary emoji), `POST /me/regenerate-recovery-code` (auth required), `GET /me/stats` (auth required, returns `{ stats }`), `PUT /me/stats` (auth required, overwrites `stats` wholesale — capped at 10KB of JSON to guard against abuse; no other validation, since these are just display counters with no cross-user meaning). `/login` and `/signup` each have their own rate limiter (`userLoginLimiter`/`userSignupLimiter` in `src/middleware/rateLimiters.js`, 10 attempts/15 min, separate buckets from admin's `loginLimiter`).
- **Cross-device stats sync (2026-08-07)**: the daily streak and achievement badges were originally left entirely anonymous/localStorage-only (see `FRONTEND.md`'s "Achievement badges" and "Daily streak" sections) — deliberately out of scope for the original account build, since merging local progress into server-side stats without a conflict story was real work on its own. Built once a real account existed to attach it to and the gap was reported directly (same account showing a different streak/badge count on a phone vs. a desktop). The server side here is intentionally dumb — it just stores and returns whatever blob the client sends, since **all the merge logic lives client-side** in `frontend/src/utils/statsSync.js` (take the max of every counter, union every set, prefer whichever entry has the more recent `lastDate` per streak) — see `FRONTEND.md` for the full mechanism. Game leaderboard nicknames were never a separate localStorage stat to migrate — `GameLeaderboard.jsx` already reads the account's `displayName` directly when logged in, so there was nothing to sync there.
- **Streak split (2026-08-09)**: the synced `stats` blob's single `streak` field became two independent fields, `quizStreak`/`puzzleStreak`, after direct feedback that one shared counter for two different daily activities was confusing (see `FRONTEND.md`). The field is still just `Mixed`/opaque here — no schema change needed. Accounts synced before the split simply have the old `streak` field sitting unused in their stored blob; both `leaderboardController.js` and the frontend's `statsSync.js` read it as that account's legacy Quiz streak so nobody's progress was lost, and it's naturally superseded the next time that account syncs.

### Admin moderation of end-user accounts

Admins previously had zero visibility into `EndUser` accounts — no list, no way to disable a problem account, even though Super/Editor/Analyst could already manage each other via `/admin/admins`. Added a read-only-by-default admin list with a moderation action, mirroring the Puzzle/Story admin-content pattern rather than the stricter superadmin-only `Admins` page (moderating a visitor account is judged closer in sensitivity to moderating content than to managing elevated admin accounts).

- **`status` field** on `EndUser` (`'active'` / `'disabled'`, default `'active'`) — a reversible moderation flag, not a delete. A disabled account can't log in (`endUserAuthController.js`'s `login` checks it) and, importantly, **can't keep using an already-issued token either**: `requireUserAuth` (`middleware/userAuth.js`) now does one extra DB lookup per request to check the live `status`, since tokens last 30 days and a disable that only blocked future logins wouldn't actually stop someone already signed in until their token happened to expire on its own.
- **`adminEndUserController.js`**/**`adminEndUserRoutes.js`**, mounted at `/api/admin/end-users`: `listEndUsersAdmin` (paginated, search by username/Gamer Tag, selects only `username displayName avatar status createdAt` — `passwordHash`/`recoveryCodeHash` never leave the server, same trust boundary as `listAdmins`'s `.select('-passwordHash')`), `updateEndUserStatus` (toggles `active`/`disabled`, logged to `ActivityLog` as `resourceType: 'endUser'`), `deleteEndUser` (hard delete, frees the username). Read access is `requireRole('superadmin', 'editor', 'analyst')`; the two write actions are `requireRole('superadmin', 'editor')` — the same read/write split every other content type already uses.
- **Frontend**: `EndUserList.jsx` (new admin page, `/admin/end-users`) — search box, list with a "Disabled" badge, Disable/Re-enable and Delete buttons (write actions hidden for Analyst). Nav item added between Feedback and Admins in `AdminLayout.jsx`.
- **Found and fixed in the same pass**: `feedbackController.js`'s `submitFeedback` had a hardcoded `contentType` whitelist (`['quiz', 'post', 'story']`) that was never updated when Puzzle was added to the `Feedback` model's enum — meaning the Report button silently 400'd on every puzzle page since Puzzles shipped. Also added the missing `puzzle`/`endUser` entries to `RESOURCE_LABELS` in `Activity.jsx`/`Dashboard.jsx` (previously fell back to the raw lowercase `resourceType` string).

### Admin-generated recovery code (2026-08-10)

A fallback for when a user can't use the self-service recovery flow above at all — lost the code, never wrote it down — and there's still no email/phone on file to recover it another way. From `EndUserList.jsx`, superadmin/editor can generate a fresh code for any account.

- **`EndUser.recoveryCodeExpiresAt`** (nullable `Date`) — the one schema addition this needed. `null` for a normal self-issued code (set at signup, or after a successful reset — permanent, same as before). Only set when an *admin* generates one: 10 minutes from issuance, since that code is about to be pasted into WhatsApp/email, channels this server has no control over — long enough for the message to actually reach someone, short enough that an old copy sitting in a chat isn't a standing way into the account.
- **`generateRecoveryCode`** in `endUserAuthController.js` is now exported (previously private) so `adminEndUserController.js`'s own `generateRecoveryCode` (the admin action) produces a code in the exact same `TWEGLE-XXXX-XXXX` format via the same alphabet, not a second scheme. `resetPassword` gained one more check alongside the existing hash comparison: if `recoveryCodeExpiresAt` is set and in the past, reject with a clear "expired, ask an admin for a new one" error rather than the generic invalid-code message — and a successful reset now also clears `recoveryCodeExpiresAt` back to `null`, since the fresh code it issues is a normal permanent one, not another timed one.
- **`POST /api/admin/end-users/:id/recovery-code`** (`requireRole('superadmin', 'editor')`, same write gate as status/delete) — overwrites (invalidates) whatever code the account already had, admin- or self-issued, and returns the plaintext code exactly once in the response, same one-time-visibility rule the self-service flow already follows. Logged to `ActivityLog` as `resourceType: 'endUser'`, `action: 'update'`.
- **Real pre-existing bug caught and fixed in the same pass**: `ActivityLog`'s `resourceType` enum was `['quiz', 'post', 'friendshipQuiz', 'story']` — it never actually included `'endUser'` or `'puzzle'`, even though `adminEndUserController.js`'s existing `updateEndUserStatus`/`deleteEndUser` (and puzzle content elsewhere) had been logging with those values since they were built. Since `logActivity()` swallows all errors (`console.error` only), every one of those calls was silently failing Mongoose enum validation and never actually writing a document — the Activity Log page simply had no record of any end-user moderation action ever happening. Fixed by extending the enum rather than working around it only for this new feature.

## API summary

**Public (no auth) — used by the end-user-facing site:**
- `GET /api/quizzes?language=en|hi&category=beauty|entertainment|kpop|lifestyle|fun` — list published quizzes, both filters optional; each result includes `totalPlays` (aggregated from `PlaySession`, used for the engagement badge — see `FRONTEND.md`'s "Visual polish") and `createdAt` (used for the homepage's "Newest" sort). (A `questionCount` field briefly existed here 2026-08-06 for a card-level "~2 min" time estimate; removed the same day — see `FRONTEND.md`'s "Engagement badges" entry — since combined with the engagement badge it was pushing the card's button row onto a second line on narrow tiles.)
- `GET /api/quizzes/:slug` — get one published quiz (questions, options, results)
- `POST /api/quizzes/:slug/plays` — record an anonymous completion (`resultKey`, `anonymousId` — no personal data)
- `GET /api/posts?category=joke|funny-line|quote|motivational-quote&language=en|hi` — list published posts, both filters optional; each result includes `totalEngagement` (aggregated view+share count from `PostEngagement`, used for the homepage's "Trending" sort — see "Trending/Newest sort" below)
- `GET /api/posts/:id` — get one published post
- `POST /api/posts/:id/engagement` — record an anonymous "view" or "share" event (`{ action: 'view'|'share', anonymousId }`), mirrors quiz play-tracking. Rate-limited (60/15min per IP) the same way play-recording is.
- `GET /api/stories?language=en|hi&category=horror|comedy|romance|mystery|moral|motivational` — list published stories, both filters optional. Excludes `body` (the full story text) to keep the list payload small — see `getStoryBySlug` for the full read. Each result also includes `totalEngagement` (aggregated view+share count from `Engagement`, used for the homepage's "Trending" sort).
- `GET /api/stories/:slug` — get one published story (title, category, full `body` text — this is exactly what the frontend's "Listen to this story" button reads aloud via the browser's Web Speech API, no server-side TTS involved)
- `GET /api/horoscope/signs?language=en|hi` — the fixed 12-sign picker list (key, localized name, emoji, date range, gradient) — static reference data, not a database query. See "Horoscope" below.
- `GET /api/horoscope/:sign?period=day|week|month|year&language=en|hi` — a computed horoscope for that sign/period/language, deterministic by date (same request on the same day always returns the same text). 404 if `:sign` isn't one of the 12 known keys.
- `GET /api/share/quiz/:slug`, `GET /api/share/quiz/:slug/:resultKey`, `GET /api/share/game/:slug`, `GET /api/share/friendship-quiz/:slug`, `GET /api/share/post/:id`, `GET /api/share/story/:slug`, `GET /api/share/horoscope/:sign`, `GET /api/share/friendship/:code`, `GET /api/share/friendship-result/:id`, `GET /api/share/quiz-compare/:code` — **not for the frontend to call** — these are what the "Copy link"/WhatsApp buttons actually point at. They return static HTML with real `og:title`/`og:description` for link-preview crawlers (which don't run JavaScript), then instantly redirect a real browser to the actual React page. See "Link previews" below.
- `POST /api/feedback` — anyone submits `{ message, email? }` (email optional), plus optional `{ contentType, contentId, contentLabel, reason }` when this submission is a 🚩 report on a specific quiz/post/story rather than general feedback. Rate-limited (10/15min per IP, stricter than the general analytics endpoints since a public free-text form is a more obvious spam target). See "Feedback" and "Report a quiz/post" below.
- `POST /api/tictactoe`, `GET /api/tictactoe/:code`, `POST /api/tictactoe/:code/join`, `POST /api/tictactoe/:code/move` — a real two-player async Tic-Tac-Toe match (distinct from the single-player-vs-AI game under `/api/games/*`). See "Two-player Tic-Tac-Toe" below.
- `POST /api/connect-four`, `GET /api/connect-four/:code`, `POST /api/connect-four/:code/join` — creates/fetches/joins a real-time Connect Four match. **No REST move endpoint** — dropping a disc happens over a socket.io connection instead. See "Live two-player Connect Four" below.
- `POST /api/ludo`, `GET /api/ludo/:code`, `POST /api/ludo/:code/join` — creates/fetches/joins a real-time Ludo match (`{ name, maxPlayers }` on create, `maxPlayers` one of 2/3/4). **No REST roll/move/start endpoint** — those all happen over a socket.io connection. See "Live 2-4 player Ludo" below.
- `GET /sitemap.xml` — **not under `/api`, and not for the frontend to call.** Generated straight from the database (all published quizzes, posts, and friendship-quiz templates plus static pages), pointed at `FRONTEND_URL`. See "SEO" below.
- `GET /api/friendship/quizzes?language=en|hi` — list published friendship-quiz templates; each result includes `totalAttempts` (how many friends have guessed), `questionCount`, and `createdAt` (used for the homepage's "Newest" sort)
- `GET /api/friendship/quizzes/:slug` — get one published template's full questions (for the person filling in their own answers)
- `POST /api/friendship/quizzes/:slug/instances` — create a shareable instance: `{ subjectName, answers: [optionIndex, ...] }` → returns `{ code }`. Rate-limited like plays/engagement.
- `GET /api/friendship/instances/:code` — get a shareable instance's questions for a friend to guess — **deliberately omits the real answers**
- `POST /api/friendship/instances/:code/attempts` — a friend submits their guesses: `{ guesserName, guesses: [optionIndex, ...], anonymousId }` → returns the scored, revealed result. Rate-limited like plays/engagement.
- `GET /api/friendship/attempts/:id` — re-fetch a past attempt's scored result (for page refresh or revisiting a shared result link)
- `POST /api/quizzes/:slug/compare` — after seeing their own result, a player creates a "compare with a friend" link: `{ name, resultKey }` → returns `{ code }`. Rate-limited like plays/engagement.
- `GET /api/quizzes/:slug/compare/:code` — fetch a compare session's state; before a friend has played, includes only the first player's name/result (so the invite page can show "X got this result!" without exposing anything sensitive); once a friend has played, includes both players' results and a computed `match` boolean.
- `POST /api/quizzes/:slug/compare/:code/join` — a friend submits their own result: `{ name, resultKey }` → returns the full side-by-side comparison. If the link was already used, returns the existing comparison unchanged rather than erroring (safe for double-submits or a third person opening an old link).
- `GET /api/search?q=&language=en|hi` — searches published quizzes, posts, stories, and friendship-quiz templates by title/description/text/author/body in one call, returning up to 8 of each type tagged with a `type` field (`quiz`/`friendship`/`story`/`post`). Requires at least 2 characters (returns `{ results: [] }` below that rather than scanning on every keystroke).
- `GET /api/games/counts` — anonymous play counts per game slug (e.g. `{ "tic-tac-toe": 42 }`), used for the "N played" badge on game cards.
- `POST /api/games/:slug/plays` — record an anonymous game result (`{ outcome: 'win'|'loss'|'draw', anonymousId }`). `slug` is checked against a small backend allowlist (`GAME_SLUGS` in `gameController.js`, eleven entries including `connect-four`/`chess`/`simon-says`/`whack-a-mole`) since games aren't database-backed content. Rate-limited like plays/engagement. **Bug fixed 2026-08-12:** `connect-four` was missing from this allowlist entirely (Connect Four launched friend-only, so single-player play-recording was never exercised) — since `engagementController.js` also checks a game's slug against this same list for view/share tracking, Connect Four's page views had been silently 404ing since it shipped. Caught while adding single-player Connect Four (see `FRONTEND.md`), fixed by adding the one missing entry.
- `GET /api/leaderboard/levels` — top 100 accounts by computed Achievement-level points. See "Achievement levels + global leaderboard" below.
- `POST /api/engagement` — record an anonymous "view" or "share" event for a quiz, friendship quiz, game, or story (`{ contentType: 'quiz'|'friendshipQuiz'|'game'|'story', contentId, action: 'view'|'share', anonymousId }`) — the same view/share tracking Post already had via `PostEngagement`, extended to the other four content types. Rate-limited (60/15min per IP) the same way post-engagement recording is. See "Unified view/share engagement tracking" below.

**Admin (auth required):**
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/admin/quizzes`, `GET/PUT/DELETE /api/admin/quizzes/:id` — role-gated as above. `GET` accepts optional `?search=&category=&language=&status=` query params (search matches quiz title, case-insensitive) so the admin panel's list can be filtered instead of always showing everything, plus `?page=&limit=` for pagination (see "Admin list pagination" below). `POST`/`PUT` accept an optional `publishAt` (ISO date string or `null`) for scheduled publishing — see "Scheduled publishing" below. Creating, editing, and deleting are all recorded in the activity log automatically.
- `GET/POST /api/admin/posts`, `GET/PUT/DELETE /api/admin/posts/:id` — same role rules as quizzes (analyst read-only, editor/superadmin can write). `GET` accepts the same kind of `?search=&category=&language=&status=&page=&limit=` params (search matches post text or author). Same `publishAt` and activity-logging support as quizzes.
- `GET/POST /api/admin/stories`, `GET/PUT/DELETE /api/admin/stories/:id` — same role rules as quizzes/posts. `GET` accepts `?search=&category=&language=&status=&page=&limit=` (search matches story title) and omits `body` from the list response, same reasoning as the public list endpoint. `slug` is generated once at creation and immutable after, same as `Quiz`. Same `publishAt` and activity-logging support. See "Stories" below.
- `GET /api/admin/quizzes/analytics` — total plays + unique players per quiz
- `GET /api/admin/posts/analytics` — total views + shares per post, same anonymous-tracking pattern as quiz plays (see `PostEngagement` model)
- `GET /api/admin/engagement/:contentType` (`contentType` is `quiz`/`friendshipQuiz`/`game`/`story`) — total views + shares per item of that type, same shape as `/api/admin/posts/analytics` but backed by the shared `Engagement` model. See "Unified view/share engagement tracking" below.
- `GET/POST /api/admin/friendship-quizzes`, `GET/PUT/DELETE /api/admin/friendship-quizzes/:id` — same role rules as quizzes; manages the question *templates* only, not the instances/attempts real visitors generate (those aren't admin-managed content). Same `publishAt` and activity-logging support, plus `?page=&limit=` pagination.
- `GET /api/admin/activity?page=&limit=` — paginated create/update/delete actions across quizzes, posts, stories, puzzles, end-user moderation, and friendship-quiz templates, newest first (same `parsePagination`/`paginationMeta` convention as every other admin list — previously a flat `.limit(200)` with no way to page further back). All roles can view (read-only, like Analytics). See "Activity log" below.
- `GET /api/admin/feedback` — paginated (`?page=&limit=`), newest first, all roles can view. `PUT /api/admin/feedback/:id` (toggle `read`) and `DELETE /api/admin/feedback/:id` are superadmin/editor only, same read-vs-write split as everything else. See "Feedback" below.
- `GET/POST /api/admins`, `DELETE /api/admins/:id` — superadmin only
- `GET /api/admin/preview-link?contentType=&id=` — all roles; mints a 30-minute signed preview token for a specific draft, forwarded to the public page as `?preview=<token>`. See "Draft preview link" below.

## Seeding starter content

- `npm run seed:quizzes` — loads all 25 quizzes: 12 personality-quiz topics × English + Hindi (skincare personality, Bollywood era, aesthetic, procrastination style, chai/coffee order, Korean beauty standard, squishy, blind bag, K-pop idol position, K-pop comeback era, texting personality, monsoon mood), plus 1 English-only right/wrong quiz ("How Well Do You Know Bollywood?") — each tagged with a category (beauty/entertainment/kpop/lifestyle/fun), published and ready to view.
- `npm run seed:posts` — loads posts across Jokes/Funny Lines/Quotes/Motivational Quotes, written natively in English and Hindi (not translated). (Memes were a content type in this seed until 2026-08-06, when they were removed as a category — see `PENDING_TASKS.md`.)
- `npm run seed:friendship-quizzes` — loads 4 friendship-quiz templates (2 English + 2 Hindi): "How Well Does Anyone Know Me?" and "How Well Do You Know My Entertainment Taste?" — a person fills in their own real answers, then friends guess.
- `npm run seed:stories` — loads 8 original short stories (6 English across all 6 categories, 2 Hindi — one moral, one motivational). Every story is original writing, not adapted from any existing published work, which sidesteps the copyright question for the story text itself (see "Stories" below).

All four are safe to re-run — quizzes, friendship quizzes, and stories upsert by slug, posts upsert by (text, language), so re-running never duplicates. This is how the "real" content got into the database, as opposed to the admin panel UI (which is how you'd add more from here on).

## Link previews (`/api/share/*`)

Since the frontend is a client-side React app, a WhatsApp/Instagram/Facebook link-preview crawler fetching a shared quiz/post URL would just see the same static `index.html` every time — those crawlers don't execute JavaScript, so they never see the page's real title or description, which is a genuine drag on the sharing loop this whole app depends on.

The fix: `shareController.js` renders a tiny static HTML page per quiz-result/post with real `<meta property="og:title">`/`og:description` tags, then redirects (via `<meta http-equiv="refresh">` **and** a JS `window.location.replace`, so it works either way) straight to the actual React page. Crawlers read the tags and stop there; real visitors bounce through in an instant. The frontend's "Copy link" and WhatsApp share buttons (`getQuizShareUrl`/`getPostShareUrl` in `api.js`) point at these URLs instead of the raw SPA page.

`shareQuizIntro` (`GET /api/share/quiz/:slug`) is the same pattern applied to a quiz that hasn't been played yet — used by the tile-level share button on `QuizCard.jsx` (see `FRONTEND.md`'s "Share before attempting"). It builds its preview from the quiz's own title/emoji/description rather than a specific result, since there's no `resultKey` yet. This coexists safely with the existing `GET /api/share/quiz/:slug/:resultKey` route — Express routes by segment count, so a 2-segment request never matches the 3-segment route and vice versa.

Two more "before attempting" routes exist for the same reason, one per remaining content type that a tile can share:

- **`shareGameIntro`** (`GET /api/share/game/:slug`) — games have no database row to read a title/description from (see "Games" below), so this reads from a small hardcoded `GAME_META` map inside `shareController.js` instead, kept manually in sync with `frontend/src/games/registry.js` (the same kind of duplication `GAME_SLUGS` already accepts for play-tracking).
- **`shareFriendshipQuizIntro`** (`GET /api/share/friendship-quiz/:slug`) — unlike a game, a `FriendshipQuiz` *is* a real database document, so this queries it directly, exactly like `shareQuizIntro` does for `Quiz`. Shares the template itself (before anyone's filled in answers), distinct from the existing `GET /api/share/friendship/:code` (a specific answered instance) and `GET /api/share/friendship-result/:id` (a specific friend's scored guess) routes.

Requires **`FRONTEND_URL`** in `.env` (the deployed frontend's public URL) so the redirect target is correct — defaults to `http://localhost:5173` for local dev.

## SEO (`GET /sitemap.xml`)

A different problem from link previews above: Google's crawler *does* run JavaScript and reads the final rendered page, so per-page `<title>`/meta description (handled entirely on the frontend, see `FRONTEND.md`) genuinely helps search results. What Google can't easily do on its own is *discover* every quiz/post/friendship-quiz URL in a client-side app just by crawling links — a sitemap solves that directly.

`sitemapController.js` builds `sitemap.xml` from the database on every request (not a static file, so it can never go stale as content is published) — every published quiz, post, and friendship-quiz template, plus the static pages (home, about, privacy, terms, browse categories), all pointed at `FRONTEND_URL`. It's mounted at the API's own root (`GET /sitemap.xml`, not under `/api`) since that's the conventional path search engines look for.

**One real deployment step this creates:** once the frontend and backend live on separate real domains (Vercel + Render/Railway, per the plan), search engines expect the sitemap to be served from the *frontend's* domain, not a separate API subdomain — so a one-time hosting-level rewrite rule is needed (e.g. a Vercel rewrite) so `https://<your-frontend-domain>/sitemap.xml` proxies to this endpoint. Not needed for local dev; flagged here so it isn't forgotten at deploy time.

`frontend/public/robots.txt` (a plain static file, not backend-generated) allows all crawlers, blocks `/admin/`, and points to the sitemap — its `Sitemap:` line currently says `https://yourdomain.com/sitemap.xml` as a placeholder, since no real domain is registered yet; update it once one is.

## Public search (`GET /api/search`)

One endpoint, `searchController.js`, searches all three public content types (quizzes, posts, friendship-quiz templates) in parallel and returns a single flat `results` array, each item tagged with a `type` field so the frontend can group them. Same published/scheduled-publishing filter as every other public list endpoint. Reuses the regex-escape pattern already used by the admin search filters (`quizController.js`/`postController.js`'s `listQuizzesAdmin`/`listPostsAdmin`) rather than introducing a new search approach — the only new logic is combining the "published" filter and the "matches this text" filter with `$and` (not by spreading both onto one object, since they'd otherwise collide on the same `$or` key). No rate limiting — same as the other public read-only list endpoints, and query volume here is tiny at current content scale.

## Friendship quizzes ("How well do you know me?")

A two-person mechanic, unlike every other quiz on the site (which is single-player): one person fills in real answers about themselves, then any number of friends can each guess and get scored. Three models work together:

- **`FriendshipQuiz`** — the admin-authored template: just a title and a list of questions, each with 2+ fixed multiple-choice options (plain strings, no "results" concept). Managed exactly like regular quizzes (draft/published, slug, language, gradient) via `/api/admin/friendship-quizzes`.
- **`FriendshipInstance`** — created the moment someone fills in their own answers. Stores which template it's based on, a short random `code` (the thing in the shareable link), a self-chosen `subjectName`, and their answers as option-index arrays. **One instance can be played by many different friends** — the same link can go out to an entire group chat, and each person who opens it gets their own separate attempt and score.
- **`FriendshipAttempt`** — one friend's guesses against an instance, plus the computed `score`. `friendshipQuiz` is denormalized onto this record purely so the public list endpoint can cheaply aggregate "X friends guessed" per template without a join.

The flow: `POST /quizzes/:slug/instances` (subject submits answers, gets a `code`) → the subject shares a link built from that code → each friend calls `GET /instances/:code` (questions only, **answers withheld**) → `POST /instances/:code/attempts` (friend submits guesses, gets back a full scored reveal immediately) → that reveal is also independently re-fetchable via `GET /attempts/:id`, which is what makes the score page itself a real, shareable, refreshable URL (and what `/api/share/friendship-result/:id` points crawlers at).

`code` is generated with `crypto.randomBytes(6).toString('base64url')` (8 URL-safe characters) with a uniqueness retry loop — collision odds are negligible at this scale, but it still checks rather than assuming.

## Compare with a friend (regular quizzes)

Applies the friendship-quiz's viral "share a link, friend plays too" mechanic to the existing single-player personality quizzes, without touching the `Quiz` model at all — regular quiz-taking is still 100% client-side scoring (see `FRONTEND.md`), so this only needed one new model, `QuizCompare`:

- `quiz` (ref), `code` (shareable, same `crypto.randomBytes(6).toString('base64url')` generator as `FriendshipInstance`), `personAName`/`personAResultKey` (set at creation), `personBName`/`personBResultKey` (`null` until a friend finishes).

Unlike friendship quizzes (one answer-key, many guessers), this is strictly **1:1** — the first friend to open the link and finish is the one whose result gets stored; anyone else who opens the same link afterward just sees that same completed comparison (handled in `joinCompareSession`, not an error).

The philosophy is also different from friendship quizzes: there, the first person never gets a personal result at all (they only create an answer key). Here, both people take the *real* quiz normally and each gets their own real personality result — person A already saw theirs on the normal Result page before ever generating a compare link, and a friend opening the invite link is never shown person A's result until after they've finished playing themselves (the `GET /compare/:code` response omits person B's fields — and by extension the match outcome — until `personBResultKey` is set), so the friend can't be biased into copying an answer.

## Non-personality (right/wrong) quizzes

Every quiz until now was "personality" shaped: each answer option maps to a result *key*, and whichever key gets the most votes across all questions wins. `Quiz.type` (`'personality'` default, or `'trivia'` — an internal code label, never shown to a user; user-facing text always says "right/wrong quiz") adds a second shape — right/wrong questions scored numerically — **without a parallel model or a second quiz-taking flow**, by reusing the exact same data shapes with a different convention:

- **Options** still just have a `result` string (unchanged schema) — for a right/wrong quiz, the *only* two values that mean anything are the literal strings `'correct'` and `'incorrect'`, instead of a personality key. This means the frontend's existing per-option tally (`scores[option.result]++`, see `FRONTEND.md`) already produces the right numeric score with zero new tallying logic — `scores.correct` just *is* the count of right answers.
- **Results** gained two new optional fields, `minScore`/`maxScore` (both `Number`, default `null`) — for a right/wrong quiz, the result whose range contains the final score is the one shown, instead of whichever key got the most tallied votes. `key` is still required and still becomes part of the shareable result URL, exactly like a personality quiz.
- `validateQuizPayload` (`utils/validators.js`) branches on `type`: a right/wrong quiz requires every result to have numeric `minScore`/`maxScore`, and at least one question to have an option marked `'correct'` (otherwise the quiz is unwinnable by construction).

One seeded example: `bollywood-trivia` ("How Well Do You Know Bollywood?") — 5 factual questions, 3 score tiers (0-1, 2-3, 4-5 correct).

## Games

Unlike Quiz/Post/FriendshipQuiz, a game has no admin-authored data to store — the game itself is code, not content someone types into a form. So there's no `Game` model and no admin CRUD; the backend's only job is anonymous play-count analytics, mirroring `PlaySession`/`recordPlay` exactly but keyed by a plain `gameSlug` string instead of a `Quiz` document reference (`GameSession.js`, `gameController.js`). `GAME_SLUGS` in `gameController.js` is the equivalent of `Quiz`'s category enum — a fixed allowlist a play must match, since there's no database document to look up and validate against. Nine games live today, all played entirely client-side (see `FRONTEND.md`): Tic-Tac-Toe (unbeatable minimax AI), Rock Paper Scissors (uniform-random AI — a single round has no information to exploit, unlike Tic-Tac-Toe's solved state space, so random is the fair baseline), Memory Match, 2048, Word Guess, Guess the Number, Sudoku, Simon Says, and Whack-a-Mole. Every game past the first two is a solo game with no "opponent" in the adversarial sense — they still fit the same `win`/`loss`/`draw` outcome enum (Memory Match and Sudoku only ever report `win`, since neither has a lose condition; Simon Says and Whack-a-Mole are technically endless/timed rather than having a natural win state, so they're each given a milestone score — round 10, 15 moles — to treat as a "win," the same framing 2048 already uses for hitting the 2048 tile). Since games have no database row, the same lack of backend content applies to their share previews too — see `shareGameIntro` and `GAME_META` under "Link previews" above.

## Two-player Tic-Tac-Toe

A real match against a friend — deliberately a separate system from the single-player-vs-AI Tic-Tac-Toe above, not a mode of it. New model, `TicTacToeGame`: `code` (shareable, same `crypto.randomBytes(6).toString('base64url')` generator used throughout the app), `board` (9-element array, `''`/`'X'`/`'O'`), `playerXName`/`playerOName` (`playerOName` null until a friend joins), `currentTurn`, `status` (`'waiting'` → `'in_progress'` → `'finished'`), `winner` (`'X'`/`'O'`/`'draw'`/null).

- **No accounts, so no server-side concept of "which browser is X."** The creator is always `X` and always goes first; whoever opens the invite link and fills in the join form becomes `O` — the *frontend* is what remembers which role a given browser is playing (see `FRONTEND.md`).
- **Joining is idempotent**, same reasoning as `QuizCompare`'s join: once `playerOName` is set, a repeat `POST /:code/join` just returns the current state instead of erroring or overwriting the real second player (protects against double-submits or a third person opening an already-used link).
- **Live, not async** — this used to poll `GET /:code` every 4 seconds until Connect Four proved a socket.io layer works end-to-end; `realtime/ticTacToeSocket.js` now mirrors `realtime/connectFourSocket.js` exactly (same `/tic-tac-toe` namespace pattern, same `joinRoom`/move-event/broadcast shape), just for a 9-cell board and X/O instead of a 7-column gravity board and red/yellow. There is deliberately no REST move route anymore — a `makeMove` socket event replaces `POST /:code/move`, and `joinGame` broadcasts over the socket the same way `connectFourController.js`'s `joinGame` does (via `req.app.get('io')`), since the creator's tab is already sitting in the room when a friend joins over REST.
- **Win/draw checking** is a plain 8-line-combination scan against the 3x3 board, run after every move (in the socket handler now, not a controller) — no minimax here, since this isn't an AI opponent to out-think, just a rules check. Server is sole authority on move validation either way — a client's claimed role/turn is never trusted over what's actually saved in Mongo.
- The rate limiter (`ticTacToeLimiter`) is applied to the two remaining write routes (create/join) in `ticTacToeRoutes.js`; there's no per-move REST call to limit anymore, moves go over the socket instead — same reasoning as `connectFourLimiter`.
- **Rematch** — a `rematch` socket event, usable once `status === 'finished'`. Reuses the same code/room (no new link to share) rather than creating a fresh `TicTacToeGame`/`ConnectFourGame` document — resets `board`/`status`/`winner` in place and flips `currentTurn` to whoever lost the last round (a draw keeps the original starter). Either player can trigger it; there's no "does the other player agree" handshake, same trust model as every other action here — the server just re-validates (`status === 'finished'`, valid role) rather than gating behind mutual consent.

## Live two-player Connect Four

Twegle's first genuinely real-time feature — both players' boards update the instant a disc drops, no polling. Everything before this was async or purely request/response; this is the first time the backend holds an open connection to the browser at all. (Tic-Tac-Toe's two-player mode was converted to the same live socket approach right after — see "Two-player Tic-Tac-Toe" above, which now mirrors this design.)

**Design: hybrid REST + socket.io, not a pure in-memory game server.** Room creation/joining still goes through plain REST (`connectFourController.js`, `connectFourRoutes.js`) and a `ConnectFourGame` Mongo document — same shape of pattern as `TicTacToeGame` (`code`, `board`, `playerRedName`/`playerYellowName`, `currentTurn`, `status: waiting|in_progress|finished`, `winner`). Only the actual disc-drop move happens over a socket.io connection instead of a REST call. **Why hybrid:** Mongo stays the single source of truth for the match, so a dropped connection — a phone losing signal, or Render's free tier waking the service back up after 15 minutes idle — never loses the game itself, only the "instant" delivery for however long the socket was down. A reconnecting client just re-fetches/re-joins and gets the real current state pulled from the DB, exactly like a fresh page load would. Pure in-memory room state would lose everything on a server restart or a cold start; this doesn't.

- **Server wiring** (`server.js`): `app` is wrapped in a plain `http.createServer(app)` instead of calling `app.listen()` directly, so a `socket.io` `Server` instance can attach to the same HTTP server/port. Every other route in the app is untouched — still plain Express/REST. The `io` instance is also stashed on `app.set('io', io)` so REST route handlers (specifically `joinGame`) can reach back into it — see below.
- **`realtime/connectFourSocket.js`** registers a `/connect-four` socket.io namespace with two events: `joinRoom { code, role }` (validates the game/role exist, joins a socket.io room named after `code`, sends back the current DB state — covers both a first join and a reconnect resync) and `dropDisc { code, role, column }` (re-validates everything server-side — `status === 'in_progress'`, `role === currentTurn`, column not full — computes the landing row via gravity, checks for a win or a full-board draw, saves to Mongo, then broadcasts the new state to every socket in that room). The server is sole authority on move validation, same trust model as Tic-Tac-Toe's `makeMove` — a client's claimed role is never trusted over what's actually saved in the DB.
- **Board logic** lives in `utils/connectFour.js`, separate from the socket handler: `findLandingRow` (gravity — first empty cell scanning from the bottom of a column), `checkWinner` (checks only the 4 lines running through the *just-placed* disc — horizontal, vertical, both diagonals — rather than rescanning the whole board every move, which is both cheaper and the only way to know which disc's placement caused the win), `isBoardFull` (draw check).
- **Joining still needs a socket broadcast of its own.** Since `POST /:code/join` is REST, not a socket event, the creator's tab (already connected and sitting in the room) would otherwise never find out a friend joined until its next manual reload. `joinGame` in `connectFourController.js` reaches into `req.app.get('io')` after saving and emits `gameState` to the room directly — the one place a REST handler pushes a live update rather than just returning a response.
- No `disconnect` cleanup is needed on the socket handler — the Mongo doc persists regardless of who's connected; the next `joinRoom` on reconnect just re-syncs from it.
- Same rate-limiter shape as Tic-Tac-Toe (`connectFourLimiter`, 120/15min), applied to the two REST write routes (create/join). There's no per-move REST call to limit at all, since moves go over the socket instead.

## Live and single-player Snake and Ladder

Added 2026-08-12, both modes built together from the start (unlike Connect Four, which launched friend-only and got single-player added later). Single-player runs entirely client-side (see `FRONTEND.md`) — the backend's only role in it is none at all. Live 2-player follows the exact same hybrid REST + socket.io design as Connect Four.

- **`SnakeLadderGame` model** — `code`, `playerOneName`/`playerTwoName`, `positions: { one, two }` (0 = not yet started, 100 = won), `currentTurn: 'one'|'two'`, `status: waiting|in_progress|finished`, `winner`, `lastRoll` (purely for the UI, not used in any game-logic decision), and `roundStarter` (same rematch-alternation field Connect Four/Tic-Tac-Toe already have).
- `POST /api/snake-ladder`, `GET /api/snake-ladder/:code`, `POST /api/snake-ladder/:code/join` — mirrors `connectFourController.js`/`connectFourRoutes.js` exactly, including the join controller reaching into `req.app.get('io')` to broadcast the join (same reason: the creator's tab is already connected and would otherwise only find out on a manual reload). Rate-limited with the same shape as `connectFourLimiter` (`snakeLadderLimiter`, 120/15min).
- **`realtime/snakeLadderSocket.js`** registers a `/snake-ladder` namespace: `joinRoom { code, role }` (same as Connect Four), `rollDice { code, role }` (validates turn/status server-side, rolls the die with `crypto.randomInt` — **never trust a client-supplied roll value**, same "server is sole authority" rule every other live move here follows — computes the landing square via `computeLanding`, applies a win if it lands exactly on square 100, otherwise flips the turn, saves, broadcasts), and `rematch` (same pattern as Connect Four/Tic-Tac-Toe: either player can trigger it once finished, resets `positions` to `{ one: 0, two: 0 }` in the same document, and strictly alternates `roundStarter` regardless of who won).
- **`utils/snakeLadder.js`** — `LADDERS`/`SNAKES`/`JUMPS` (a fixed, generic — not copyrighted — numbered board layout), `computeLanding(position, roll)` (a roll overshooting square 100 just doesn't move the token, the classic "exact roll to finish" rule), and `rollDie()` (`crypto.randomInt(1, 7)`, unbiased unlike `Math.random`). Duplicated by hand in `frontend/src/utils/snakeLadderBoard.js` for the client-only single-player mode.
- **Bug avoided proactively:** when Connect Four's single-player mode was added, `'connect-four'` turned out to be missing from `GAME_SLUGS` (`gameController.js`) — which `engagementController.js` also checks — silently breaking its view-tracking since launch. Learned from that: `'snake-ladder'` was added to `GAME_SLUGS` and a `shareSnakeLadder` preview handler (`shareController.js`/`shareRoutes.js`) was built up front this time, not after the fact.

## Live and single-player Chess

Added 2026-08-13, requested 2026-08-11 — by far the biggest game on the site, since chess needs real legal-move generation (check/checkmate/stalemate, castling, en passant, promotion) none of the other games required. Rather than hand-rolling that, `chess.js` (MIT-licensed, the standard well-tested JS rules engine) was added as a dependency and is the sole authority on legality and game-over detection on both ends — this backend never re-implements chess rules itself. Same hybrid REST + socket.io design as Connect Four/Snake and Ladder otherwise.

- **`ChessGame` model** — `code`, `fen` (the board, stored as a FEN string — chess.js's native serialization, so no custom board-array parsing is needed anywhere), `pgn` (kept purely so the frontend can render a "Moves" list; the authoritative state is `fen` alone), `playerWhiteName`/`playerBlackName`, `currentTurn: 'white'|'black'`, `status: waiting|in_progress|finished`, `winner: 'white'|'black'|'draw'|null`, `roundStarter` (same rematch-alternation field every other live game has).
- `POST /api/chess`, `GET /api/chess/:code`, `POST /api/chess/:code/join` — mirrors `connectFourController.js`/`connectFourRoutes.js` exactly, including the join controller broadcasting over `req.app.get('io')` so the creator's already-connected tab learns about a joined friend instantly. `gamePayload()` also derives `inCheck` fresh from `new Chess(game.fen).inCheck()` on every read, rather than storing it as a separate field that could drift out of sync with `fen`. Rate-limited with the same shape as `connectFourLimiter` (`chessLimiter`, 120/15min).
- **`realtime/chessSocket.js`** registers a `/chess` namespace: `joinRoom { code, role }` (same as every other live game), `makeMove { code, role, from, to, promotion }` (re-fetches the saved `fen`, loads it into a fresh `chess.js` instance, validates turn/status server-side, then attempts `chess.move({ from, to, promotion })` — chess.js itself throws on anything illegal, which is caught and turned into an `errorMsg`, so the server never has to hand-check legality). After a successful move: `chess.isCheckmate()` → the side who just moved wins; `chess.isDraw()` (chess.js's single check covering stalemate, insufficient material, the 50-move rule, and threefold repetition) → `winner: 'draw'`; otherwise the turn flips. `rematch` resets `fen` to a fresh `new Chess().fen()` and alternates `roundStarter`, same pattern as Connect Four.
- **Trust model**: identical to every other live game here — the server always re-derives the current legal-move set from the saved `fen`, never from anything the client claims. A `from`/`to` pair a client submits is just a proposed move chess.js is asked to validate against the real position, not something taken at face value.
- `'chess'` added to `GAME_SLUGS` up front (the Connect Four allowlist bug — see above — made this a standing checklist item for every new game since), plus a `shareChess` OG-preview handler (`shareController.js`/`shareRoutes.js`).

## Live 2-4 player Ludo

Added 2026-08-17 — the first live game with more than 2 seats, and the first with a real pre-game lobby. Every prior live game (Tic-Tac-Toe/Connect Four/Chess/Snake and Ladder) hardcodes exactly 2 roles as a fixed string enum baked into the schema, the socket validation, and the turn-flip logic; Ludo generalizes all of that into an array of 2-4 player subdocuments and an index-based turn pointer instead of a binary flip.

**"Play vs House" (added same day, direct follow-up)**: unlike every other live game, Ludo's single-player mode isn't a separate client-only component — it reuses the exact same live match infrastructure, with the second seat auto-filled by an AI. `LudoGame.vsHouse` (Boolean) marks a match this way; `createGame` accepts a `vsHouse` flag in the body, and when set, ignores `maxPlayers` (always forced to 2), auto-pushes a second player named `'House'`, and starts the match already `in_progress` — skipping the lobby entirely, since there's no second real player to wait for. The house AI itself has **no server process of its own** — it's driven entirely by the human's own connected browser tab (see `FRONTEND.md`'s Ludo section), which is safe under this app's existing trust model: roles are plain strings with no per-connection auth binding a socket to a specific role, the same reason a browser can already emit `moveToken` for its own saved role without any token/session check beyond "is this a role that exists in this game."

**2-player color pairing (fixed same day, reported directly)**: the first version assigned colors in strict join order (`red`, `green`, ...) for every match size, which put a 2-player match's two opponents in *adjacent* corners (red/green) — visually wrong, since a real 2-handed Ludo game seats the players diagonally opposite each other. `colorSequenceFor(maxPlayers)` in `ludoController.js` now returns `['red', 'yellow']` specifically when `maxPlayers === 2` (used by both `createGame`'s initial/vsHouse-second player and `joinGame`'s `nextRole`), and falls back to the standard clockwise join order for 3- and 4-player matches, where the join order still needs to be sequential. This only changes *which* colors get assigned — turn order, capture logic, and every other rule are unaffected, since `utils/ludo.js`'s capture/position math is keyed off each token's own color, never its join position.

**Color-to-corner layout corrected (fixed same day, against a reference screenshot)**: the first build put green top-right/blue bottom-left — a plausible but non-standard arrangement. That reference showed red top-left/blue top-right/yellow bottom-right/green bottom-left, matched by swapping green and blue's `PATH_OFFSET` values.

**Color-to-corner layout corrected again (fixed the same day, against a second, more authoritative reference image)**: the second screenshot showed a *different* standard layout than the first — **blue top-left, red top-right, green bottom-right, yellow bottom-left** — effectively swapping red↔blue and green↔yellow from the version above. Same mechanism as before: `PATH_OFFSET` is `{ blue: 0, red: 13, green: 26, yellow: 39 }` (identically in this file and the frontend's copy), `LUDO_PLAYER_COLORS` reordered to `['blue', 'red', 'green', 'yellow']` for a clockwise 3-/4-player join order. `colorSequenceFor(2)`'s `['red', 'yellow']` pair still didn't need to change — red (now top-right) and yellow (now bottom-left) are still diagonally opposite corners, just swapped with each other from before. Purely a label swap each time; the underlying 52-square ring, safe squares, and every rule are unaffected — verified via the same runtime geometry assertion (`buildRingOrder`'s self-check) both times, which would throw immediately on any inconsistency rather than silently rendering a broken board.

- **`LudoGame` model** — `code`, `maxPlayers: 2|3|4` (chosen by the creator), `players: [{ role: 'red'|'blue'|'yellow'|'green', name, tokens: [Number x4] }]` (role assigned in join order; each token is `-1` in the yard, `0-54` on that color's own local track, `55-60` in its private home stretch, `61` finished — see the bug-fix note below for why 55/61, not the more commonly quoted 51/57), `currentTurnIndex` (index into `players`, advanced via `(currentTurnIndex + 1) % players.length` rather than a 2-value flip), `consecutiveSixes` (caps the extra-roll-on-6 chain at 2 — a 3rd six in a row forfeits the turn, the standard tournament tie-break rule), `pendingRoll`/`movableTokenIndices` (set by `rollDice`, cleared once a move resolves — see below), `status: waiting|in_progress|finished`, `winnerRole`, `roundStarterIndex` (rematch fairness, same purpose as every other game's `roundStarter`, generalized to an index).
- **`utils/ludo.js`** — pure board math, duplicated by hand on the frontend the same way Snake and Ladder's is (here purely for rendering, not running the game, since Ludo has no single-player mode to need a client-only copy of the rules). This board's own shared path is 56 squares, not the traditional 52 — see the bug-fix note below — with each color entering at a fixed offset (`PATH_OFFSET`: red 0, blue 14, yellow 28, green 42 — matching the standard visual layout: red top-left, blue top-right, yellow bottom-right, green bottom-left, clockwise), 8 standard `SAFE_SQUARES` where capture can't happen. `legalMoves(player, roll)` — a yard token can only move on a 6, an on-board token only if the move doesn't overshoot past the finish. `applyMove()` mutates the token, checks the *global* square (via each color's own offset) for an opponent to capture (skipped on a safe square), and checks for an all-4-home win.
- `POST /api/ludo`, `GET /api/ludo/:code`, `POST /api/ludo/:code/join` — mirrors the other games' controller shape, with one real difference: `joinGame` assigns the next unused color from `['red','green','yellow','blue']` and returns it in the response (`role: nextRole`) — unlike a 2-player game's join, which never needs to say so, the frontend can't predict which of 4 colors a joiner will get. `status` always stays `'waiting'` here regardless of player count; only the socket's `startMatch` (below) flips it to `in_progress`, since a 3rd/4th friend may still be joining. Rate-limited with `ludoLimiter` (same 120/15min shape as every other live game's create+join limiter).
- **`realtime/ludoSocket.js`** registers a `/ludo` namespace:
  - `joinRoom { code, role }` — validates `role` is one of the game's actually-assigned players (`game.players.some(p => p.role === role)`), not a fixed 2-value check.
  - `startMatch { code, role }` — the one genuinely new capability no other game needed: creator-only (`game.players[0].role === role`), only while `status === 'waiting'` and `players.length >= 2`. Sets `status = 'in_progress'`, `currentTurnIndex = 0`.
  - `rollDice { code, role }` — validates it's this player's turn and `pendingRoll` is currently null, rolls via `crypto.randomInt(1, 7)` (server-authoritative, same as every other game's dice), computes `legalMoves()`. If there's nothing legal to do (e.g. every token's still in the yard on a non-6), the turn auto-advances immediately instead of leaving the client stuck waiting for a move that can't happen.
  - `moveToken { code, role, tokenIndex }` — the two-phase-turn's second half: validates `tokenIndex` is actually in `movableTokenIndices`, applies it via `utils/ludo.js`, and on a win sets `status = 'finished'` + `winnerRole`. On a non-winning 6 (and `consecutiveSixes < 2`) the same player goes again; otherwise the turn advances to `(currentTurnIndex + 1) % players.length`.
  - `rematch { code, role }` — only once finished; resets every player's tokens, alternates `roundStarterIndex`, clears the roll/consecutive-sixes state, sets `status = 'in_progress'`.
- **Trust model**: identical to every other live game — every roll and every legal-move check is re-derived server-side from the saved document on every event, never trusted from the client.
- `'ludo'` added to `GAME_SLUGS` up front, plus a `shareLudo` OG-preview handler phrased as an open invite (no single "opponent" to name the way a 2-player game's share text can) — `` `🎲 ${game.players[0].name} started a game of Ludo — join in!` ``.

**Fixed a real, major move-count bug (reported directly, "very major"): rolling N sometimes visibly moved a token N+1 squares.** The board's cell classification (see `FRONTEND.md`'s star-position bug for the same underlying geometry) produces 56 physically-connected outer-path cells, not the traditional 52 — a real boundary-walk of the grid confirms all 56 are genuine, distinct board squares forming one unbroken loop (every cell has exactly 2 ring-neighbors; nothing is a dead end). The star-position fix already walked all 56 for connectivity, but still only assigned a numbered *index* to 52 of them, treating the 4 diagonal corner cells (where an arm turns 90° into the next) as unindexed "connectivity waypoints." That was the actual bug: the token's *stored* local-position number always incremented by exactly the roll (game logic was never wrong), but the *rendered* board silently skipped drawing an index at those 4 physical corners, so a move crossing one of them visibly jumped 2 squares for a single index step. Fixed by indexing all 56 walked cells with no exclusions, so every index-to-index step is physically adjacent by construction — this changes the local-position numbering this board uses everywhere: `PATH_OFFSET` is now 14-apart on a 56-loop (`{blue:0, red:14, green:28, yellow:42}`, not 13-apart on 52), `SAFE_SQUARES` renumbered to the same 8 physical stars, `HOME_ENTRY` moved from local 51 to 55, `FINISHED` from 57 to 61 — updated together in `utils/ludo.js` and every frontend duplicate (`utils/ludoBoard.js`, `games/ludoHouseAI.js`, and the two hardcoded finish/threshold checks in `LudoBoard.jsx`/`LudoMultiplayer.jsx`). `legalMoves`/`applyMove` needed no logic changes, since they're already generic against these constants. Verified via an exhaustive offline simulation of every possible roll (1-6) from every possible starting position (0-54) for every color, confirming the number of physical squares crossed now exactly equals the roll dice showed — 0 mismatches, versus a real, reproducible defect at exactly 4 points around the ring before the fix. Re-verified live in a vs-House match with no console errors and the board's own runtime geometry assertion (now checking for 56 cells) passing.

**Fixed: 3-/4-player matches couldn't be started by their own creator (reported directly)** — `createGame`'s response now includes `role: players[0].role`, matching the shape `joinGame`'s response already returns for everyone who joins after the creator. Root cause was entirely frontend (`Game.jsx` was hardcoding the creator's stored role as `'red'`, which only happened to be correct for the 2-player color pairing above — see `FRONTEND.md` for the full writeup), but the backend needed this one addition since there was previously no way for the frontend to know the creator's *actual* assigned color without guessing. Verified via a direct API check: a fresh 3-player `createGame` call's `role` field matches `players[0].role` (`'blue'`), and a full 3-tab browser test confirmed the "Start match" button and the `startMatch` socket event both now work correctly for the real host.

## Stories

A new content type: one long body of prose per story (up to 6,000 characters), read on-page or read *aloud* via a "🔊 Listen to this story" button — narration happens entirely client-side using the browser's built-in `SpeechSynthesisUtterance` (Web Speech API), so there's no recorded voice, no paid TTS service, and no server-side audio generation or storage at all. The backend's only job for the read-aloud feature is serving the story's `body` text; everything else happens in the browser.

Modeled closely on `Quiz` rather than `Post`: its own `Story` model with an immutable `slug` (same `slugify()`-with-fallback pattern as `quizController.js`, for the same reason — a pure-Hindi title reduces to nothing under the ASCII-only regex) rather than reusing `Post`'s `_id`-based URLs, since a story deserves a proper shareable slug like a quiz does. Six categories (`horror`/`comedy`/`romance`/`mystery`/`moral`/`motivational`) — a fixed enum, not user-authored tags, same reasoning as `Quiz`'s category field. Full CRUD (`storyController.js`/`adminStoryRoutes.js`), scheduled publishing, activity logging, clone, and search-by-title/body are all wired in from day one, same as every other admin-authored content type.

The public list endpoint (`listPublishedStories`) explicitly excludes `body` via `.select('title slug category emoji gradient language createdAt')` — a homepage grid of stories only needs the card metadata, not every story's full text loaded at once; `getPublishedStoryBySlug` returns the full document including `body` for the individual reader page.

Stories get the same view/share analytics `Post` has (`PostEngagement`) — see "Unified view/share engagement tracking" below for how that ended up covering Stories plus three other content types in one pass rather than a fifth near-identical model.

## Horoscope

A light, funny, entertainment-only horoscope feature — day/week/month/year, English + Hindi, all 12 zodiac signs. Unlike every other content type on the site, there is **no database model at all** behind it: every horoscope is computed fresh, on every request, from a small fixed set of pre-written lines. Pulled forward from `PENDING_TASKS.md`'s backlog on request.

- **`data/zodiacSigns.js`** — the 12 signs as a plain array (key, emoji, English/Hindi name, English/Hindi date range, a reused gradient string from the same safelisted palette every other content type uses). Pure reference data, not astrology content itself.
- **`data/horoscopeContent.js`** — two content pools per language, not one per sign/period/language: 8 comedic "trait" one-liners per sign (a personality-flavor joke, reused across all four periods) and 10 generic "action" one-liners per period (day/week/month/year — a silly prediction that isn't sign-specific). A final horoscope line is always `${trait} ${action}`.
- **`utils/horoscope.js`** — the engine. `computeHoroscope(signKey, period, language, date)` picks one trait and one action deterministically: a "date unit" is derived per period (days-since-epoch for "day," that divided by 7 for "week," `year*12 + month` for "month," the plain year for "year" — each one increases at roughly the rate its period name implies, with no stored state or cron job needed), then mixed with the sign's position in the zodiac list (`dateUnit * 13 + signIndex * 7`) so that, for the same date, different signs land on different trait/action combinations rather than all showing an identical horoscope. `traitIndex = index % traits.length`, `actionIndex = floor(index / traits.length) % actions.length` — with 8 traits and 10 actions, that's **80 distinct combinations per sign per period**, inside the ~60-90 range originally suggested, while only requiring 8+10 lines to be authored per language instead of 80 fully separate ones. Growing the pool later (more variety) is just adding more lines to either array in `horoscopeContent.js` — no code changes needed anywhere else.
- **Why not a database model:** the whole point of "auto-updates with zero ongoing cost/infra" was to avoid a cron job or any stored, mutating state — a pure function of (sign, period, language, today's date) that's recomputed on every request achieves exactly that, and is trivially cacheable by a CDN/reverse-proxy later if it's ever needed (the response for a given day never changes).
- **`GET /api/horoscope/signs`** and **`GET /api/horoscope/:sign`** (`horoscopeController.js`/`horoscopeRoutes.js`) are the only two public endpoints — no admin CRUD counterpart exists, since there's no content to create or edit.
- **View/share tracking** reuses the existing `Engagement` model exactly like Games do for content with no database row: `contentType: 'horoscope'`, `contentId` = the zodiac sign's key, checked against `ZODIAC_KEYS` in `engagementController.js`'s `contentExists` the same way Games are checked against `GAME_SLUGS`. `Engagement.js`'s enum and admin `Analytics.jsx`'s `ENGAGEMENT_SECTIONS` both gained a `horoscope` entry — a 5th admin Analytics table came along for free from the existing generic machinery.
- **Link preview**: `GET /api/share/horoscope/:sign` (`shareController.js`'s `shareHoroscope`) recomputes the same deterministic text a real visit would show and puts it in the `og:description`, same pattern as `shareGameIntro` for games.
- **Legal/compliance**: every horoscope response includes a `disclaimer` field ("just for laughs — not real astrology, and definitely not medical, financial, or legal advice"), shown directly on the page. Same reasoning that made this safe to build in the first place — entertainment-only framing, no specific medical/financial/legal claims, same bucket as a newspaper horoscope column.
- **Not wired into search or the sitemap this pass** — there's no database content to search against, and a static sitemap entry per sign wouldn't represent content that changes daily/weekly/monthly/yearly particularly well; the 12 sign pages are reachable in one click from the homepage tab, which is enough for now.

## Puzzles

A new content type: simple admin-authored riddles/brain-teasers — a `question`, a hidden `answer` revealed client-side on tap, an optional `imageUrl` for picture puzzles, and a `difficulty` (`easy`/`medium`/`hard`) used as the only filter dimension. Deliberately **not** a coded puzzle-generator engine (no crossword/word-search mechanics) — decided purely on a monetization basis: each admin-authored puzzle becomes its own shareable page with its own ad slot, the same mechanism already driving traffic via Quiz/Post, and is far cheaper to keep adding than building a one-off generator.

- **`models/Puzzle.js`** — `question`, `answer`, `imageUrl` (default `''`, makes it a "picture puzzle" when set — not a separate category, just an optional field), `difficulty` (enum, default `easy`), `emoji`, `gradient`, `language`, `status`/`publishAt`/`createdBy` — same scheduled-publishing/admin-content shape as `Story`/`Post`.
- **`puzzleController.js`**/**`puzzleRoutes.js`**/**`adminPuzzleRoutes.js`** — full role-gated admin CRUD plus public `listPublishedPuzzles` (excludes `answer` from the list select — a player shouldn't see the answer until they choose to reveal it) and `getPublishedPuzzleById` (includes the full document, answer included, since a solo detail-page fetch is exactly when it's needed).
- **Trust boundary, explicitly**: the answer is only hidden from the initial list payload — the single-puzzle fetch always includes it, and the frontend simply doesn't render it until "Reveal Answer" is tapped. Same trade-off already accepted for Quiz results: not a real security boundary, just enough friction that a casual visitor doesn't spoil themselves by accident.
- **Wired into every shared system**: `Engagement.contentType` and `Feedback.contentType` enums both extended with `'puzzle'`; `engagementController.js`'s `getEngagementSummary` special-cases Puzzle to use `question` as the display-title field (Puzzle has no `title`); `searchController.js` gained a `Puzzle.find(...)` query matching on `question`; `sitemapController.js` includes published puzzle URLs (`/puzzle/:id`, priority 0.5); `shareController.js`'s `sharePuzzle` builds an OG-tagged link-preview page (including `image: puzzle.imageUrl || null` for picture puzzles); `dashboardController.js`'s content-count tiles gained a `puzzles` count.
- **Shared daily streak**: `dailyQuiz.js`'s `recordDailyQuizCompletion` was generalized to `recordDailyActivityCompletion(finishedId, todaysId)` — same underlying `localStorage` key (`dailyQuizStreak`, unchanged so no existing user's streak resets) now written to by either a finished daily Quiz (`Result.jsx`) or a revealed daily Puzzle (`PuzzleView.jsx`). A new `pickPuzzleOfTheDay(puzzles)` mirrors `pickQuizOfTheDay`'s deterministic day-of-year pick, just sorted by `_id` instead of `slug` (puzzles have no slug). "Quiz of the Day" and "Puzzle of the Day" stay two separate daily picks/banners; completing either one keeps the same single streak alive.
- **`scripts/seedPuzzles.js`** — seeded 16 starter puzzles (14 English, 2 Hindi, 1 picture puzzle using a Lorem Picsum placeholder image, a royalty-free-placeholder approach). Upserts by `question`, safe to re-run via `npm run seed:puzzles`.

## Unified view/share engagement tracking

`Post` was the only content type with real view/share analytics (`PostEngagement`) — Quiz, Friendship Quiz, and Games each already track *completions* (`PlaySession`/`FriendshipAttempt`/`GameSession`), but none of them tracked a "someone opened this" view or a distinct "someone hit share" event, and Stories launched with no tracking at all. Asked directly whether this gap applied everywhere, the answer was yes for all three, so all four got the same tracking in one pass rather than adding it piecemeal.

Rather than four more near-identical `XEngagement` models/controllers (which is what evolved organically for `Post`), this is one shared `Engagement` model (`contentType: 'quiz'|'friendshipQuiz'|'game'|'story'`, `contentId`, `action: 'view'|'share'`, `anonymousId`) and one controller (`engagementController.js`) — reasonable to consolidate since all four were being added in the same pass, unlike `Post`'s tracking which evolved separately at a different time and is left as-is rather than migrated (no reason to touch working code).

- `contentId` is that content's own Mongo `_id` for quiz/friendshipQuiz/story, or the game's slug for games (games have no database row — same reasoning as `GameSession.gameSlug`). `recordEngagement` validates the referenced content actually exists (and is published, for the three model-backed types) before recording, mirroring `postEngagementController.js`'s existing-post check; for games it checks against `GAME_SLUGS` instead.
- **What counts as a "view":** the page where a visitor actually opens that piece of content — `Quiz.jsx` (taking the quiz, not `Result.jsx`, which is the *outcome* page), `FriendshipSetup.jsx` (opening the template to fill in your own answers — not `FriendshipPlay.jsx`, which is a friend guessing against a specific *instance*, not the template itself), `Game.jsx`, and `StoryView.jsx`. Each fires once per page load via a `viewedRef` guard, same pattern `PostView.jsx` already used.
- **What counts as a "share":** wherever that same page's own `ShareButtons` component appears — `Result.jsx`'s primary result-share (not the separate "compare with a friend" share, which shares a `QuizCompare` link, not the quiz itself), `FriendshipSetup.jsx`'s "your link is ready" share, `Game.jsx`'s post-outcome share, and `StoryView.jsx`'s share. Tile-level shares (the 🔗 icon on `QuizCard`/`GameCard`/`StoryCard`/`FriendshipQuizCard` from "Share before attempting") are **not** tracked here, for the same reason they were never tracked for Post either — `TileShareButton` doesn't accept an `onShare` callback.
- `GET /api/admin/engagement/:contentType` returns `[{ id, title, views, shares }]` sorted by total engagement descending — `title` comes from the matching model's `title` field for quiz/friendshipQuiz/story, or is just the slug for games (there's no title to look up, and the game list is small enough that the slug reads fine).

## Trending/Newest sort (generalized to every content type)

The homepage's Trending/Newest toggle originally only worked for quizzes (`totalPlays`/`createdAt`, both already returned by `listPublishedQuizzes`). Generalized 2026-07-31 so every homepage tab sorts real data, not just quizzes — no new endpoints needed, just extra fields on the existing public list responses:

- **Quizzes and Games** sort "Trending" by `totalPlays` (already existed for quizzes; Games reuse the same field name from `GameSession` aggregation).
- **Friendship quizzes** sort by `totalAttempts` (already returned) and now also return `createdAt` for "Newest" (previously omitted from `friendshipQuizController.js`'s `.select()` string and manual response object).
- **Posts and Stories** have no "completion" concept, so "Trending" falls back to a new `totalEngagement` field — `listPublishedPosts`/`listPublishedStories` each run a `PostEngagement`/`Engagement` aggregate (`$match` by contentId, `$group`-count), mirroring the exact aggregation pattern `listPublishedQuizzes` already used against `PlaySession`.
- **Games have no `createdAt` at all** — they're a static code registry (`GAMES` in the frontend), not database rows — so "Newest" for Games is a frontend-only approximation (reversing the registry array) rather than a real sort field; nothing to add here on the backend side.

All sorting itself happens client-side in `Home.jsx` (no new query params) — the backend's job is just making sure every list response carries whichever field that tab's sort needs.

## Feedback

A way for visitors to send free-text feedback about the site itself, separate from the affiliate/contact email in `About.jsx`. Deliberately the simplest possible shape — one `Feedback` model (`message` required, `email` optional, `read` boolean defaulting to `false`, timestamps), no categories or statuses beyond read/unread. `POST /api/feedback` is public and rate-limited tighter than the analytics endpoints (10/15min vs. 60/15min) since a free-text public form is a more obvious target for spam than a fixed-shape play/engagement ping. The admin list (`GET /api/admin/feedback`) reuses the same pagination helpers as quizzes/posts/friendship quizzes; write actions (mark read/unread, delete) are superadmin/editor only, matching the read-vs-write split used everywhere else in the admin API.

## Report a quiz/post

Reuses the `Feedback` model/admin-list rather than a parallel system — a report is just a feedback entry with four extra optional fields set: `contentType` (`'quiz'`/`'post'`/`'story'`), `contentId` (the quiz's/post's/story's own `_id`), `contentLabel` (denormalized title, so the admin list can show what was reported without a join — same reasoning as `ActivityLog`'s `resourceLabel`), and `reason` (`'offensive'`/`'incorrect'`/`'broken'`/`'other'`). General feedback submissions leave all four `null`/empty, which is why none of them are required at the schema level. `submitFeedback` validates the four together as a group: if `contentType` is present at all, `contentId` must be a valid Mongo ObjectId and `reason` must be one of the four allowed values — a request can't send a report reason without the content it's attached to, or vice versa.

## Duplicate/Clone

No new backend endpoints at all — cloning a quiz/post/friendship-quiz is just the admin panel calling the existing `POST /api/admin/.../` create endpoint with that item's fields copied over, `status` forced to `draft` (never accidentally publish a copy live), and the title suffixed with a short unique tag (e.g. `(Copy a1b2)`, not just a static `(Copy)`) — see "Bugs found and fixed" below for why the tag needs to be unique. Entirely a frontend feature (`handleClone` in each admin list page); the backend has no concept of "this quiz was cloned from that one."

## Scheduled publishing

`Quiz`, `Post`, and `FriendshipQuiz` all have an optional `publishAt` field (`Date`, defaults to `null`). The public-facing list/get endpoints (`listPublishedQuizzes`, `getPublishedQuizBySlug`, and the equivalents for posts and friendship quizzes) filter on `{ status: 'published', $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }] }` — so a "published" item with a future `publishAt` stays completely invisible to real visitors (list, direct-slug fetch, everything) until that moment passes, with **no cron job or background worker needed** — the check happens at query time, on every request, which is simpler and just as correct for this app's traffic scale. `parsePublishAt()` in `validators.js` handles the three states a request can send: omitted (leave existing value alone), explicitly `null`/empty string (clear it, publish immediately), or a date string (validated, rejected with 400 if unparseable).

## Admin list pagination

`utils/pagination.js` exports two small helpers shared by all three admin list endpoints (quizzes, posts, friendship quizzes): `parsePagination(query)` reads `?page=&limit=` (defaulting to page 1, limit 20) and clamps `limit` to a max of 100 so a client can't request an unbounded page in one query, and `paginationMeta(page, limit, total)` builds the `{ page, limit, total, totalPages }` object returned alongside the items. Each controller runs the filtered `.find().skip().limit()` query and a `.countDocuments()` of the same filter in parallel (`Promise.all`) rather than fetching everything and slicing in memory — the point of pagination is to avoid ever loading the full collection.

## Activity log

A lightweight audit trail — not a generic library, just a Mongoose model (`ActivityLog`) and one helper (`logActivity()` in `utils/activityLog.js`) called from every quiz/post/friendship-quiz create, update, and delete controller. Records who (`admin`/`adminName`, `adminName` denormalized so the log still reads right if that account is later removed), what action, what resource type, and a short `resourceLabel` (denormalized too, for the same reason, and because a deleted resource obviously can't be looked up afterward). Deliberately fire-and-forget: `logActivity()` swallows its own errors (logging to the server console instead) so a logging failure can never break the actual create/update/delete it's describing. `GET /api/admin/activity` returns paginated entries (`page`/`limit`), newest first, viewable by all three roles — plus optional `resourceType`/`action`/`admin` query params (added 2026-08-17, requested directly) that build a Mongo filter, each validated against the model's own enum (or `mongoose.Types.ObjectId.isValid()` for `admin`) so a bad value is safely ignored rather than 500ing. The admin-filter dropdown on the frontend reads `GET /api/admins` (`adminRoutes.js`), which was superadmin-only until this change — split into per-route role gates so listing (read-only, no `passwordHash`) is available to editor/analyst too, while creating/deleting an admin account stays superadmin-only.

## Bulk publish/unpublish/delete (admin lists) — no new endpoints

CSV export and bulk publish/unpublish/delete on the 5 admin content lists (requested 2026-08-17) needed **zero backend changes**. CSV export is pure client-side re-serialization of data the frontend already fetched. Bulk publish/unpublish/delete work by looping the *existing* single-item `PUT .../:id` and `DELETE .../:id` endpoints from the frontend (same pattern Bulk Import already uses for creation) — this only works because every one of the 5 update controllers (`quizController.updateQuiz`, `postController.updatePost`, `storyController.updateStory`, `puzzleController.updatePuzzle`, `friendshipQuizController.updateFriendshipQuiz`) already treats every body field as optional (`if (x !== undefined) item.x = x`), including `title`/`questions` validation functions that tolerate `undefined` (`validateQuizPayload`/`validateFriendshipQuizPayload` in `utils/validators.js` only check a field's constraints when it's actually present). So a status-only body (`{ status: 'published' }`) is already a safe partial update on every one of them — bulk publish/unpublish is 5 sequential `PUT` calls with a one-field body, nothing new to build server-side. See `FRONTEND.md` for the actual UI (`useBulkSelection.js`, `BulkActionsBar.jsx`).

## Site-wide reactions (Quiz/Story/Game, not just Post)

`Reaction.js` gained an optional `contentType` field (`enum: ['post','quiz','story','game']`, default `'post'`) — no data migration needed, since `postId` already just holds whatever content's own id is (a Mongo ObjectId for quiz/story, a slug for game, matching the same "no DB row for games" convention `Engagement.js`'s `contentId` already uses), and those never collide across types. The existing unique index (`postId`+`anonymousId`) stays correct unchanged. A new `reactionRoutes.js` (`GET`/`POST /api/reactions/:contentType/:id`) reuses the *exact same* `getReactions`/`setReaction` controller functions the older Post-specific routes already used — `contentType` reads from `req.params.contentType` when present, defaulting to `'post'` when absent, so `/api/posts/:id/reactions` is completely untouched and behaves exactly as before. The existing `reactionLimiter` rate limiter is applied to both route patterns in `server.js`.

## Today's play count (`GET /api/stats/today`)

A tiny new endpoint (`statsController.js`/`statsRoutes.js`, no rate limiter — matches other public read-only GETs) backing the homepage's "🔥 X played today" counter. Reuses `digestController.js`'s existing `computeDigestForRange(since)` aggregate — passing midnight-today as the range start — rather than writing a new aggregation, and returns just `{ playsToday }`.

## Draft preview link

A signed, temporary URL that lets an admin view an unpublished draft exactly as a visitor would see it, without flipping its status to Published. `utils/previewToken.js` exports `signPreviewToken(contentType, id)`, a 30-minute JWT signed off the same `JWT_SECRET` used for admin/end-user auth, carrying `{ purpose: 'preview', contentType, id }` — a payload shape that shares no fields with an admin session token (`{ id, role, name }`) or a user session token (`{ id, type: 'user' }`), so a preview token can never be replayed as either, and `isValidPreviewToken(token, contentType, id)` verifies a token matches a specific resolved document. `GET /api/admin/preview-link?contentType=&id=` (role-gated the same as read access — Super/Editor/Analyst) mints one on demand; the admin panel opens the real public page in a new tab with `?preview=<token>` appended rather than rendering a separate preview view.

The 5 public "get by slug/id" controllers (`getPublishedQuizBySlug`, `getPublishedPostById`, `getPublishedStoryBySlug`, `getPublishedPuzzleById`, `getPublishedFriendshipQuizBySlug`) were all rewritten the same way: fetch the document unconditionally (no `status`/`publishAt` filter at the DB level), compute `isLive` in JS from those same fields, and only 404 if it's not live *and* `isValidPreviewToken` fails against that document's real `_id`/`contentType`. This lets slug-based and id-based lookups share one scheme without a separate token-keying design for each — the token is always checked against the actual resolved document, not the route param.

## Achievement levels + global leaderboard

A 10-level progression ("Achievements") layered on top of the existing 7 one-off badges (see FRONTEND.md's "Badges" — those are kept as a separate "Bonus Badges" section, not replaced). `utils/levels.js` exports the `LEVELS` array (name, emoji, subtitle, points threshold) plus `calculatePoints(stats, quizStreakCount, puzzleStreakCount)` and `getLevelInfo(points)` — a byte-for-byte duplicate of `frontend/src/utils/levels.js`, kept in sync by hand (same reasoning as the existing `GAME_SLUGS` duplication between frontend/backend: two different runtimes, no shared module boundary). Points are a single combined score from everything already tracked in the synced stats blob (quizzes completed, puzzles solved, games played, shares, reactions, streak weeks) — deliberately not tied to any one activity type, so no level name implies "quiz only" or "games only." Quiz and Puzzle streak weeks (see "Streak split" above) each contribute their own points independently.

`GET /api/leaderboard/levels` (public, no auth) is the only new endpoint: reads every `status: 'active'` `EndUser`'s `displayName`/`avatar`/`stats`, computes points server-side with the same `calculatePoints()` (never trusts a client-submitted score), sorts descending, and returns the top 100. Recall `EndUser.stats` is the whole synced blob (`{ quizStreak, puzzleStreak, stats, badgesSeen }` — accounts synced before the 2026-08-09 streak split still have the old singular `streak` field instead, read here as that account's `quizStreak`; see FRONTEND.md's "Cross-device stats sync"), so the controller reads `u.stats?.stats` for the badge counters and `(u.stats?.quizStreak || u.stats?.streak)?.count`/`u.stats?.puzzleStreak?.count` for the streak weeks. Only ever returns the public-safe fields already used elsewhere (no `username`, no email/phone since none exists).

## Security hardening

Added after the initial build, in response to wanting a production-ready app rather than just a working prototype:

- **`helmet`** — sets standard protective HTTP headers (CSP, no-sniff, frame protection, etc.) on every response.
- **Rate limiting** (`express-rate-limit`) — login is capped at 10 attempts per 15 minutes per IP (blocks brute-force password guessing); play-recording, post view/share recording, and friendship-quiz instance/attempt creation are each capped at 60 per 15 minutes per IP (blocks fake-analytics spam and guess-spamming); public feedback submission is capped tighter, at 10 per 15 minutes per IP (a free-text form is a more obvious spam target than a fixed-shape analytics ping). Tested directly — hammering login past the limit correctly returns 429 and normal use is unaffected.
- **NoSQL injection protection** (`express-mongo-sanitize`) — strips any `$`/`.` keys from request bodies so user input can never be interpreted as a MongoDB query operator. Applied to `req.body` only (not `req.query`/`req.params`, which Express 5 makes read-only and would throw if rewritten).
- **Input validation** (`src/utils/validators.js`) — email format checks, an 8-character minimum on admin passwords, and size limits on quiz content (max 30 questions, 8 options per question, 20 results) to block malformed or oversized submissions. Also added type checks (e.g. rejecting a non-string email) after testing revealed that a crafted injection payload could otherwise reach `.toLowerCase()` on a non-string value and crash with a raw 500 instead of a clean 400.
- **Request body size cap** — `express.json({ limit: '100kb' })`, blocking oversized payload abuse.
- **Configurable CORS origin** — defaults to `*` for local development; set `CORS_ORIGIN` in `.env` to your real frontend domain once deployed.

All of the above was verified with real requests: a NoSQL injection attempt against login, an oversized quiz payload, a weak password, an invalid email, and a login brute-force attempt were each tested and confirmed blocked or cleanly rejected.

## Bugs found and fixed while testing the admin panel

Both of these were caught by actually clicking through the admin UI in a browser rather than only testing the API in isolation — worth knowing about if something about quiz editing feels surprising:

1. **Editing a quiz used to silently change its URL slug.** `updateQuiz` regenerated the slug from the title on every save, which would have broken already-shared quiz links the moment anyone touched that quiz's title in the admin panel. Fixed: the slug is now set once at creation and never changes on update.
2. **Creating a quiz as "Published" used to always save as "Draft".** `createQuiz` never read the `status` field from the request at all. Fixed: `status` is now passed through on creation.
3. **Adding the `language` field made the 5 original quizzes disappear from the homepage.** Mongoose schema defaults only apply when a document is newly constructed — they don't retroactively backfill existing rows already in the database. Since the homepage filters by `language=en` by default, those 5 quizzes (which genuinely had no `language` field stored) silently failed to match and vanished from the list. Fixed with a one-off `updateMany({ language: { $exists: false } }, { $set: { language: 'en' } })`. Worth remembering: **any time a new field is added to an existing model, existing documents need an explicit backfill** — the schema default alone won't reach them. (When `category` was added later, every quiz in the seed script had it set explicitly, sidestepping this issue entirely — the lesson from bug #3 held.)
4. **The admin quiz form never had a Language dropdown at all.** Hindi quizzes only ever existed because the seed script set `language: 'hi'` directly — an admin using the UI had no way to create or change a quiz's language. Fixed by adding both Category and Language dropdowns to `QuizForm.jsx`.
5. **`slugify()` produced an empty slug for a title with no Latin/numeric characters at all — i.e. any pure-Hindi title.** Every Hindi quiz/friendship-quiz so far had come from the seed scripts, which set `slug` directly and bypass `slugify()` entirely — so this had never been hit through the actual admin panel until the new Clone feature was tested on a Hindi quiz: cloning `"आपका मानसून मूड क्या है?"` produced the slug `copy` (only the English `"(Copy)"` suffix survived the ASCII-only regex; the Hindi title contributed nothing). Since `slug` has a unique index, a second clone — or a brand-new Hindi quiz typed straight into the admin form — would have collided or silently saved with slug `""`. Fixed two ways: `slugify()` now falls back to a short unique tag (`quiz-<timestamp36>`) whenever the title reduces to nothing, and the Clone feature's generated title includes a short random tag (not just a static `"(Copy)"`) so repeated/Hindi clones get distinguishable slugs in the first place.

## Cohort/retention analytics (Weekly Active Users + signup-cohort retention)

Pulled directly from the backlog (2026-08-19). `EndUser` had no activity timestamp at all before this — only `createdAt`/`updatedAt`, and `updatedAt` isn't usable since profile edits bump it for reasons unrelated to "came back and used the app." Added `lastActiveAt` (`EndUser.js`), stamped on login (`endUserAuthController.js`'s `login()`) and refreshed — throttled to once per 15 minutes per account — on every authenticated request via `middleware/userAuth.js`'s `requireUserAuth`, the one choke point every logged-in action already passes through. The throttle check reads the already-fetched `status lastActiveAt` projection and fires a fire-and-forget `EndUser.updateOne(...)` (never awaited, so it can't add latency to the actual request).

`GET /api/admin/end-users/cohort-retention` (new, same role gating as the existing end-user list — superadmin/editor/analyst) computes two things:
- **Weekly Active Users**: `EndUser.countDocuments({ status: 'active', lastActiveAt: { $gte: sevenDaysAgo } })`, plus the total active-account count for a "% of all accounts" figure.
- **An 8-week signup-cohort retention table**: for each of the last 8 weeks (anchored to "now," not calendar weeks), `cohortSize` is how many accounts have a `createdAt` in that week; `retainedDay7` is how many of those have `lastActiveAt` at least 7 days *after their own* `createdAt` — since that cutoff differs per account within the same weekly bucket, this needs `$expr` to compare two fields on the same document: `{ $expr: { $gte: ['$lastActiveAt', { $add: ['$createdAt', 7 * 86400000] }] } }`. A cohort whose own signup week hasn't yet had 7 days pass returns `null` for both fields (rendered as "too early" on the frontend) rather than a misleading 0%.

Deliberately a handful of plain `countDocuments` calls in a loop, not a hand-rolled aggregation pipeline — simple over clever, and entirely adequate at this app's current account volume; this endpoint is loaded once per Analytics page visit, not a hot path. Stated honestly in the code comments: this is a single latest-activity timestamp, not a full session log, so it answers "did they ever come back a week later," not "were they active on exactly day 7" — a deliberately scoped, lowest-priority report per its own backlog framing, not a full analytics platform.

## Fixed a real signup bug: `EndUser.handle`'s sparse unique index collided on explicit nulls

Found (not reported by a user) while seeding test data for the cohort-retention work above, then fixed the same day (2026-08-19). `handle` (the public-profile URL slug added alongside the Public Profile feature — see FRONTEND.md) had `sparse: true` on its unique index, meant to let many accounts share an unset handle. But the schema also gave it `default: null`, so every new account got the field explicitly set to `null` rather than left genuinely absent — and MongoDB's sparse index still indexes an explicit `null` the same as any other value. The *second* account ever created without picking a handle collided with the first one's `null` on that unique index, and `signup()` threw, surfacing as a raw uncaught 500 rather than a clear error.

Fixed in three parts:
1. Removed the schema `default` entirely — an unset handle is now genuinely absent, not `null`.
2. `updateProfile()`'s "clear my handle" path now assigns `undefined` (not `null`) before `save()`, so clearing a handle actually unsets the field in MongoDB instead of writing another explicit `null` right back.
3. A new `cleanupNullHandles()` (`scripts/cleanupNullHandles.js`) runs on every server boot, alongside the existing `ensureFirstAdmin()` (same pattern, same call chain in `server.js`) — `EndUser.updateMany({ handle: null }, { $unset: { handle: '' } })`, cheap and safe to repeat every boot, a no-op once nothing matches. Chosen specifically so the cleanup reaches the real production database automatically on the next deploy, without needing a one-off script run against Atlas from a local machine — past experience in this project (see "Fixing live production content directly" near the top of this file) already found that unreliable due to DNS/SRV lookup issues.

Verified locally end-to-end: two brand-new accounts signed up back-to-back with neither ever setting a handle (the exact original repro — previously failed on the second one, now both succeed); confirmed the on-boot migration removed the leftover null-handle accounts already sitting in the local dev database; confirmed clearing a handle now leaves it genuinely absent, not null again. Re-verified directly against production after deploying: two disposable signups succeeded back-to-back with no error.

## Sponsored Quizzes & Posts (native advertising)

Manual, admin-entered sponsorship — no self-serve brand signup, no payment
processing. `Quiz`/`Post` both gained an optional `sponsor: { name, logo,
url }` subdocument (2026-08-19); whether something is sponsored is just
`sponsor.name` being non-empty, no separate boolean to keep in sync.
`isValidSponsorUrl()` (`validators.js`) rejects anything that isn't a real
`http(s)` URL, blocking a `javascript:` URL from ever being saved and later
rendered as a link. `createQuiz`/`updateQuiz`/`createPost`/`updatePost` all
pass `sponsor` through the same optional-field pattern every other field
already uses — no new routes needed.

**Real bug caught during verification**: `listPublishedQuizzes` (the public
homepage quiz-grid endpoint) has a hardcoded `.select('title slug
description emoji gradient category language createdAt')` field
projection — the new `sponsor` field was silently stripped from every
response until added to that list, so the frontend's tile badge (which
reads `quiz.sponsor?.name`) never actually rendered even though the field
saved correctly. A reminder that adding a schema field isn't enough by
itself when a controller explicitly whitelists response fields — always
verify a new field through the real public API response, not just the
admin save. **A second instance of the same bug class was found later** (2026-08-20, during a QA sweep): `searchController.js`'s hardcoded `.select()` projections and its manual response-object mapping had the identical problem for quiz/post search results — fixed the same way, by adding `sponsor` to both the projection and the mapped output.

## Live Quiz Battle mode

A real-time, timed head-to-head race between two friends through one
right/wrong quiz's questions (2026-08-19 — internally `Quiz.type: 'trivia'`,
never shown to a user). Reuses the site's existing live-multiplayer
pattern end-to-end — one socket.io namespace (`/quiz-battle`) + REST
create/get/join (`quizBattleController.js`/`quizBattleRoutes.js`) + Mongo as
the source of truth (`QuizBattleGame.js`), same structure as
`connectFourController.js`/`ConnectFourGame.js`/`connectFourSocket.js`.

The one genuinely new piece: the board games are turn-based on one shared
piece of state, but a quiz battle isn't — both players progress through the
same quiz's questions independently, each at their own pace. So
`QuizBattleGame` tracks per-player *progress* instead of a shared board:
`{ name, answeredCount, correctCount, finishedAt }` for each of `playerA`/
`playerB`, plus one shared `startedAt` (set the instant `playerB` joins) so
both players' elapsed time is directly comparable for the tie-break.
`realtime/quizBattleSocket.js`'s `maybeFinish()` decides the winner once both
players have answered every question: higher `correctCount` wins outright;
a tie is broken by whoever finished faster (`finishedAt - startedAt`); a true
`'draw'` only if both are exactly equal.

Answering a question happens over the socket (`answerQuestion`), never REST
— same reasoning as Connect Four's disc drops. The server never trusts a
client's own correctness claim: it looks up the real `Quiz` document by the
battle's stored `quizSlug` and checks
`quiz.questions[questionIndex].options[optionIndex].result === 'correct'`
itself. A player may only answer their own current unanswered question
(`questionIndex !== player.answeredCount` is rejected) — this is the actual
guard against a duplicate/rapid-double-click submission, not just a
frontend debounce. The opponent's live progress is broadcast as aggregate
counts only (`answeredCount`/`correctCount`), never which specific
question/option was picked, so the race stays fair.

Scoped deliberately to `type: 'trivia'` quizzes only — a personality quiz
has no "correct" answer to race for, so `createGame` rejects any other
quiz type with a 400. No leaderboard/`GameScore` integration for v1 either,
matching the confirmed precedent that no other 2-player live game writes to
the leaderboard on completion — bragging rights via the winner screen only,
not new scoring wiring.

"Battle Again" (`rematch` socket event) resets both players' progress and
`startedAt` to now, keeping the same room/code — same pattern as every other
game's rematch, no new invite link needed.

## Referral rewards

A personal invite link (2026-08-20) that awards both sides — a one-time
points bonus plus a permanent badge each — once a friend actually signs up
through it. `EndUser` gained four fields: `referralCode` (unique, generated
unconditionally at signup via `generateReferralCode()` in
`endUserAuthController.js` — `crypto.randomBytes(4).toString('base64url')`,
retried on collision, so it's never absent and needs no sparse index, unlike
`handle`'s earlier lesson), `referredBy` (ObjectId ref, set once at signup),
and `referralCount`/`referralWelcomeBonus` (the actual reward facts).

**The core design problem**: points/badges are always recomputed live from
`EndUser.stats.stats` (a raw-counters object, see `levels.js`/`badges.js`),
never stored — and `updateStats` **overwrites that whole blob wholesale**
on every client push, no server-side merge. Storing the referral credit as
just another key inside that same blob would have been genuinely racy: the
referrer's own browser could push its own (not-yet-synced) stale copy
moments after the server credits a referral, silently wiping the credit
before that browser's next pull-and-merge ever ran. Fixed by keeping
`referralCount`/`referralWelcomeBonus` as **dedicated top-level fields**,
written only by `signup()`, and overlaid into the computed stats object at
every read site — `getStats` (own account), `getPublicProfile`
(`endUserController.js`), and `getLevelLeaderboard`
(`leaderboardController.js`) — instead of ever trusting whatever a client
last pushed for those two keys. This makes them immune to the overwrite
race by construction, at the cost of computing them slightly differently
from every other stat (which *are* trusted from the client blob).

`signup()` resolves an optional `referralCode` in the request body to a
real account (silently ignored if unknown/invalid — never blocks signup),
sets the new user's `referredBy`/`referralWelcomeBonus: true`, and
`$inc`s the referrer's `referralCount`. `POINTS_PER_REFERRAL` (30, per
referral, referrer) and `POINTS_PER_REFERRAL_SIGNUP` (15, one-time, new
signee) in `levels.js`; two new entries in `badges.js`'s `BADGES` array
("🤝 Twegle Ambassador" / "🎉 Warm Welcome"), same shape as every existing
badge. Both `levels.js` and `badges.js` changes mirrored into the frontend's
hand-duplicated copies, same convention those files already document.

**Real bug found during verification, not fixed as part of this task**:
`localStorage`'s `twegleStats` key (frontend) is global, not scoped per
account — two different accounts logged into two tabs of the *same*
browser at once can leak each other's cached stats via the existing
`Math.max`/OR merge in `statsSync.js`, since each account's 20-second
background sync reads and writes that same shared key. The
server-authoritative referral fields specifically self-heal on the next
clean login (confirmed directly), but every other stat field has no such
protection. Doesn't affect the realistic case this feature is built around
(a referrer and a new friend are essentially always on separate devices) —
logged to `PENDING_TASKS.md` as a low-priority fix for later.

## Folder structure

```
backend/src/
  server.js              Express app + route wiring
  config/db.js            MongoDB connection (real or dev in-memory)
  models/                 Admin, Quiz, Post, Story, PlaySession, PostEngagement,
                           Engagement, FriendshipQuiz, FriendshipInstance,
                           FriendshipAttempt, ActivityLog, GameSession, QuizCompare,
                           Feedback, TicTacToeGame, ConnectFourGame (Mongoose schemas)
  controllers/             business logic per resource, incl. shareController.js,
                           postEngagementController.js, storyController.js,
                           engagementController.js, friendshipQuizController.js,
                           friendshipInstanceController.js, sitemapController.js,
                           activityLogController.js, gameController.js,
                           quizCompareController.js, feedbackController.js,
                           ticTacToeController.js, connectFourController.js
  routes/                  URL → controller wiring + role requirements, incl. shareRoutes.js,
                           storyRoutes.js, adminStoryRoutes.js, engagementRoutes.js,
                           adminEngagementRoutes.js,
                           friendshipRoutes.js, adminFriendshipRoutes.js, activityRoutes.js,
                           gameRoutes.js, feedbackRoutes.js, adminFeedbackRoutes.js,
                           ticTacToeRoutes.js, connectFourRoutes.js
  realtime/                socket.io event handlers, incl. connectFourSocket.js
                           (see "Live two-player Connect Four")
  utils/connectFour.js     pure board logic (landing row, win check, draw check)
  middleware/auth.js       JWT verification + role check
  middleware/sanitize.js    NoSQL-injection protection
  middleware/rateLimiters.js  login/plays/engagement/friendship/feedback/tictactoe rate limits
  utils/validators.js       shared input-validation helpers, incl. parsePublishAt()
  utils/pagination.js       shared parsePagination()/paginationMeta() helpers
  utils/activityLog.js      logActivity() helper (see "Activity log")
  scripts/seedAdmin.js      one-off "create first admin" command
  scripts/seedQuizzes.js    loads all 25 quizzes (see above)
  scripts/seedPosts.js      loads all 85 posts, EN + HI (see above)
  scripts/seedFriendshipQuizzes.js  loads the 4 friendship-quiz templates (see above)
  scripts/seedStories.js    loads the 8 starter stories (see above)
  scripts/ensureFirstAdmin.js  auto-creates first admin on boot (see above)
```

## Known dev-environment quirks (for whoever runs this next)

- **Stopping a background `npm run start`/`npm run dev` doesn't always kill the actual `node`/`mongod` process on Windows** — the wrapping shell dies but the child can survive and keep holding the port or the database lock. If a restart seems to "ignore" a code change, check `Get-NetTCPConnection -LocalPort 4000` (PowerShell) for a stale process still bound to the port, and kill it directly.
- **`npm run start` does not auto-reload on file changes — only `npm run dev` (nodemon) does.** Hit this directly: a controller edit (the admin search/filter feature) silently had zero effect because the backend was running via `start`, not `dev`. If a backend code change doesn't seem to take effect, check which script is actually running before assuming the code is wrong — restart with `npm run dev` during active development.
- The dev-only in-memory database fallback does not reliably persist data across separate process restarts (it's designed for ephemeral test runs, not as a lightweight persistent local database) — this is exactly why the auto-seed-on-boot approach exists. Not relevant anymore now that a real local MongoDB is configured, but worth knowing if `MONGODB_URI` is ever unset again.

## What's next

- The admin panel frontend and the public-site API wiring are both done — see `FRONTEND.md`.
- Every item from the original "strengthen before launch" list (see `ORIGINAL_PLAN.md` §12) is now done, including clone, activity log, and scheduled publishing.
- **Deploy somewhere public** — right now everything only runs on this machine. Going live means: MongoDB Atlas (replacing the local MongoDB), a host for this backend (Render/Railway), and a host for the frontend (Vercel) — all one-time setup steps already listed in `ORIGINAL_PLAN.md`. Remember the sitemap hosting-rewrite step (see "SEO" above) once that happens.
- Content variety is inherently ongoing — more quiz topics, more posts, more friendship-quiz templates, whenever there's an appetite for them.
