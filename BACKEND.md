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

**For a real deployment** (once the site goes live), replace that with a MongoDB Atlas connection string (see "Non-Technical Tasks" in `DEVELOPMENT_PLAN.md`) — a local Windows machine isn't reachable by the internet, so production needs a cloud-hosted database.

**If `MONGODB_URI` is left blank**, the server falls back to a temporary in-memory MongoDB so it still runs without any setup — but that fallback does not reliably persist data across restarts (see the note below), so the real local MongoDB is the better option whenever it's available, which it now is.

## How auth and roles work

1. `POST /api/auth/login` — email + password, returns a JWT valid for 12 hours.
2. Every admin-only route requires `Authorization: Bearer <token>`.
3. Three roles, enforced by middleware (`src/middleware/auth.js`):
   - **superadmin** — everything, including creating/deleting other admin accounts (`/api/admins`).
   - **editor** — can create/edit/delete/publish quizzes, cannot manage admin accounts.
   - **analyst** — read-only: can view quizzes and analytics, cannot create/edit/delete anything.
4. Tested directly with real HTTP requests: login, viewing as analyst (allowed), creating a quiz as analyst (blocked, 403), managing admins as analyst (blocked, 403), and missing/invalid tokens (401).

End users (quiz takers) never *have to* authenticate — every feature works fully as a guest, see the "Access Model" in `DEVELOPMENT_PLAN.md`. They can optionally create an account (see below); this is entirely separate from admin auth.

## End-user accounts (optional, no email/phone collected)

Regular visitors can optionally sign up for an account at `/signup` to keep a persistent "Gamer Tag" — no feature on the site is gated behind this. By design, **no email address or phone number is ever collected**, to avoid holding anything personally identifying.

- **Model** (`src/models/EndUser.js`): `username` (unique, lowercase, 3-20 chars, letters/numbers/underscore only — `isValidUsername` in `src/utils/validators.js`), `passwordHash`, `recoveryCodeHash`, `displayName` (the public "Gamer Tag", 1-30 chars, freely changeable, unrelated to the username), `avatar` (nullable — one of 8 fixed preset emoji, `AVATAR_OPTIONS` in `src/utils/validators.js`; falls back to the Gamer Tag's initial letter on the frontend until one is chosen). Deliberately a fixed emoji preset rather than image uploads, so no file storage was ever needed for this.
- **No password-reset email exists**, since there's no email on file. Instead, a one-time **Recovery Code** (format `TWEGLE-XXXX-XXXX`, generated via `crypto.randomInt` over an alphabet that excludes visually-ambiguous characters `0/O/1/I/L`) is shown to the user exactly once at signup, and again every time it's used to reset a password or explicitly regenerated — each use rotates a brand-new code, invalidating the old one immediately. Only the bcrypt hash of the code is ever stored, same as the password, so a database leak doesn't expose a usable code. If both the password and the current recovery code are lost, the account cannot be recovered — this is stated plainly to the user.
- **Controller** (`src/controllers/endUserAuthController.js`): `signup`, `login`, `resetPassword`, `me`, `updateProfile`, `regenerateRecoveryCode` — all using the same generic-error-message convention as admin auth (e.g. "Invalid username or password", never leaking which field was wrong).
- **JWT isolation**: end-user tokens share the same `JWT_SECRET` as admin tokens (no new env var needed) but carry a `{ id, type: 'user' }` payload, versus admin's `{ id, role, name }`. `requireUserAuth` (`src/middleware/userAuth.js`) explicitly checks `payload.type === 'user'` before accepting a token, so an admin token can never be replayed against a user route, or vice versa.
- **Routes** (`src/routes/endUserAuthRoutes.js`), mounted at `/api/users`: `POST /signup`, `POST /login`, `POST /reset-password`, `GET /me` (auth required), `PATCH /me` (auth required, updates `displayName` and/or `avatar` — either field is optional per request, but `avatar` is server-validated against the fixed preset list regardless of what the client sends, so a tampered request can't set an arbitrary emoji), `POST /me/regenerate-recovery-code` (auth required). `/login` and `/signup` each have their own rate limiter (`userLoginLimiter`/`userSignupLimiter` in `src/middleware/rateLimiters.js`, 10 attempts/15 min, separate buckets from admin's `loginLimiter`).
- **Deliberately out of scope for this build**: migrating the existing anonymous localStorage stats (daily streak, achievement badges, game leaderboard nicknames) onto an account — those keep working completely unchanged for every visitor, logged in or not, and merging them in is real work (conflict handling if an account already has server-side stats) left for a future session.

## API summary

**Public (no auth) — used by the end-user-facing site:**
- `GET /api/quizzes?language=en|hi&category=beauty|entertainment|kpop|lifestyle|fun` — list published quizzes, both filters optional; each result includes `totalPlays` (aggregated from `PlaySession`, used for the "X took this" social-proof badge) and `createdAt` (used for the homepage's "Newest" sort)
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
- `POST /api/games/:slug/plays` — record an anonymous game result (`{ outcome: 'win'|'loss'|'draw', anonymousId }`). `slug` is checked against a small backend allowlist (`GAME_SLUGS` in `gameController.js`, seven entries including `sudoku`) since games aren't database-backed content. Rate-limited like plays/engagement.
- `POST /api/engagement` — record an anonymous "view" or "share" event for a quiz, friendship quiz, game, or story (`{ contentType: 'quiz'|'friendshipQuiz'|'game'|'story', contentId, action: 'view'|'share', anonymousId }`) — the same view/share tracking Post already had via `PostEngagement`, extended to the other four content types. Rate-limited (60/15min per IP) the same way post-engagement recording is. See "Unified view/share engagement tracking" below.

**Admin (auth required):**
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/admin/quizzes`, `GET/PUT/DELETE /api/admin/quizzes/:id` — role-gated as above. `GET` accepts optional `?search=&category=&language=&status=` query params (search matches quiz title, case-insensitive) so the admin panel's list can be filtered instead of always showing everything, plus `?page=&limit=` for pagination (see "Admin list pagination" below). `POST`/`PUT` accept an optional `publishAt` (ISO date string or `null`) for scheduled publishing — see "Scheduled publishing" below. Creating, editing, and deleting are all recorded in the activity log automatically.
- `GET/POST /api/admin/posts`, `GET/PUT/DELETE /api/admin/posts/:id` — same role rules as quizzes (analyst read-only, editor/superadmin can write). `GET` accepts the same kind of `?search=&category=&language=&status=&page=&limit=` params (search matches post text or author). Same `publishAt` and activity-logging support as quizzes. `category: 'meme'` requires `imageUrl` instead of `text` (see "Memes" below) — every other category is the reverse.
- `GET/POST /api/admin/stories`, `GET/PUT/DELETE /api/admin/stories/:id` — same role rules as quizzes/posts. `GET` accepts `?search=&category=&language=&status=&page=&limit=` (search matches story title) and omits `body` from the list response, same reasoning as the public list endpoint. `slug` is generated once at creation and immutable after, same as `Quiz`. Same `publishAt` and activity-logging support. See "Stories" below.
- `GET /api/admin/quizzes/analytics` — total plays + unique players per quiz
- `GET /api/admin/posts/analytics` — total views + shares per post, same anonymous-tracking pattern as quiz plays (see `PostEngagement` model)
- `GET /api/admin/engagement/:contentType` (`contentType` is `quiz`/`friendshipQuiz`/`game`/`story`) — total views + shares per item of that type, same shape as `/api/admin/posts/analytics` but backed by the shared `Engagement` model. See "Unified view/share engagement tracking" below.
- `GET/POST /api/admin/friendship-quizzes`, `GET/PUT/DELETE /api/admin/friendship-quizzes/:id` — same role rules as quizzes; manages the question *templates* only, not the instances/attempts real visitors generate (those aren't admin-managed content). Same `publishAt` and activity-logging support, plus `?page=&limit=` pagination.
- `GET /api/admin/activity` — the 200 most recent create/update/delete actions across quizzes, posts, stories, and friendship-quiz templates, newest first. All roles can view (read-only, like Analytics). See "Activity log" below.
- `GET /api/admin/feedback` — paginated (`?page=&limit=`), newest first, all roles can view. `PUT /api/admin/feedback/:id` (toggle `read`) and `DELETE /api/admin/feedback/:id` are superadmin/editor only, same read-vs-write split as everything else. See "Feedback" below.
- `GET/POST /api/admins`, `DELETE /api/admins/:id` — superadmin only

## Seeding starter content

- `npm run seed:quizzes` — loads all 25 quizzes: 12 personality-quiz topics × English + Hindi (skincare personality, Bollywood era, aesthetic, procrastination style, chai/coffee order, Korean beauty standard, squishy, blind bag, K-pop idol position, K-pop comeback era, texting personality, monsoon mood), plus 1 English-only trivia quiz ("How Well Do You Know Bollywood?") — each tagged with a category (beauty/entertainment/kpop/lifestyle/fun), published and ready to view.
- `npm run seed:posts` — loads 91 posts across Jokes/Funny Lines/Quotes/Motivational Quotes/Memes: 59 in English, 32 in Hindi (written natively, not translated). Includes 6 starter memes (placeholder images from Lorem Picsum, since there's no upload pipeline yet — see "Memes" below).
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

## Non-personality (trivia) quizzes

Every quiz until now was "personality" shaped: each answer option maps to a result *key*, and whichever key gets the most votes across all questions wins. `Quiz.type` (`'personality'` default, or `'trivia'`) adds a second shape — right/wrong questions scored numerically — **without a parallel model or a second quiz-taking flow**, by reusing the exact same data shapes with a different convention:

- **Options** still just have a `result` string (unchanged schema) — for a trivia quiz, the *only* two values that mean anything are the literal strings `'correct'` and `'incorrect'`, instead of a personality key. This means the frontend's existing per-option tally (`scores[option.result]++`, see `FRONTEND.md`) already produces the right numeric score with zero new tallying logic — `scores.correct` just *is* the count of right answers.
- **Results** gained two new optional fields, `minScore`/`maxScore` (both `Number`, default `null`) — for a trivia quiz, the result whose range contains the final score is the one shown, instead of whichever key got the most tallied votes. `key` is still required and still becomes part of the shareable result URL, exactly like a personality quiz.
- `validateQuizPayload` (`utils/validators.js`) branches on `type`: a trivia quiz requires every result to have numeric `minScore`/`maxScore`, and at least one question to have an option marked `'correct'` (otherwise the quiz is unwinnable by construction).

One seeded example: `bollywood-trivia` ("How Well Do You Know Bollywood?") — 5 factual questions, 3 score tiers (0-1, 2-3, 4-5 correct).

## Games

Unlike Quiz/Post/FriendshipQuiz, a game has no admin-authored data to store — the game itself is code, not content someone types into a form. So there's no `Game` model and no admin CRUD; the backend's only job is anonymous play-count analytics, mirroring `PlaySession`/`recordPlay` exactly but keyed by a plain `gameSlug` string instead of a `Quiz` document reference (`GameSession.js`, `gameController.js`). `GAME_SLUGS` in `gameController.js` is the equivalent of `Quiz`'s category enum — a fixed allowlist a play must match, since there's no database document to look up and validate against. Seven games live today, all played entirely client-side (see `FRONTEND.md`): Tic-Tac-Toe (unbeatable minimax AI), Rock Paper Scissors (uniform-random AI — a single round has no information to exploit, unlike Tic-Tac-Toe's solved state space, so random is the fair baseline), Memory Match, 2048, Word Guess, Guess the Number, and Sudoku. Every game past the first two is a solo game with no "opponent" in the adversarial sense — they still fit the same `win`/`loss`/`draw` outcome enum (Memory Match and Sudoku only ever report `win`, since neither has a lose condition; the others have genuine win/loss states). Since games have no database row, the same lack of backend content applies to their share previews too — see `shareGameIntro` and `GAME_META` under "Link previews" above.

## Two-player Tic-Tac-Toe

A real async match against a friend — deliberately a separate system from the single-player-vs-AI Tic-Tac-Toe above, not a mode of it. New model, `TicTacToeGame`: `code` (shareable, same `crypto.randomBytes(6).toString('base64url')` generator used throughout the app), `board` (9-element array, `''`/`'X'`/`'O'`), `playerXName`/`playerOName` (`playerOName` null until a friend joins), `currentTurn`, `status` (`'waiting'` → `'in_progress'` → `'finished'`), `winner` (`'X'`/`'O'`/`'draw'`/null).

- **No accounts, so no server-side concept of "which browser is X."** The creator is always `X` and always goes first; whoever opens the invite link and fills in the join form becomes `O`. `POST /:code/move` takes an explicit `{ role, cell }` in the body — the *frontend* is what remembers which role a given browser is playing (see `FRONTEND.md`), and the backend's only real defense is rejecting a move if `role !== currentTurn`, i.e. it doesn't matter whether the client lied about its role, since the server always checks against the authoritative `currentTurn` before applying anything.
- **Joining is idempotent**, same reasoning as `QuizCompare`'s join: once `playerOName` is set, a repeat `POST /:code/join` just returns the current state instead of erroring or overwriting the real second player (protects against double-submits or a third person opening an already-used link).
- **Win/draw checking** is a plain 8-line-combination scan against the 3x3 board, run after every move — no minimax here, since this isn't an AI opponent to out-think, just a rules check.
- The rate limiter (`ticTacToeLimiter`) is applied only to the three write routes (create/join/move) in `ticTacToeRoutes.js` directly, not mounted broadly like some other limiters — `GET /:code` is deliberately left unlimited since the frontend polls it every few seconds while waiting for the opponent's move, and rate-limiting that would break the wait experience.

## Memes

Not a new model — `category: 'meme'` on the existing `Post` model, which is why it got clone/scheduled-publishing/activity-log/search-filter for free (all of that already worked generically on `Post`). Two fields flip meaning for this one category: `imageUrl` becomes required (must start with `http://`/`https://`), and `text` becomes an optional caption instead of the required content.

**Why paste-a-URL instead of a real upload:** there's no file storage set up yet (no cloud bucket, no server-disk pipeline), and a server-disk upload would silently break the first time this deploys to Render/Railway (most hosts wipe the filesystem on every redeploy). Pasting a link to an already-hosted image works today with zero new infrastructure, and can be swapped for a real upload pipeline (e.g. Cloudinary) later without changing the data model — `imageUrl` would just start pointing at Twegle's own storage instead of an external host.

`shareController.js`'s `sharePost` now includes an `og:image` tag (and `twitter:image`, and upgrades `twitter:card` to `summary_large_image`) whenever a post has an `imageUrl` — meaningfully better than the older text-only preview cards, since a shared meme's WhatsApp/Instagram preview shows the actual image, not just a title.

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

A lightweight audit trail — not a generic library, just a Mongoose model (`ActivityLog`) and one helper (`logActivity()` in `utils/activityLog.js`) called from every quiz/post/friendship-quiz create, update, and delete controller. Records who (`admin`/`adminName`, `adminName` denormalized so the log still reads right if that account is later removed), what action, what resource type, and a short `resourceLabel` (denormalized too, for the same reason, and because a deleted resource obviously can't be looked up afterward). Deliberately fire-and-forget: `logActivity()` swallows its own errors (logging to the server console instead) so a logging failure can never break the actual create/update/delete it's describing. `GET /api/admin/activity` returns the 200 most recent entries, newest first, viewable by all three roles.

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

## Folder structure

```
backend/src/
  server.js              Express app + route wiring
  config/db.js            MongoDB connection (real or dev in-memory)
  models/                 Admin, Quiz, Post, Story, PlaySession, PostEngagement,
                           Engagement, FriendshipQuiz, FriendshipInstance,
                           FriendshipAttempt, ActivityLog, GameSession, QuizCompare,
                           Feedback, TicTacToeGame (Mongoose schemas)
  controllers/             business logic per resource, incl. shareController.js,
                           postEngagementController.js, storyController.js,
                           engagementController.js, friendshipQuizController.js,
                           friendshipInstanceController.js, sitemapController.js,
                           activityLogController.js, gameController.js,
                           quizCompareController.js, feedbackController.js,
                           ticTacToeController.js
  routes/                  URL → controller wiring + role requirements, incl. shareRoutes.js,
                           storyRoutes.js, adminStoryRoutes.js, engagementRoutes.js,
                           adminEngagementRoutes.js,
                           friendshipRoutes.js, adminFriendshipRoutes.js, activityRoutes.js,
                           gameRoutes.js, feedbackRoutes.js, adminFeedbackRoutes.js,
                           ticTacToeRoutes.js
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
- Every item from the original "strengthen before launch" list (see `DEVELOPMENT_PLAN.md` §12) is now done, including clone, activity log, and scheduled publishing.
- **Deploy somewhere public** — right now everything only runs on this machine. Going live means: MongoDB Atlas (replacing the local MongoDB), a host for this backend (Render/Railway), and a host for the frontend (Vercel) — all one-time setup steps already listed in `DEVELOPMENT_PLAN.md`. Remember the sitemap hosting-rewrite step (see "SEO" above) once that happens.
- Content variety is inherently ongoing — more quiz topics, more posts, more friendship-quiz templates, whenever there's an appetite for them.
