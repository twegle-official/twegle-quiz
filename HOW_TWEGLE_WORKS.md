# How Twegle Works — A Simple Guide for Everyone

**This is a living document.** Every time something is added, changed, or removed on the site — for visitors or for admins — this file gets updated the same day, so it always describes what the app actually does *right now*. It is not a history of how things got built (see `APPLICATION_FLOW.md` for that). There is no code and no technical jargon here. If someone with zero computer background reads this from top to bottom, they should come away understanding exactly what Twegle does, what a visitor can do on it, and what an admin can do on it.

**Last updated:** 9 August 2026.

---

## What is Twegle, in simple words?

Twegle (`twegle.in`) is a free fun website. It has quizzes, riddles, jokes, quotes, small games, short stories, and daily horoscopes — in both English and Hindi.

Nobody has to create an account or log in to use it. You just open the site and start playing, reading, or laughing. Everything is designed to be shared with friends — every quiz result, joke, or game has a "Share" button, and that is how the site mainly grows: people send things to each other on WhatsApp, Instagram, and similar apps.

There are **two completely separate parts** to Twegle:

1. **The public website** — this is what any visitor sees at `twegle.in`. No login needed.
2. **The admin panel** — this is where the Twegle team adds, edits, and manages all the content, at `twegle.in/admin`. A login is required, and only people the team has approved can get in.

This document explains both parts, one at a time, in plain language.

---

# PART 1 — The Public Website (what a visitor sees)

## Getting started

Open `twegle.in` in any browser — on a phone, tablet, or computer. There is nothing to install (though you *can* choose to "install" it like an app on your phone if you want — more on that below), nothing to sign up for, and nothing to pay. You land straight on the homepage and can start using everything immediately.

## The homepage — where everything starts

The homepage is the hub. From here you can reach every kind of content on the site. It has:

- **A row of tabs**, one for each type of content: Quizzes, Puzzles, Friendship Quiz, Games, Posts (jokes/quotes/etc.), Stories, and Horoscope. Tapping a tab shows you a grid of that type of content, like tiles you can tap into.
- **A language switch** (EN / हिंदी) — flips everything on the page between English and Hindi.
- **A sort switch** (Newest / Trending) — "Newest" shows what was added most recently; "Trending" shows what's currently the most popular.
- **A search box** at the top of every page — type anything and it looks across quizzes, puzzles, posts, and friendship quizzes at once for a match.
- **Two daily banners** at the top — one quiz and one puzzle are picked automatically each day (the same ones for every visitor, and they change every day at midnight). Finishing the quiz keeps your Quiz streak going, and revealing the puzzle keeps your Puzzle streak going — two separate streaks (explained below).
- **A dark mode switch** — a small button that flips the whole site between a light look and a dark look. Your choice is remembered the next time you visit.
- **A "Where Fun Goes Viral" tagline and hero banner**, plus a small floating share panel on the side of the screen so you can share Twegle itself with a friend at any time, from any page.

## 1. Quizzes

These are the heart of the site. Most are **personality quizzes** — fun questions like "What's Your Skincare Personality?" or "Which K-pop Idol Position Are You?" — where you answer a short series of questions (usually around 5) and land on a result that describes "you." A few are **trivia quizzes** — like "How Well Do You Know Bollywood?" — where there are actually right and wrong answers and you get a real score at the end.

After finishing a quiz, on the result page you can:
- **Share the result** — either as a plain link, or as a nicely designed image made just for that result (great for posting to an Instagram or WhatsApp Story).
- **Compare with a friend** — send them a link to take the exact same quiz; once they finish too, you both see a side-by-side "did you match?" screen, which can also be shared as its own image.
- See a few **"you might also like"** suggestions for other quizzes to try next, plus a small nudge toward something completely different (a game, a joke) so there's always a next thing to do.
- **Report** the quiz if something about it seems wrong, broken, or inappropriate.

If you play a quiz you've already taken before, the tile for it on the homepage shows a small green checkmark, so you can tell at a glance what you've already tried.

## 2. Puzzles

Short riddles and brain-teasers. You see the question, and there's a "🔍 Reveal Answer" button — tap it whenever you're ready to see the answer, no rush. Some puzzles include a picture alongside the riddle. Every puzzle is labeled with a difficulty: **Warm-Up**, **Challenge**, or **Brain Buster**, and you can filter the list by any of those. Revealing the day's featured puzzle keeps your own Puzzle streak going, tracked separately from your Quiz streak. Puzzles you've already revealed also get the small green checkmark on their tile.

## 3. Friendship Quiz ("How well do you know me?")

This one is built for two (or more) people. One person picks a topic and answers a set of questions about themselves — favorite food, biggest fear, that kind of thing — and gets a shareable link when done. Anyone who opens that link becomes a "guesser": they try to predict what the first person answered, without ever seeing the real answers first. Once a guesser submits their guesses, they see their own score (like "6 out of 8 correct"), a full breakdown of which guesses were right or wrong, and a button to reshare the *same original link* so even more friends can take a turn guessing. One person's setup can be reused by as many friends as want to try it.

## 4. Posts — Jokes, Funny Lines, Quotes & Motivational Quotes

Four simple, quick-to-read content types, shown together in one "Posts" tab (with chips to narrow it down to just one category if you like). Each one is a short card with a colorful background. On any card you can:
- **Tap a reaction emoji** (😂 🔥 😭 👍) right on the card, no need to open it — tap again to change your mind.
- **Share it**, either straight from the card or from its own full page.
- **Turn it into a shareable image**, generated automatically from the text.

## 5. Games

Nine small games, all playable instantly in the browser — nothing to download:

- **Tic-Tac-Toe** — play against a computer that never loses (the best you can do is tie), or challenge a real friend via a shareable link for a genuine back-and-forth match.
- **Rock Paper Scissors** — one round against the computer, which picks completely randomly.
- **Memory Match** — flip cards, find the matching pairs, try to do it in as few tries as possible.
- **2048** — slide numbered tiles to combine them and reach the tile numbered 2048.
- **Word Guess** — guess a hidden word one letter at a time before you run out of tries.
- **Guess the Number** — the site picks a secret number between 1 and 100; you guess, and it tells you higher or lower.
- **Sudoku** — the classic number grid puzzle, fill it so every row, column, and box has 1 through 9.
- **Simon Says** — watch a pattern of flashing colors, then repeat it back; the pattern gets one step longer every round.
- **Whack-a-Mole** — moles pop up one at a time for less than a second each; whack as many as you can in 20 seconds.

Six of these nine (2048, Memory Match, Word Guess, Guess the Number, Simon Says, Whack-a-Mole) have a **leaderboard** — after finishing, you can save your score under a nickname and see how you stack up against everyone else who's played.

## 6. Stories

Original short stories, sorted into 6 categories: Horror, Comedy, Romance, Mystery, Moral Tales, and Motivational. You can read any story on-screen, or tap **"🔊 Listen to this story"** and have your phone or browser read it out loud to you — this uses a built-in feature every modern phone/browser already has, so there's no separate app or download needed.

## 7. Horoscope

All 12 zodiac signs, each with a horoscope for Today, This Week, This Month, or This Year. The horoscopes are written to be funny and India-specific (think family WhatsApp groups, "shaadi kab karoge," chai stalls) rather than serious astrology — a small disclaimer makes clear this is just for fun. The text for a given sign and period is the same for everyone reading it that day, and it changes automatically as the date changes — nobody has to write new horoscopes every single day.

## Daily streaks — come back every day

There are two separate streaks, one for quizzes and one for puzzles — finishing the daily quiz keeps your **Quiz streak** going, and revealing the daily puzzle keeps your **Puzzle streak** going. Each shows its own "how many days in a row" counter (like popular word games do), right on its own homepage banner. They're tracked independently on purpose — you might only ever do one of the two, and each still gets its own honest count rather than being lumped into one shared number. It's a light nudge to come back tomorrow, nothing more — there's no penalty for missing a day, a streak just goes back to zero and you can start it again anytime.

## Achievements — 10 levels to work toward

A "🏆 My Achievements" page (reachable from the header and the footer) is the site's main progression system: 10 levels, from **Fresh Face** at the very start up to **Twegle Legend** at the top, each with its own fun name and emoji. You move up by earning points from basically everything you do on the site — taking quizzes, solving puzzles, playing games, reacting to posts, sharing things, and keeping your two daily streaks alive. The page itself shows exactly how many points each action is worth, so it's never a mystery what to do next to level up. Reaching a new level pops up a small celebration with a button to share it. To keep leveling up from taking real time rather than one big session, some repeatable actions (playing the same game over and over, reacting to lots of posts) only earn points up to a point — quizzes, puzzles, and sharing don't have that limit.

There's also a public **leaderboard** (reachable from the same page) showing the top 100 accounts by points — you need a free account (see below) to appear on it, since a guest's progress only lives in their own browser with no identity to rank.

Separately, a smaller set of **7 Bonus Badges** still exists too — things like beating the computer at a game three times, trying every single game at least once, or getting a perfect score on a trivia quiz. These are a lighter side-collection, not part of the level/points system above. Whenever you unlock a level or a bonus badge, a small notification pops up in the corner of the screen to let you know.

## Sharing — how things spread

Nearly everything on Twegle has a share option, and there are three different ways to share depending on where you are:
- **A plain link** — copy it or send it directly through WhatsApp.
- **A branded image** — a nicely designed picture generated on the spot (for a quiz result, a joke, a compare-with-a-friend reveal, and more), perfect for posting as an Instagram or WhatsApp Story.
- **The device's own native share menu** — on a phone, tapping share can pop up your phone's regular share sheet, letting you send it through any app you already have installed.

## Search

The search box (always available in the header) looks across quizzes, puzzles, posts, and friendship quizzes at the same time, and shows you matching results grouped by type.

## Giving feedback or reporting a problem

There is a **Feedback page**, reachable from the footer, where anyone can type a message to the Twegle team — no account needed, an email address is entirely optional if you'd like a reply. Separately, most individual pieces of content (quizzes, posts, etc.) have their own small **"🚩 Report"** button, for flagging something specific as broken, incorrect, or inappropriate.

## Legal pages

Standard pages exist and are kept up to date: a **Privacy Policy** (what information is and isn't collected), **Terms of Service** (the rules for using the site), and an **About & Contact** page (who's behind Twegle and how to reach out). All are written in plain language, not legal jargon.

## Social media

Icons in the footer link to Twegle's Instagram, Facebook, YouTube, and LinkedIn accounts.

## Dark mode

A single toggle switches the entire public site between a light look and a dark look. It's remembered for your next visit, and it applies instantly with no flash of the wrong color when the page loads.

## Installing Twegle like an app (optional)

On a phone, most browsers let you "Add to Home Screen" for Twegle, which puts an icon on your phone just like a real app — there's now a small "📲 Add to Home Screen" button in the footer for this too, on browsers that support it. It isn't required at all — the website works the same either way — but it's a shortcut for people who visit often. Pages you've already visited also keep working even with a spotty internet connection, since the app remembers them.

## Optional accounts — no email or phone number, ever

Everything described above works completely without ever creating an account. But if you'd like your daily streaks, level/points progress, badges, and "already played" history to follow you from your phone to your computer and back, you can create a free account (the 👤 icon in the header).

Here's exactly what that involves:

- **You only ever need a username and a password.** Twegle never asks for an email address or a phone number — not at signup, not ever. There is nothing personally identifying for anyone to lose or misuse.
- You also pick a public **Gamer Tag** — a nickname that can appear on game leaderboards. It's completely separate from your private username, which is never shown to anyone else.
- Since there's no email or phone number on file, a forgotten password can't be reset by clicking a link in an email the way most sites do it. Instead, the moment you sign up (and again any time it's regenerated), you're shown a one-time **Recovery Code** — write it down somewhere safe. It is the *only* way back into your account if you ever forget your password. If both the password and the Recovery Code are lost, the account genuinely cannot be recovered by anyone, including the Twegle team — this is stated plainly on the page itself, so it's never a surprise later.
- **Everything about accounts is optional.** No feature anywhere on the site is ever locked behind having one.

### What actually syncs across your devices once you're logged in

If you're logged into the same account on, say, your phone and your laptop, these automatically stay in sync between them:
1. Your **Quiz streak** and **Puzzle streak** counts (tracked separately).
2. Your **level/points progress** and **unlocked badges**.
3. Your **"already played" history** — the small green checkmarks on quiz and puzzle tiles.

This sync happens **automatically in the background**, with no button to press. If you do something on your phone and then look at an already-open tab on your laptop, it picks up the change within about 20 seconds on its own — you never need to manually refresh the page or clear anything for it to catch up.

---

# PART 2 — The Admin Panel (`twegle.in/admin`)

This is the separate, password-protected part of the site where the Twegle team creates and manages every piece of content, and keeps an eye on how the site is doing. A regular visitor never sees any of this.

## Logging in

Every admin has their own email and password, created for them by someone with the highest level of access (a Superadmin — see below). There's no public "sign up" page for admins; accounts are handed out deliberately, one at a time.

## Who can do what — the three roles

Every admin account has one of three roles, which controls exactly what they're allowed to do:

| Role | What they can do |
|---|---|
| **Analyst** | Look at content and view all the analytics/stats — cannot create, change, or delete anything |
| **Editor** | Everything an Analyst can do, plus create, edit, delete, and publish content |
| **Superadmin** | Everything an Editor can do, plus create or remove other admin accounts |

## Dashboard

The very first screen after logging in (and reachable any time by tapping the logo). It gives a quick "how's the site doing" snapshot: a Day/Week/Month/Year/All time-range picker at the top controls a summary of plays, views, and newly published content for that period; below that, a live count of how many quizzes/posts/stories/puzzles/friendship quizzes are currently published (always "right now," unaffected by the time-range picker — tap any number to jump straight to that content list); an alert if there's unread feedback waiting; the top-performing quizzes/friendship quizzes/games/posts for the chosen period; and the 5 most recent admin actions, with a link through to the complete history.

## Managing content

Five different types of content each have their own dedicated page in the admin panel: **Quizzes**, **Puzzles**, **Posts** (jokes/funny lines/quotes/motivational quotes), **Stories**, and **Friendship Quizzes**. On every one of these pages, an admin with the right role can:

- **Search and filter** the list — by category, by language, or by whether it's Published or still a Draft.
- **Create something new** through a dedicated form built for that content type.
- **Edit or delete** anything that already exists.
- **Clone** an existing item as a starting point for a new one, instead of writing everything from scratch.
- **Schedule** something to automatically go live at a chosen future date and time, instead of publishing it right away.

## Quick Add

A fast shortcut built specifically for jokes, funny lines, quotes, and motivational quotes — pick a category, type the text into one box, tap Publish. There are no extra fields and nothing gets saved as a draft; it's meant for adding something in a few seconds, even from a phone.

## Bulk Import

A way to add many pieces of content in one go, rather than filling out one form at a time. It works two ways: **Posts** — paste a whole list of jokes/quotes/etc. (one per line), pick a category and language once, and every single line becomes its own published post. **Quizzes** — paste a specially-formatted block of quiz data to create several full quizzes at once — handy if quizzes were drafted somewhere else first (a spreadsheet, or with the help of an AI tool). Either way, each item goes through the exact same checks the normal forms use, and if anything fails, it's reported individually rather than blocking the whole batch.

## Content freshness flags

On the Quizzes and Posts lists, anything that's been live for a couple of weeks but has barely been played or viewed gets a small **"⚠️ Needs a refresh"** badge — a gentle nudge that it might be worth rewording, resharing, or just leaving as-is. Every item in every list also shows its real play/view count right there, no need to dig into Analytics separately.

## Analytics

A dedicated page showing exactly which quizzes, posts, friendship quizzes, games, puzzles, stories, and horoscope signs are actually getting played, viewed, or shared the most — so it's obvious what's working, not a guess. A "This week" summary sits at the top with three quick numbers (plays, views/shares, and new content published) before diving into the full breakdown tables further down.

## Activity log

A running, timestamped record of every admin action — who created, edited, or deleted what, and when. Useful for keeping track once more than one person has admin access. It can be searched page by page.

## Feedback inbox

Every message submitted through the public Feedback page, plus every 🚩 report flagged against a specific piece of content, lands here — newest first, with a way to mark each one as read once it's been handled.

## Members (visitor accounts)

A searchable list of everyone who's created an optional visitor account. Admins can see a member's Gamer Tag, avatar, and join date — but never their password or Recovery Code, which are never visible to anyone, including admins. Two actions are available for a problem account: **Disable** (reversible — logs the account out immediately and blocks sign-in until an admin re-enables it) and **Delete** (permanent removal).

## Admin accounts

Only a Superadmin can see and manage this page — creating new admin accounts (assigning them a role) or removing existing ones.

## Dark mode for the admin panel

Just like the public site, the entire admin panel has its own dark mode toggle, remembered separately for next time an admin logs in.

---

# The short version

**If you're a visitor:** open the site, no login needed, pick whatever looks fun — a quiz, a puzzle, a game, a story, a horoscope — enjoy it, and share it with a friend if you want to. If you'd like your progress to follow you across your phone and computer, you can optionally create a free account with just a username and password. That's the entire experience, repeated across many different kinds of content, all designed to be quick to enjoy and easy to pass along.

**If you're an admin:** log in, create and manage content through the admin panel, keep an eye on what's performing well through Analytics and the freshness flags, and handle whatever feedback or reports come in from visitors.
