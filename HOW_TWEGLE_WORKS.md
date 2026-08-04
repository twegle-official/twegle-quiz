# How Twegle Works — Plain-Language Guide

**This is a living document.** Every time something is added, removed, or changed on the site (for visitors or for admins), this file gets updated in the same session, so it always describes what the app actually does today — not a history of how it got there (see `APPLICATION_FLOW.md` for that kind of changelog). No code, no technical jargon — if someone with zero coding background reads this, they should understand what Twegle does and how it works.

**Last updated:** 2026-08-04 (added: Friendship Quiz results now have a "🏆 Challenge Your Friend" button that re-shares the original invite link, not just the score; every quiz/post/story result page now also nudges toward one other content type — a game, plus a post or quiz — so a visitor never dead-ends after finishing one thing; fixed the Back button not scrolling to top after following one of those links)

---

## What Twegle is, in one paragraph

Twegle (`twegle.in`) is a free entertainment website — quizzes, jokes, quotes, games, short stories, and daily horoscopes, in English and Hindi. Nobody needs to sign up or log in to use it; you just open the site and start playing, reading, or laughing. It's designed to be shared — every quiz result, joke, or game outcome has a "share" button, so the site grows mainly through people sending things to friends on WhatsApp, Instagram, etc.

There are two completely separate sides to the app:
- **The public website** — what any visitor sees at `twegle.in`. No login.
- **The admin panel** — where content is added/edited/removed, at `twegle.in/admin`. Login required.

---

## Part 1: The Public Website (what visitors see)

### The homepage

The homepage has tabs across the side (or top, on mobile) for each type of content: Quizzes, Friendship Quiz, Memes, Games, Stories, Horoscope, Jokes, Funny Lines, Quotes, Motivational Quotes. Clicking a tab shows a grid of that content type. There's also:
- An **EN / हिंदी** toggle to switch every piece of content between English and Hindi.
- A **Newest / Trending** toggle to sort content either by "just added" or "most played/viewed."
- A **search bar** in the header that searches across quizzes, posts, and friendship quizzes at once.
- A **"Quiz of the Day"** banner at the top — one quiz is automatically featured each day (the same one for everyone, changes daily); if you complete that specific quiz, a "streak" counter goes up, encouraging people to come back daily (like Wordle).
- A **dark mode toggle** in the header — switches the whole site to a dark color scheme, remembered for next time.

### Quizzes

Personality-style quizzes ("What's Your Skincare Personality?", "Which K-pop Idol Position Are You?", etc.) and a few trivia-style quizzes ("How Well Do You Know Bollywood?"). You answer 5 questions one at a time, then land on a result page showing your personality type (or score, for trivia quizzes) with a fun description. From there you can:
- Share the result as a **branded image** (auto-generated, looks good on Instagram/WhatsApp Stories) or as a plain link.
- **Compare with a friend** — send them a link to take the same quiz; when they finish, you both see a side-by-side "did you match?" reveal, which can also be shared as its own branded side-by-side image (not just a plain link).
- See a few **"You might also like"** suggestions for other quizzes, plus a small "play a game" / "quick fun" prompt pointing at something completely different, so there's always a next thing to do.
- **Report** the quiz if something's wrong or offensive.

### Friendship Quiz ("How well do you know me?")

A two-person format. One person answers 8 questions about themselves, gets a shareable link, and sends it to friends. Each friend who opens the link guesses what the first person would have said — no peeking at the real answers first — then sees their own score (e.g. "6/8 correct") plus a right/wrong breakdown, a "🏆 Challenge Your Friend" button that re-shares the *original* link (so a new friend can also take a guess), and can share their own score to pull in more friends. The same original link can be reused by many different people, so one setup can generate many rounds of sharing.

### Memes, Jokes, Funny Lines, Quotes, Motivational Quotes

Five simple content types — short, quick things to read and share. Memes are images (with an optional caption); the other four are short text cards with a colorful background. Each one can be:
- **Reacted to** directly on its card — tap 😂, 🔥, 😭, or 👍 without even opening it. Tap again to change your reaction.
- **Shared** — either from the card itself (a small 🔗 icon) or from its own full page.
- **Downloaded as an image** (memes) or **shared as a branded image** (the text ones).

### Games

Seven small browser games, all playable instantly, no download: Tic-Tac-Toe (vs. an unbeatable computer, or challenge a friend via link for a real back-and-forth match), Rock Paper Scissors, Memory Match, 2048, Word Guess, Guess the Number, and Sudoku. Four of them (2048, Memory Match, Word Guess, Guess the Number) have a **leaderboard** — after finishing, you can save your score with a nickname and see how you rank against everyone else who's played.

### Stories

Original short stories across 6 categories (Horror, Comedy, Romance, Mystery, Moral Tales, Motivational). Each one can be read on-screen or **listened to** — a "🔊 Listen to this story" button uses the phone/browser's built-in text-to-speech, so no recording or narrator was needed.

### Horoscope

All 12 zodiac signs, each with a Day/Week/Month/Year horoscope, written to be funny and India-specific (family WhatsApp groups, "shaadi kab karoge," chai stalls, EMI reminders, etc.) rather than generic astrology. Purely for entertainment — a small disclaimer makes that clear. The horoscope text for any given sign/period/day is always the same for everyone (not personalized), but changes automatically as the date changes.

### Achievement badges

A "🏆 My Badges" page (linked from the footer) tracks 7 lightweight achievements — things like beating the house 3 times, trying every game, completing 5 quizzes, or getting a perfect score on a trivia quiz. Earning one shows a brief popup in the corner of the screen. Like the daily streak, this is tracked only in your browser, no account needed.

### Other things anyone can do

- **Give feedback** or **report a problem** with any piece of content, via a Feedback page — no account needed, goes straight to the admin team.
- Read the **Privacy Policy**, **Terms of Service**, and **About/Contact** pages.
- Follow Twegle's social media accounts (Instagram, Facebook, YouTube, LinkedIn) via icons in the footer.

None of this requires creating an account. The site quietly remembers an anonymous ID in your browser (not tied to your name/email/anything personal) purely so it can count "how many people played this" and remember things like your reaction picks and daily streak.

---

## Part 2: The Admin Panel (`twegle.in/admin`)

This is where content is created, edited, and monitored. Login required.

### Who can do what

| Role | Can do |
|---|---|
| **Analyst** | View content and analytics only — can't create, edit, or delete anything |
| **Editor** | Everything Analyst can do, plus create/edit/delete/publish content |
| **Superadmin** | Everything Editor can do, plus create/remove other admin accounts |

There's no "sign up" for admins — a Superadmin creates every admin account manually from the Admins page.

### Managing content

Each content type (Quizzes, Posts [jokes/funny lines/quotes/motivational/memes], Stories, Friendship Quizzes) has its own list page in the admin panel, where you can:
- **Search and filter** by category, language, or published/draft status.
- **Create new** content through a form.
- **Edit** or **delete** existing content.
- **Clone** an existing item as a starting point for a new one, instead of starting from scratch.
- **Schedule** something to go live automatically at a future date/time, instead of publishing it immediately.

### Quick Add

A fast shortcut for jokes, funny lines, quotes, and motivational quotes (not memes, which need an image): pick a category, type the text into one box, hit Publish. No drafts, no extra fields — meant for adding something quickly from a phone.

### Content freshness flags

The Quizzes and Posts lists show a small **"⚠️ Needs a refresh"** badge next to anything that's been live a while (2+ weeks) but has barely been played or viewed — a nudge to reword it, reshare it, or leave it as-is. Every item also now shows its actual play/view count right in the list.

### Bulk Import

A way to add many pieces of content at once instead of one form at a time. Two modes: **Posts** — paste a list of jokes/quotes/etc. (one per line), pick a category and language, and every line becomes its own published post. **Quizzes** — paste a block of quiz data (in the same format the regular quiz form saves) to create several quizzes in one go — useful if quizzes were drafted somewhere else first (a spreadsheet, ChatGPT, etc.). Either way, each item is checked the same way the normal forms check it, and anything that fails is reported individually rather than blocking the whole batch.

### Analytics

A dashboard showing which quizzes, posts, friendship quizzes, games, and stories are actually getting played/viewed/shared the most — so it's obvious what's working and what isn't, without guessing. At the top, a **"This week" summary** gives three quick numbers (plays this week, views/shares this week, new content published this week) without needing to scroll through every table.

### Activity log

A running record of who (which admin) created, edited, or deleted what, and when — useful once more than one person has admin access.

### Feedback inbox

Every message submitted through the public Feedback page (plus every "Report" flagged on a piece of content) lands here, newest first, with a way to mark things as read/handled.

---

## The short version

**Visitors:** open the site, no login, pick something (quiz/joke/game/story/horoscope), enjoy it, optionally share it or react to it. That's the entire loop — repeated across many content types, all designed to be quick to consume and easy to reshare.

**Admins:** log in, add/edit/schedule content through the admin panel, keep an eye on what's performing well via Analytics and freshness flags, and handle visitor feedback/reports.
