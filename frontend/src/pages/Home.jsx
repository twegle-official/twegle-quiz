import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchQuizzes, fetchPosts, fetchFriendshipQuizzes, fetchGameCounts, fetchStories, fetchZodiacSigns, fetchPuzzles, fetchPostReactionsBatch, setPostReaction, fetchTodayStats } from '../api'
import { GAMES } from '../games/registry'
import QuizCard from '../components/QuizCard'
import FriendshipQuizCard from '../components/FriendshipQuizCard'
import PostCard from '../components/PostCard'
import GameCard from '../components/GameCard'
import StoryCard from '../components/StoryCard'
import ZodiacCard from '../components/ZodiacCard'
import PuzzleCard from '../components/PuzzleCard'
import DailyQuizBanner from '../components/DailyQuizBanner'
import PuzzleOfTheDayBanner from '../components/PuzzleOfTheDayBanner'
import RecentlyViewedRow from '../components/RecentlyViewedRow'
import AdSlot from '../components/AdSlot'

// Ordered by expected usage/revenue impact, most to least: Quizzes stays
// first — biggest content library and the strongest share loop (a solo
// quiz result is the easiest thing to reshare, no second person needed),
// so it drives the most pageviews/ad impressions. Friendship Quiz next
// (same growth-loop idea, but needs a friend to join, so more friction on
// a first click). Games next — replayable, has its own "beat me" share
// hook. Puzzles after Games — shares the same daily-streak mechanism as
// Quiz of the Day (see dailyQuiz.js — each keeps its own independent
// streak, but both are the same "do it every day" habit loop). Posts
// (merged from the previous 5 separate Jokes/Funny Lines/Quotes/
// Motivational tabs — same underlying Post model with a category filter,
// just one continuous scroll-through feed instead of several homepage
// tabs) after Puzzles. Stories and Horoscope last — longer-dwell, less
// share-driven formats.
const TABS = [
  { key: 'games', label: 'Games', emoji: '🎮' },
  { key: 'quizzes', label: 'Quizzes', emoji: '🎯' },
  { key: 'friendship', label: 'Friendship Quiz', emoji: '🤝' },
  { key: 'puzzles', label: 'Puzzles', emoji: '🧩' },
  { key: 'posts', label: 'Posts', emoji: '💬' },
  { key: 'stories', label: 'Stories', emoji: '📖' },
  { key: 'horoscope', label: 'Horoscope', emoji: '🔮' },
]

const PUZZLE_DIFFICULTIES = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Warm-Up', emoji: '🟢' },
  { key: 'medium', label: 'Challenge', emoji: '🟡' },
  { key: 'hard', label: 'Brain Buster', emoji: '🔴' },
]

const POST_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'joke', label: 'Jokes', emoji: '😂' },
  { key: 'funny-line', label: 'Funny Lines', emoji: '😜' },
  { key: 'quote', label: 'Quotes', emoji: '💬' },
  { key: 'motivational-quote', label: 'Motivational', emoji: '💪' },
]

// Filters the static GAMES registry by its `players` field — client-side,
// since games aren't database content (see registry.js's own comment).
const GAME_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'single', label: 'Single Player', emoji: '🧑' },
  { key: 'friend', label: '2 Player', emoji: '🤝' },
]

const QUIZ_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'entertainment', label: 'Bollywood', emoji: '🎬' },
  { key: 'kpop', label: 'K-pop', emoji: '🎤' },
  { key: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { key: 'fun', label: 'Fun & Random', emoji: '🎉' },
]

const STORY_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'horror', label: 'Horror', emoji: '👻' },
  { key: 'comedy', label: 'Comedy', emoji: '😂' },
  { key: 'romance', label: 'Romance', emoji: '💕' },
  { key: 'mystery', label: 'Mystery', emoji: '🕵️' },
  { key: 'moral', label: 'Moral Tales', emoji: '📚' },
  { key: 'motivational', label: 'Motivational', emoji: '💪' },
]

// What "popularity" means per tab, for the Trending sort — quizzes/
// friendship quizzes/games all have a real completion count; posts (jokes/
// quotes/funny-lines/motivational-quotes) and stories don't have a
// "completion," so they fall back to `totalEngagement` (views+shares, from
// the shared Engagement/PostEngagement models) via the default below.
const TRENDING_FIELD_BY_TAB = {
  quizzes: 'totalPlays',
  friendship: 'totalAttempts',
  games: 'totalPlays',
}

function trendingValue(item, tab) {
  const field = TRENDING_FIELD_BY_TAB[tab] || 'totalEngagement'
  return item[field] || 0
}

// Games are code, not admin-authored database content, so they have no
// `createdAt` to sort by — the static registry's own order approximates
// the order they were actually added in (Tic-Tac-Toe first, Sudoku most
// recently), so "Newest" for games just reverses that fixed order.
function sortItems(items, tab, mode) {
  if (!items) return items
  // The 12 zodiac signs have a fixed traditional order (Aries → Pisces) and
  // no play/view counts or creation dates that would make "Trending" or
  // "Newest" mean anything here — leave the list as-is rather than sorting
  // by a field that doesn't apply.
  if (tab === 'horoscope') return items
  if (mode === 'trending') {
    return [...items].sort((a, b) => trendingValue(b, tab) - trendingValue(a, tab))
  }
  if (tab === 'games') return [...items].reverse()
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export default function Home() {
  // Every filter (tab, language, sort, and each tab's own category/
  // difficulty chip) lives in the URL rather than local state, so all of
  // them are bookmarkable/shareable, and — the reason this matters most —
  // survive the browser Back button. Home.jsx fully unmounts when you
  // navigate to a quiz/puzzle/post detail page, so any filter kept in plain
  // React state is lost the moment you come back; reading it from the URL
  // instead means Back simply restores the same URL, filters included.
  const [searchParams, setSearchParams] = useSearchParams()

  function getParam(key, allowedKeys, fallback) {
    const value = searchParams.get(key)
    return allowedKeys.includes(value) ? value : fallback
  }

  // Filter changes replace the current history entry (no new Back stop per
  // click) — only switching tabs pushes a new entry, preserving the
  // existing "Back/Forward move between tabs" behavior.
  function setParam(key, value, defaultValue, { push = false } = {}) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === defaultValue) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: !push }
    )
  }

  const activeTab = getParam('tab', TABS.map((t) => t.key), 'games')
  function setActiveTab(tab) {
    setParam('tab', tab, 'games', { push: true })
  }
  const language = getParam('lang', ['en', 'hi'], 'en')
  function setLanguage(lang) {
    setParam('lang', lang, 'en')
  }
  const quizCategory = getParam('qcat', QUIZ_CATEGORIES.map((c) => c.key), 'all')
  function setQuizCategory(cat) {
    setParam('qcat', cat, 'all')
  }
  const storyCategory = getParam('scat', STORY_CATEGORIES.map((c) => c.key), 'all')
  function setStoryCategory(cat) {
    setParam('scat', cat, 'all')
  }
  const postCategory = getParam('pcat', POST_CATEGORIES.map((c) => c.key), 'all')
  function setPostCategory(cat) {
    setParam('pcat', cat, 'all')
  }
  const puzzleDifficulty = getParam('pzcat', PUZZLE_DIFFICULTIES.map((c) => c.key), 'all')
  function setPuzzleDifficulty(cat) {
    setParam('pzcat', cat, 'all')
  }
  const gameCategory = getParam('gcat', GAME_CATEGORIES.map((c) => c.key), 'all')
  function setGameCategory(cat) {
    setParam('gcat', cat, 'all')
  }
  const sortMode = getParam('sort', ['newest', 'trending'], 'newest')
  function setSortMode(mode) {
    setParam('sort', mode, 'newest')
  }
  // Tagged with the tab/language/category that produced it, so a render can
  // never show content fetched for a different filter while the real fetch
  // is in flight — this is what previously caused a crash and a "duplicate
  // key" warning when switching tabs quickly (old items briefly rendered
  // under the new tab).
  const [content, setContent] = useState({ tab: 'games', language: 'en', category: 'all', items: null })
  const [error, setError] = useState(false)
  // Real counts for the hero band, across both languages — replaces a
  // hardcoded number that had to be manually edited every time content was
  // added and quietly went stale.
  const [stats, setStats] = useState({ quizzes: null, posts: null })
  // Real-time-ish social proof for first-time visitors — an aggregate,
  // never-per-user count of today's plays across quizzes/games/friendship
  // quizzes (see statsController.js). Fetched once on mount; not worth
  // polling live, a stale-by-a-few-minutes count is still an honest signal.
  const [playsToday, setPlaysToday] = useState(null)
  // Reaction counts for the currently displayed post tiles, keyed by post id.
  const [reactionCounts, setReactionCounts] = useState({})
  // Full, unfiltered quiz list — reused for the Quiz of the Day banner below
  // rather than a separate fetch, since this effect already loads it all.
  const [allQuizzes, setAllQuizzes] = useState([])
  // Same reasoning, for the Puzzle of the Day banner.
  const [allPuzzles, setAllPuzzles] = useState([])
  // Unused directly — exists purely to force a re-render. QuizCard/PuzzleCard
  // read their "already attempted" mark straight from localStorage at render
  // time (see hasCompletedQuiz/hasRevealedPuzzle in badges.js), with no
  // React state backing it, so a background cross-device sync landing new
  // data in localStorage (see statsSync.js's 'twegle-stats-synced' event)
  // wouldn't otherwise cause an already-mounted Home to notice and re-render
  // its tiles. Found directly: revealing a puzzle on mobile didn't show the
  // mark on an already-open desktop tab even after the sync itself ran.
  const [, forceStatsRerender] = useState(0)
  useEffect(() => {
    function handleStatsSynced() {
      forceStatsRerender((n) => n + 1)
    }
    window.addEventListener('twegle-stats-synced', handleStatsSynced)
    return () => window.removeEventListener('twegle-stats-synced', handleStatsSynced)
  }, [])

  // Resets scroll to the true top on every filter change (tab, language,
  // quiz/story category, sort mode) so the newly-filtered content is fully
  // visible without the visitor needing to scroll up manually. A prior,
  // more "clever" version tried to only scroll partway (just far enough to
  // reveal the content) so the sticky filter sidebar would never visually
  // move — but that left the sidebar's on-screen position inconsistent
  // across tabs (some landed stuck near the top, others didn't, depending
  // on how much content that tab happened to have), which read as more
  // confusing than a plain, predictable reset: every filter click always
  // lands at the exact same place — hero, sidebar, and content all visible
  // together from the top — rather than a different spot each time.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeTab, language, quizCategory, storyCategory, postCategory, puzzleDifficulty, gameCategory, sortMode])

  useEffect(() => {
    fetchTodayStats()
      .then((data) => data && setPlaysToday(data.playsToday))
      .catch(() => {})
  }, [])

  useEffect(() => {
    Promise.all([fetchQuizzes(), fetchPosts()])
      .then(([quizzes, posts]) => {
        setStats({
          quizzes: quizzes.length,
          posts: posts.length,
        })
      })
      .catch(() => {})
  }, [])

  // Kept separate from the stats fetch above and filtered by the current
  // language — Result.jsx picks today's quiz from a same-language list too
  // (via quiz.language), and the two picks must agree for the streak to
  // ever actually increment.
  useEffect(() => {
    fetchQuizzes(language)
      .then(setAllQuizzes)
      .catch(() => {})
  }, [language])

  // Same reasoning as the allQuizzes effect above, for PuzzleOfTheDayBanner
  // and PuzzleView.jsx's own streak check to agree on the same daily pick.
  useEffect(() => {
    fetchPuzzles(language)
      .then(setAllPuzzles)
      .catch(() => {})
  }, [language])


  useEffect(() => {
    let cancelled = false
    setError(false)

    const activeCategory =
      activeTab === 'quizzes'
        ? quizCategory
        : activeTab === 'stories'
        ? storyCategory
        : activeTab === 'posts'
        ? postCategory
        : activeTab === 'puzzles'
        ? puzzleDifficulty
        : 'all'

    const fetcher =
      activeTab === 'quizzes'
        ? fetchQuizzes(language, quizCategory === 'all' ? undefined : quizCategory)
        : activeTab === 'friendship'
        ? fetchFriendshipQuizzes(language)
        : activeTab === 'games'
        ? fetchGameCounts().then((counts) => GAMES.map((g) => ({ ...g, totalPlays: counts[g.slug] || 0 })))
        : activeTab === 'stories'
        ? fetchStories(language, storyCategory === 'all' ? undefined : storyCategory)
        : activeTab === 'horoscope'
        ? fetchZodiacSigns(language)
        : activeTab === 'puzzles'
        ? fetchPuzzles(language, puzzleDifficulty === 'all' ? undefined : puzzleDifficulty)
        : fetchPosts(postCategory === 'all' ? undefined : postCategory, language)
    fetcher
      .then((data) => {
        if (!cancelled) setContent({ tab: activeTab, language, category: activeCategory, items: data })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, language, quizCategory, storyCategory, postCategory, puzzleDifficulty])

  const activeCategory =
    activeTab === 'quizzes'
      ? quizCategory
      : activeTab === 'stories'
      ? storyCategory
      : activeTab === 'posts'
      ? postCategory
      : activeTab === 'puzzles'
      ? puzzleDifficulty
      : 'all'

  const items =
    content.tab === activeTab && content.language === language && content.category === activeCategory
      ? content.items
      : null

  // Games filtering happens client-side (unlike quizzes/stories/posts/
  // puzzles above, which filter server-side via the fetch call) since
  // GAMES is a static local list, not something the backend can query by
  // category — see registry.js.
  const filteredItems =
    activeTab === 'games' && gameCategory !== 'all'
      ? items?.filter((g) => g.players?.includes(gameCategory))
      : items

  const displayedItems = sortItems(filteredItems, activeTab, sortMode)

  const isPostTab = activeTab === 'posts'

  // One batch request for whatever page of post tiles is currently shown,
  // instead of each tile fetching its own reaction counts — see
  // TileReactions.jsx / reactionController.js's getReactionsBatch.
  useEffect(() => {
    if (!isPostTab || !items || items.length === 0) return
    let cancelled = false
    fetchPostReactionsBatch(items.map((p) => p._id)).then((counts) => {
      if (!cancelled) setReactionCounts(counts)
    })
    return () => {
      cancelled = true
    }
    // items is a plain array from state (only reassigned on an actual
    // fetch), unlike displayedItems which sortItems() recomputes fresh on
    // every render — depending on that would refetch on every sort toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPostTab, items])

  function handleReact(postId, emoji) {
    setPostReaction(postId, emoji).then((counts) => {
      setReactionCounts((prev) => ({ ...prev, [postId]: counts }))
    })
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Twegle',
    url: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    description: 'Quizzes, puzzles, jokes, quotes, games, stories, horoscope & chaos — no sign up, just pick something and go. New stuff added regularly.',
  }

  return (
    <div>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      {/* Banner shrunk further 2026-08-06 (py-4→py-3, h1 text-xl→text-lg on
          desktop — roughly a 20-25% height cut) per direct feedback that
          people come to browse quickly, and one extra row of real content
          visible without scrolling matters more than a taller hero. */}
      <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500">
        {/* Side-by-side again (title left, stats right at `sm`+) — the
            earlier squeeze/overlap bugs came from the *stats* side wanting
            an unpredictable width (either one long wrapped strip, or a
            `shrink-0` block that refused to give the title any room). Fixed
            at the source this time: the stats side is now exactly 2
            explicit rows (`whitespace-nowrap` each) instead of one
            flex-wrap strip, so its own max-content width is small and
            stable — "🎮 N games 🎯 N quizzes 💬 N+ jokes & quotes" is one
            fixed-width line, "🌐 English & हिंदी 🔥 N played today" is
            another — leaving the title (`min-w-0`, genuinely allowed to
            shrink/wrap) plenty of room at any width `sm` and up. */}
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 sm:gap-4 text-center sm:text-left">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/80">
              Where Fun Goes Viral
            </p>
            {/* Leads with the benefit ("why stay"), not an inventory of
                content types — the previous heading just listed what Twegle
                has. Content types still get their own mention in the
                subtext and in every meta description (index.html,
                useDocumentMeta.js) for SEO/link-preview purposes, so this
                change doesn't cost anything there. */}
            <h1 className="text-base sm:text-lg font-extrabold text-white">
              Your Daily Dose of Fun — Play, Laugh &amp; Discover Something New
            </h1>
            {/* Hidden below `sm` per direct feedback — on a phone this line
                just added height under an already-descriptive heading;
                content types still get their own mention in meta
                descriptions for SEO, so nothing is lost by dropping it here. */}
            <p className="hidden sm:block text-white/90 text-[11px] sm:text-sm">
              Quizzes, puzzles, games, jokes &amp; more — no sign up, just pick something and go.
            </p>
          </div>
          {/* Hidden below `sm` — on a phone this was extra stacked lines
              below an already-longer heading, pushing real content further
              down before it's visible at all. Decorative/secondary info,
              not something a mobile visitor needs before scrolling. */}
          <div className="hidden sm:flex flex-col gap-y-1 text-white/80 text-xs sm:text-sm font-medium shrink-0">
            <div className="whitespace-nowrap">
              🎮 {GAMES.length} games &nbsp; 🎯 {stats.quizzes ?? '24'} quizzes &nbsp; 💬 {stats.posts ?? '85'}+ jokes &amp; quotes
            </div>
            <div className="whitespace-nowrap">
              🌐 English &amp; हिंदी{playsToday > 0 && <> &nbsp; 🔥 {playsToday} played today</>}
            </div>
          </div>
        </div>
      </div>

      <RecentlyViewedRow />

      {/* Side by side (not stacked) on every screen size, including mobile —
          each banner is a single compact row now (see DailyQuizBanner /
          PuzzleOfTheDayBanner), so a 2-column grid halves the vertical space
          the pair takes versus stacking two full-width banners. */}
      <div className="max-w-6xl mx-auto px-4 pt-1 sm:pt-4 grid grid-cols-2 gap-2 sm:gap-3 mb-1 sm:mb-4">
        <DailyQuizBanner quizzes={allQuizzes} />
        <PuzzleOfTheDayBanner puzzles={allPuzzles} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-2 sm:pt-6 pb-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start">
      <aside className="flex flex-col gap-1.5 mb-4 lg:mb-0 lg:gap-2 lg:sticky lg:top-6">
        {/* Language and Trending/Newest share one row below `lg` — both are
            "global" filters (apply the same way regardless of active tab),
            and putting them side by side on mobile (instead of two separate
            stacked rows) frees up a full row of vertical space for the
            actual content below. On the `lg` sidebar they go back to being
            separate full-width stacked rows, where there's no width pressure. */}
        <div className="flex items-center justify-center gap-2 lg:flex-col lg:items-stretch lg:gap-2">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 lg:w-full">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors lg:flex-1 ${
                language === 'en' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors lg:flex-1 ${
                language === 'hi' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Newest listed first and selected by default — it's the more
              broadly useful default (freshest content) and reads naturally
              as the first choice next to the language toggle. */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 lg:w-full">
            <button
              onClick={() => setSortMode('newest')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors lg:flex-1 ${
                sortMode === 'newest' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              🆕 Newest
            </button>
            <button
              onClick={() => setSortMode('trending')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors lg:flex-1 ${
                sortMode === 'trending' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              🔥 Trending
            </button>
          </div>
        </div>

        {/* Below `lg`, tabs/categories are a single horizontally-scrollable
            row instead of wrapping across multiple lines — with 8 tabs now
            (up from the original 4-5), wrapped pills were pushing the actual
            content grid down by a full screen's worth of filter UI on a
            phone. `-mx-4 px-4` lets the row's touch-scroll area bleed to the
            true screen edge (matching the page's own px-4 gutter) without
            affecting where the pills themselves start. */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-1 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full lg:rounded-lg text-sm font-semibold transition-colors lg:text-left ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'quizzes' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-2 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-4">
            {QUIZ_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setQuizCategory(cat.key)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full lg:rounded-lg text-xs font-semibold transition-colors lg:text-left ${
                  quizCategory === cat.key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-2 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-4">
            {STORY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setStoryCategory(cat.key)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full lg:rounded-lg text-xs font-semibold transition-colors lg:text-left ${
                  storyCategory === cat.key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-2 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-4">
            {POST_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setPostCategory(cat.key)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full lg:rounded-lg text-xs font-semibold transition-colors lg:text-left ${
                  postCategory === cat.key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'puzzles' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-2 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-4">
            {PUZZLE_DIFFICULTIES.map((diff) => (
              <button
                key={diff.key}
                onClick={() => setPuzzleDifficulty(diff.key)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full lg:rounded-lg text-xs font-semibold transition-colors lg:text-left ${
                  puzzleDifficulty === diff.key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {diff.emoji} {diff.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0 pt-2 lg:border-t lg:border-gray-100 dark:lg:border-gray-800 lg:pt-4">
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setGameCategory(cat.key)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full lg:rounded-lg text-xs font-semibold transition-colors lg:text-left ${
                  gameCategory === cat.key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}
      </aside>

      <div>
      {error && (
        <p className="text-center text-red-500 dark:text-red-400">
          Couldn't load this right now. Please try again shortly.
        </p>
      )}

      {!error && !items && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500">
          Nothing here yet — check back soon, or try a different category/language.
        </p>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'quizzes' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((quiz, i) => (
            <div
              key={quiz.slug}
              className="animate-fade-slide-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <QuizCard quiz={quiz} />
            </div>
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'friendship' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((quiz, i) => (
            <div
              key={quiz.slug}
              className="animate-fade-slide-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <FriendshipQuizCard quiz={quiz} />
            </div>
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'games' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((game, i) => (
            <div
              key={game.slug}
              className="animate-fade-slide-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <GameCard game={game} filterMode={gameCategory} />
            </div>
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'stories' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((story, i) => (
            <StoryCard key={story.slug} story={story} index={i} />
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'horoscope' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((sign) => (
            <ZodiacCard key={sign.key} sign={sign} language={language} />
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'posts' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((post, i) => (
            <PostCard
              key={post._id}
              post={post}
              index={i}
              reactionCounts={reactionCounts[post._id]}
              onReact={handleReact}
            />
          ))}
        </div>
      )}

      {displayedItems && displayedItems.length > 0 && activeTab === 'puzzles' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((puzzle, i) => (
            <PuzzleCard key={puzzle._id} puzzle={puzzle} index={i} />
          ))}
        </div>
      )}

      {/* Homepage previously had zero ad placement at all — AdSlot only
          existed on result/detail pages (after finishing a quiz, reading a
          post, etc.), so a visitor who only ever browses tabs never saw one.
          Placed after the content grid (not above it) so it doesn't push
          real content below the fold on first load. */}
      {displayedItems && displayedItems.length > 0 && (
        <div className="mt-8">
          <AdSlot />
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
