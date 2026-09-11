# Twegle Quiz — Original Plan

**Status:** Historical — the original one-time blueprint written before the
site was built. Frozen on purpose, not a living document: everything
current is tracked in `HOW_TWEGLE_WORKS.md`, `APPLICATION_FLOW.md`, and
`PENDING_TASKS.md` instead (confirmed 2026-08-20 that nothing here exists
only here). Kept as a record of the original thinking, not updated as the
app changes.
**Owner:** Ashish (non-technical, product/business owner)
**Last updated:** 2026-07-30 (original), renamed from `DEVELOPMENT_PLAN.md` 2026-08-20

## 1. Goal

A B2C quiz/personality web app ("What's your skincare type", "Which Bollywood era are you", etc.) designed to be shared organically on Instagram/TikTok, monetized through display ads and affiliate links. No customer support or manual outreach required to run it day-to-day — growth comes from social sharing, not sales.

## 2. Access Model — Who Logs In and Why

| User type | Login required? | Why |
|---|---|---|
| **Quiz taker (end user)** | **No** (guest by default) | Every login step loses social-traffic conversions. Anonymous ID (cookie/localStorage) is enough to track completions and serve ads. |
| **Quiz taker — optional account** | Optional, added later | Only if you want result history, leaderboards, or referral rewards. Never blocks the core "take quiz → see result → share" loop. |
| **Admin (you / any staff)** | **Yes, always** | Role-based login required to manage content and view revenue data. |

### Admin roles (multi-role, as requested)
- **Super Admin** — full access: manage admins, all quizzes, monetization settings, analytics.
- **Content Editor** — create/edit quizzes, questions, results, images. No access to revenue/ad config.
- **Analyst** — read-only access to traffic, completion, and revenue dashboards.

## 3. End-to-End Functionality (User Journey)

1. User sees a quiz link/ad on Instagram/TikTok → taps → lands on quiz page (web, mobile-responsive, no app install needed).
2. Quiz starts immediately — no signup wall.
3. User answers questions (single choice, one screen per question, progress bar).
4. On completion → Result page: personality/type result, shareable image (auto-generated with the app's branding), share buttons (Instagram Story, TikTok, WhatsApp, copy link), and 1–2 native ad slots / affiliate product recommendations relevant to the result (e.g., skincare quiz → skincare affiliate links).
5. User can retake, browse other quizzes, or leave — no forced registration at any point.
6. (Phase 2, optional) User can tap "Save my result" → lightweight signup (email or Google) → gets result history + notified of new quizzes.

### Admin journey
1. Admin goes to `/admin` → login (email + password, role-based).
2. **Super Admin**: manages other admin accounts, ad network config, affiliate link config, sees full analytics.
3. **Content Editor**: creates a new quiz → adds questions → adds answer options → maps each option to a result/personality type → publishes.
4. **Analyst**: views dashboards only (quiz plays, completion rate, shares, estimated ad revenue).

## 4. Feature Scope

### MVP (Phase 1)
- Public quiz-taking flow (guest, no login)
- Shareable result pages with OG image tags (so links preview nicely on social)
- Admin panel with role-based login (3 roles above)
- Quiz builder in admin (questions, options, result types — no code needed to add a new quiz)
- Ad slot placement (Google AdSense) on result pages
- Affiliate link placement per result type
- Basic analytics: plays, completions, shares, drop-off per question

### Phase 2
- Optional end-user accounts (save results, history)
- ~~Leaderboards / "compare with friends" features~~ — **built ahead of schedule** two ways: as Friendship Quizzes (2026-07-27, "How well do you know me?") and later as "Compare with a friend" on the regular quizzes (2026-07-29, real personality results on both sides instead of one guessing the other), see section 12
- Push notifications (if PWA installed)
- A/B testing on quiz questions or ad placements

### Phase 3 (only if Phase 1–2 prove traction)
- Native mobile app wrapper (Capacitor) for app store presence
- Deeper affiliate/ad network integrations, sponsored quizzes

## 5. Tech Stack

- **Frontend (end user + admin):** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express (REST API)
- **Database:** MongoDB (Atlas free tier to start)
- **Hosting:** Vercel (frontend), Render or Railway (backend), MongoDB Atlas (DB)
- **Auth:** JWT-based, admin-only (end users stay anonymous in MVP)
- **Monetization:** Google AdSense (display ads), affiliate networks (Amazon Associates, etc.)

## 6. High-Level Data Model

- **Quiz**: title, slug, cover image, category, status (draft/published), createdBy
- **Question**: belongs to Quiz, text, order, image (optional)
- **Option**: belongs to Question, text, maps to one or more Result "weights"
- **Result**: belongs to Quiz, title, description, image, affiliate links, share text/OG image
- **Admin**: name, email, password (hashed), role (superadmin/editor/analyst)
- **PlaySession**: anonymous ID, quiz ID, answers given, result shown, timestamp, referrer source
- **AdConfig / AffiliateLink**: network, placement rules, target result/category

## 7. Non-Technical Tasks (things only you can do — one-time setup, not ongoing)

- Register a domain name
- Create hosting accounts (Vercel, Render/Railway, MongoDB Atlas) — free tiers to start
- Apply for Google AdSense (requires site review, identity info)
- Sign up for affiliate programs relevant to your quiz niches (e.g., Amazon Associates)
- Set up a business/ad account on Meta/TikTok if you plan to run paid promotion
- (Phase 3 only) Apple Developer account ($99/yr) and Google Play Developer account ($25 one-time) if going native

These are one-time signups, not ongoing communication — no customer support needed for the core product.

## 8. Development Phases / Milestones

1. **Foundation** — repo setup, DB schema, backend API skeleton, admin auth with roles
2. **Admin panel** — quiz builder UI, role-gated views
3. **Public quiz flow** — quiz-taking UI, result pages, sharing
4. **Monetization hookup** — ad slots, affiliate link injection
5. **Analytics dashboard** — for Analyst role
6. **Polish & launch** — mobile responsiveness check, first real quiz content, social share testing
7. **(Later)** Optional accounts, native app wrapper

## 9. Legal & Compliance (kids + broad audience will use this)

Since the audience is unrestricted (kids, teens, adults, any gender) and no age verification is realistic in a guest-first flow, the safest approach is to **avoid the legal problem instead of solving it after the fact**:

- **No personal data collection in the core flow.** Guests take quizzes anonymously (device/browser ID only, no name/email/DOB/photo). This avoids triggering COPPA (US, under-13) and GDPR-K (EU, under-16) obligations, which exist specifically to regulate collection of children's personal data — if we don't collect it, most of the obligation doesn't apply.
- **Optional accounts (Phase 2) get an age gate.** If/when login is added, include a simple age check and route accordingly (no targeted ads or data retention for users who indicate they're under 13/16).
- **Ads: non-personalized by default.** Configure Google AdSense to serve non-personalized/contextual ads rather than behaviorally-targeted ones, since we can't reliably distinguish child visitors from adults. This also satisfies AdSense's own child-directed content policies.
- **Affiliate links: always disclosed.** Any affiliate/sponsored link is labeled ("contains affiliate links") near the placement — required by FTC guidelines (US) and equivalent consumer protection rules elsewhere.
- **Cookie consent banner.** Required for GDPR/ePrivacy compliance in the EU/UK; keep it simple — essential cookies only unless the user accepts analytics/ad cookies.
- **Required legal pages:** Privacy Policy, Terms of Service, Cookie Policy — linked in the footer of every page from day one, not added later.
- **Content policy:** all quiz content must be family-friendly (PG) — no mature themes, profanity, or content requiring age-restriction, since the audience is explicitly "anyone."
- **Stories must be original writing, not adapted from existing published fiction.** The read-aloud feature uses only the browser's built-in Web Speech API (no recorded/licensed voice), so the only copyright exposure is the story *text* itself — safe as long as stories are written fresh (or are genuinely public-domain), risky if adapted from copyrighted published work. All 8 starter stories were written from scratch for this feature.

This is a solid legal foundation but not a substitute for a lawyer if the app starts generating meaningful revenue or scale — flagging that plainly so it's a known tradeoff, not a blind spot.

## 10. Broad Appeal Design (kids, teens, male, female, everyone)

- **Simple language.** Short sentences, no jargon, works for a 10-year-old and a 40-year-old equally.
- **Neutral-to-vibrant visual style**, not gendered (avoid defaulting to pink-for-girls/blue-for-boys); bright, playful, high-contrast UI reads well across age groups.
- **Fast and mobile-first.** Most traffic will be on phones from a social app's in-app browser — pages must load fast and work inside those embedded browsers, not just standalone mobile Safari/Chrome.
- **Short quizzes** (5–10 questions) — attention spans vary widely across the target audience; shorter completes better for everyone.
- **Accessible by default** — legible font sizes, good color contrast, alt text on images, so it works for as wide an audience as possible without extra effort later.

## 11. Documentation Plan

As each part is built, a companion `.md` file will be created alongside the code explaining what it does and how to use/understand it (e.g., `BACKEND.md`, `FRONTEND.md`, `ADMIN_GUIDE.md`, `API.md`). This plan file will be updated if scope changes.

## 12. Next Phase — Strengthening the Site Before Launch

MVP is functionally complete (25 quizzes + 91 posts + 8 stories + 4 friendship-quiz templates in EN/HI, full admin CRUD with 3 roles, security hardening, shareable images, link previews, Trending/Newest sort, sidebar filters). You've decided to hold off on going live until the site feels "strong enough" rather than launching now — this section is what "strong enough" means concretely, split by side. Recommended build order below; content-writing items (marked *content*) don't need engineering time, just your input.

**Every item below is now done.** This section is kept as a record of what "strong enough" turned out to mean, not an active backlog.

### Admin panel (content-ops side)

| # | Feature | Why it matters | Effort |
|---|---|---|---|
| 1 | ~~**Search & filter in admin lists**~~ **— Done (2026-07-27)** | Quiz/Post lists are one long unfiltered list — already awkward at 20+65 items, will only get worse. Search box + category/language/status filter, backed by real backend filtering. | Small |
| 2 | ~~**Duplicate/Clone a quiz or post**~~ **— Done (2026-07-28)** | One-click copy of an existing quiz/post as a starting point — makes spinning up a Hindi version of an English quiz (or a similar joke) much faster than retyping from scratch. Extended to friendship-quiz templates too. | Small–Medium |
| 3 | ~~**Post view/share analytics**~~ **— Done (2026-07-27)** | Extends the existing quiz-play tracking to posts too — completes the picture of what content actually gets engagement. | Medium |
| 4 | ~~**Activity log (who did what)**~~ **— Done (2026-07-28)** | An audit trail of who created/edited/deleted/published each quiz or post, and when. Not urgent while you're the only admin, but worth having before inviting an Editor/Analyst. Covers friendship-quiz templates too. | Medium |
| 5 | ~~**Scheduled publishing**~~ **— Done (2026-07-28)** | Set a quiz/post to auto-publish at a future date/time instead of instantly — lets you line up a steady content calendar matching your social posting cadence. Implemented without a cron job — the public API just checks the publish date on every request. Covers friendship-quiz templates too. | Medium |
| 6 | ~~**Admin panel left-sidebar nav**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request. The single top nav bar was already tight on one line (6 nav links + user name/role + logout); moved to a left sidebar (sticky on desktop, stacks as a simple top bar on mobile) — the more standard admin-panel layout, with room to add more nav items later without recrowding. | Medium |
| 7 | ~~**Admin list pagination**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request, ahead of actually needing it (24 quizzes / 91 posts / 4 friendship quizzes today). All three admin lists now paginate server-side, 20 per page, so the lists keep loading fast as content keeps growing rather than needing a fix later once it's genuinely slow. | Small–Medium |
| 8 | ~~**Collapsible sidebar**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request right after the sidebar itself shipped. Collapses to a 64px icon-only rail on desktop (persisted via `localStorage`) to reclaim width when the full nav labels aren't needed. | Small |
| 9 | ~~**Admins page layout fix**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request. The page was capped at `max-w-2xl`, leaving roughly half of any normal screen empty; restructured into a two-column form+list layout using the full content width, matching every other admin page. | Small |
| 10 | ~~**Feedback inbox**~~ **— Done (2026-07-30)** | Also not originally on this list — added on request alongside the public Feedback page below. Paginated admin list of visitor feedback, unread highlighting, mark-read/delete for Editor/Super Admin. | Small |

### User portal (public site side)

| # | Feature | Why it matters | Effort |
|---|---|---|---|
| 1 | ~~**Real Privacy Policy & Terms of Service**~~ **— Done (2026-07-27)** | Needed for AdSense approval later, and makes the site look legitimate to any visitor today, launched or not. | Small (content) |
| 2 | ~~**About/Contact section**~~ **— Done (2026-07-27)** | Small trust-builder — a site with zero "who's behind this" info reads as less credible, especially to a first-time visitor from social media. | Small (content) |
| 3 | ~~**SEO groundwork**~~ **— Done (2026-07-27)** | Unique page title + meta description per quiz/post, `sitemap.xml`, `robots.txt`, basic structured data (schema.org). So Google indexes everything correctly the moment you do go live, instead of starting from zero. | Medium |
| 4 | **More quiz/post content variety** *(content)* | New quiz topics, more jokes/quotes. This is what actually drives the share loop the whole app depends on — content variety compounds, unlike one-time engineering work. **A batch was added 2026-07-28** (2 new quiz topics, 20 posts, 1 friendship-quiz template, all EN+HI) but this line item never really "completes" — treat it as a standing invitation, not a task to close. | Ongoing (content) |
| 5 | ~~**Friendship Quizzes ("How well do you know me?")**~~ **— Done (2026-07-27)** | Not originally on this list — added directly on the owner's request as a high-viral-loop format: one person answers about themselves, friends guess and get scored, each score is itself shareable. Realizes the "compare with friends" idea from section 4's original Phase 2 sketch, built early because of its growth potential. | Large |
| 6 | ~~**Memes**~~ **— Done (2026-07-28)** | Also not originally on this list — added on request as a new shareable content type (image + optional caption). Reused the existing Post infrastructure (clone, scheduling, activity log, search) rather than building a parallel system. Uses paste-a-URL for the image for now, since no cloud storage exists yet — real uploads are a later infrastructure task, not a data-model change. | Medium |
| 7 | ~~**Compare with a friend (regular quizzes)**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request. Applies the "share a link, friend plays too" growth loop to the regular single-player quizzes: unlike Friendship Quizzes (one person answers, others just guess), both people take the real quiz and get a real personality result, revealed together with a match/no-match banner. New `QuizCompare` model; no changes to the `Quiz` model or its existing client-side scoring. | Medium |
| 8 | ~~**Games**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request as a new interactive content type, distinct from every other item on this list since games aren't admin-authored content (there's no data to type in, the game is code). Grew from 2 to 6 games over the session: Tic-Tac-Toe (unbeatable minimax AI), Rock Paper Scissors (random AI — a single round has no information to exploit, so random is the fair baseline), Memory Match, 2048, Word Guess, and Guess the Number. Chosen as single-player-vs-house rather than real two-player, since it needs no new backend infrastructure (just an anonymous play-count ping, same pattern as quiz plays) and fits the existing architecture — an async two-player version (like the compare-link pattern) was considered more viral but a bigger lift, still on the backlog as a fast-follow if this proves popular. | Medium |
| 9 | ~~**"Share Twegle" button**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request. Every quiz result and post already had real share buttons, but there was no way to share the site itself (as opposed to one specific quiz/post). First built as a footer section; redesigned per feedback into a persistent floating share rail fixed to the left edge of the viewport (the more common placement on other sites), with the footer version kept as a fallback for mobile and for the homepage (where the rail would collide with the homepage's own left filter column). | Small |
| 10 | ~~**Tagline ("Where Fun Goes Viral")**~~ **— Done (2026-07-29)** | Also not originally on this list — added on request. Placed next to the logo in the public header and in the homepage hero band; deliberately not added to the admin panel's header (already tight on space — see the Admin panel table above, items 6-7). | Small (content) |
| 11 | ~~**Feedback page**~~ **— Done (2026-07-30)** | Also not originally on this list — added on request. A public `/feedback` page (textarea + optional email, no account needed) separate from the affiliate/contact email, linked from the footer. | Small |
| 12 | ~~**Share before attempting**~~ **— Done (2026-07-30)** | Surfaced 2026-07-29 as a gap: every existing share button was tied to *after* finishing something (a result, a score, a game outcome). Now every content tile (quizzes, games, jokes/quotes/memes, friendship quizzes) carries a 🔗 share icon via a shared `TileShareButton` component — generalized the same day from an initial quizzes-only version. | Small–Medium |
| 13 | ~~**Sudoku**~~ **— Done (2026-07-30)** | Also not originally on this list — added on request, a 7th game. Generated from one closed-form solved pattern scrambled via standard Sudoku symmetry operations, not a full backtracking generator. | Medium |
| 14 | ~~**PWA support**~~ **— Done (2026-07-30)** | This *was* originally on the backlog (`PENDING_TASKS.md`'s "Suggested, not started" list), pulled forward on request. Installable + offline-capable for viewed pages via `vite-plugin-pwa` — not a native app (see Phase 3 below for that distinction). | Medium |
| 15 | ~~**Homepage hero/tab-order/mobile-filter polish**~~ **— Done (2026-07-30)** | Also not originally on this list — added on request after using the site on a phone. Shrunk the hero band, reordered tabs by expected usage, and fixed the tab/category rows wrapping across multiple lines and pushing all real content below the fold on mobile. | Small–Medium |
| 16 | ~~**"Trending on Social Media" quiz category**~~ **— Done (2026-07-30), removed (2026-07-31)** | This *was* on `PENDING_TASKS.md`'s "Suggested, not started" list (recommended there since it fits the "Where Fun Goes Viral" tagline directly), pulled forward on request. 2 launch topics — "Which Viral Reel Trend Are You?" and "Which Meme Format Are You?" — in English and Hindi. Taken back out one day later at the owner's direct request. | Small–Medium |
| 17 | ~~**Report a quiz/post**~~ **— Done (2026-07-30)** | This *was* on `PENDING_TASKS.md`'s backlog, pulled forward on request. Reuses the `Feedback` model/admin-list rather than a separate system, exactly as the original suggestion recommended. | Small |
| 18 | ~~**Non-personality (trivia) quizzes**~~ **— Done (2026-07-30)** | Surfaced 2026-07-29 as needing "a real design discussion" — resolved by reusing the existing option/result schemas with a different convention (`result: 'correct'/'incorrect'`, `minScore`/`maxScore` on results) instead of a parallel model. One example seeded ("How Well Do You Know Bollywood?"). | Medium |
| 19 | ~~**True two-player async Tic-Tac-Toe**~~ **— Done (2026-07-30)** | This *was* flagged as "a bigger lift (new backend model/endpoints, turn-based state)" — built as a new `TicTacToeGame` model + `/api/tictactoe/*` routes, separate from the single-player-vs-AI game, with each browser remembering its own role (X/O) in localStorage since there are no accounts. | Medium |
| 20 | ~~**"Trending on Social Media" quiz category, removed**~~ **— Done (2026-07-31)** | Not a build item — a reversal. Owner decided against keeping the category just one day after it launched; fully reverted (enum, filter chip, admin dropdowns, seeded content, database documents) rather than left disabled. 29 → 25 quizzes live. | Small |
| 21 | ~~**Stories**~~ **— Done (2026-07-31)** | Also not originally on this list — the owner asked whether a "Stories" content type with a read-aloud voice feature was a good idea and whether it risked copyright issues; recommended yes on both counts provided the narration used the browser's free built-in Web Speech API (no recorded voice, no licensing risk) and the story text was original writing. New `Story` model (6 categories: Horror/Comedy/Romance/Mystery/Moral Tales/Motivational), full admin CRUD, a "🔊 Listen to this story" button, 8 original stories seeded (6 EN + 2 HI). | Medium |
| 22 | ~~**Unified view/share engagement tracking (Quiz/Friendship Quiz/Games/Stories)**~~ **— Done (2026-07-31)** | Also not originally on this list — after Stories launched with no view/share analytics, the owner asked whether that same gap applied to Quiz, Friendship Quiz, and Games too. It did (each only tracked completions, not views/shares), so all four got the tracking Post already had, in one pass via a shared `Engagement` model rather than three more one-off ones. 4 new tables in admin Analytics. | Medium |
| 23 | ~~**Sticky filter sidebar scroll-jump fix**~~ **— Done (2026-07-31)** | Reported directly. First attempt clamped the scroll reset so the sidebar's on-screen position never visibly moved — worked, but landed at a different offset per tab depending on content length, which read as inconsistent. Reworked the same day to a plain, unconditional `scrollTo(0, 0)` on every filter/tab click, trading "sidebar never moves" for "every click lands at the same predictable place." | Small–Medium |
| 24 | ~~**Trending/Newest sort generalized to every tab**~~ **— Done (2026-07-31)** | Requested directly — the sort toggle only worked on Quizzes. Now every tab sorts real data: play/attempt counts where they exist, a new aggregated `totalEngagement` (views+shares) field for posts/stories, reversed registry order for Games (no `createdAt`). | Medium |
| 25 | ~~**Funny Lines tab reorder**~~ **— Done (2026-07-31)** | Requested directly — Funny Lines now immediately follows Jokes, grouping the two one-liner formats ahead of Quotes/Motivational. | Small |
| 26 | ~~**Dark mode**~~ **— Done (2026-07-31)** | Requested directly ("fast, visible, broad appeal"). Manual light/dark toggle across the public site, persisted via `localStorage`, no flash of the wrong theme on load. Admin panel intentionally out of scope, since this was requested as a user/GenZ-facing feature. | Medium |
| 27 | ~~**Horoscope**~~ **— Done (2026-07-31)** | This *was* on `PENDING_TASKS.md`'s "Suggested, not started" list (a light/funny astrology idea), pulled forward on request. All 12 zodiac signs, Day/Week/Month/Year, English + Hindi — entirely computed at request time from a deterministic trait+action formula, no database rows and no cron job needed. | Medium |

### Recommended order (as actually built)

1. Real legal pages + About (quick, needed regardless of launch timing, builds trust now)
2. Admin search & filter (quick, immediately useful given current list sizes)
3. Post view/share analytics (completes the data story, informs what content to prioritize)
4. Friendship Quizzes (added outside this list's original order, on the owner's direct request)
5. SEO groundwork (once page content/structure was stable)
6. Admin clone/duplicate + activity log + scheduled publishing (all built together in one pass)
7. Memes (added outside this list's original order, on the owner's direct request)
8. Compare with a friend, regular quizzes (added outside this list's original order, on the owner's direct request)
9. Games (added outside this list's original order, on the owner's direct request)
10. "Share Twegle" button (added outside this list's original order, on the owner's direct request)
11. Tagline, "Where Fun Goes Viral" (added outside this list's original order, on the owner's direct request)
12. Admin panel left-sidebar nav + admin list pagination (both added outside this list's original order, on the owner's direct request)
13. Collapsible sidebar + Admins page layout fix (both added outside this list's original order, on the owner's direct request)
14. Feedback (page + admin inbox), share-before-attempting (quizzes-only, then generalized to every content tile), and Sudoku (all added outside this list's original order, on the owner's direct request)
15. PWA support (pulled forward from the backlog) and homepage polish (hero size, tab order, mobile filter overflow), both added on the owner's direct request
16. "Trending on Social Media" quiz category (pulled forward from the backlog, on the owner's direct request)
18. Report a quiz/post, non-personality (trivia) quizzes, and true two-player async Tic-Tac-Toe (all three pulled forward from the backlog, on the owner's direct request)
20. "Trending on Social Media" quiz category removed (reversal, on the owner's direct request one day after launch)
21. Stories, a new content type with browser-based read-aloud (added outside this list's original order, on the owner's direct request)
22. Unified view/share engagement tracking for Quiz/Friendship Quiz/Games/Stories (added outside this list's original order, after the owner asked whether Stories' analytics gap applied elsewhere too — it did)
23. Sticky filter sidebar scroll-jump fix, reworked from a clamped partial-scroll approach to a simple full reset (added outside this list's original order, on the owner's direct request, reworked the same day after feedback that the first fix wasn't right)
24. Trending/Newest sort generalized to every homepage tab (added outside this list's original order, on the owner's direct request)
25. Funny Lines tab reorder (added outside this list's original order, on the owner's direct request)
26. Dark mode (added outside this list's original order, on the owner's direct request)
27. Horoscope (pulled forward from the backlog, on the owner's direct request)
19. Ongoing: keep adding quiz/post/friendship-quiz content variety throughout

Every item above is now done — see `APPLICATION_FLOW.md`'s change log for the full narrative of what shipped and when.
