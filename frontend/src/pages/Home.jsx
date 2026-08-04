import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchQuizzes, fetchPosts, fetchFriendshipQuizzes, fetchGameCounts, fetchStories, fetchZodiacSigns } from '../api'
import { GAMES } from '../games/registry'
import QuizCard from '../components/QuizCard'
import FriendshipQuizCard from '../components/FriendshipQuizCard'
import PostCard from '../components/PostCard'
import GameCard from '../components/GameCard'
import StoryCard from '../components/StoryCard'
import ZodiacCard from '../components/ZodiacCard'
import DailyQuizBanner from '../components/DailyQuizBanner'

// Ordered by expected usage, most to least: Quizzes and Friendship Quiz are
// the two biggest growth-loop/engagement formats, Memes are next since
// images reshare better than plain text on WhatsApp/Instagram, then Games
// (replayable but not primarily share-driven), then Stories (a settle-in,
// longer-dwell format — read or listen, less share-driven than the above),
// then the four text-based post categories, Jokes and Funny Lines grouped
// together (both quick one-liner formats) ahead of Quotes/Motivational.
const TABS = [
  { key: 'quizzes', label: 'Quizzes', emoji: '🎯' },
  { key: 'friendship', label: 'Friendship Quiz', emoji: '🤝' },
  { key: 'meme', label: 'Memes', emoji: '😹' },
  { key: 'games', label: 'Games', emoji: '🎮' },
  { key: 'stories', label: 'Stories', emoji: '📖' },
  { key: 'horoscope', label: 'Horoscope', emoji: '🔮' },
  { key: 'joke', label: 'Jokes', emoji: '😂' },
  { key: 'funny-line', label: 'Funny Lines', emoji: '😜' },
  { key: 'quote', label: 'Quotes', emoji: '💬' },
  { key: 'motivational-quote', label: 'Motivational', emoji: '💪' },
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
// quotes/funny-lines/motivational-quotes/memes) and stories don't have a
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
  // The active tab lives in the URL (?tab=friendship) rather than local
  // state, so switching tabs is bookmarkable/shareable and the browser
  // back/forward buttons move between tabs, not just other pages.
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = TABS.some((t) => t.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'quizzes'
  function setActiveTab(tab) {
    setSearchParams(tab === 'quizzes' ? {} : { tab })
  }
  const [language, setLanguage] = useState('en')
  const [quizCategory, setQuizCategory] = useState('all')
  const [storyCategory, setStoryCategory] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  // Tagged with the tab/language/category that produced it, so a render can
  // never show content fetched for a different filter while the real fetch
  // is in flight — this is what previously caused a crash and a "duplicate
  // key" warning when switching tabs quickly (old items briefly rendered
  // under the new tab).
  const [content, setContent] = useState({ tab: 'quizzes', language: 'en', category: 'all', items: null })
  const [error, setError] = useState(false)
  // Real counts for the hero band, across both languages — replaces a
  // hardcoded number that had to be manually edited every time content was
  // added and quietly went stale.
  const [stats, setStats] = useState({ quizzes: null, posts: null })
  // Full, unfiltered quiz list — reused for the Quiz of the Day banner below
  // rather than a separate fetch, since this effect already loads it all.
  const [allQuizzes, setAllQuizzes] = useState([])

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
  }, [activeTab, language, quizCategory, storyCategory, sortMode])

  useEffect(() => {
    Promise.all([fetchQuizzes(), fetchPosts()])
      .then(([quizzes, posts]) => {
        setStats({
          quizzes: quizzes.length,
          posts: posts.filter((p) => p.category !== 'meme').length,
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

  useEffect(() => {
    let cancelled = false
    setError(false)

    const activeCategory =
      activeTab === 'quizzes' ? quizCategory : activeTab === 'stories' ? storyCategory : 'all'

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
        : fetchPosts(activeTab, language)
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
  }, [activeTab, language, quizCategory, storyCategory])

  const activeCategory =
    activeTab === 'quizzes' ? quizCategory : activeTab === 'stories' ? storyCategory : 'all'

  const items =
    content.tab === activeTab && content.language === language && content.category === activeCategory
      ? content.items
      : null

  const displayedItems = sortItems(items, activeTab, sortMode)

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Twegle',
    url: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    description: 'Quizzes, jokes, quotes, games, stories, horoscope & chaos — no sign up, just pick something and go. New stuff added regularly.',
  }

  return (
    <div>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/80">
              Where Fun Goes Viral
            </p>
            <h1 className="text-lg sm:text-xl font-extrabold text-white">
              Quizzes, Jokes, Quotes, Games, Stories &amp; Horoscope
            </h1>
            <p className="text-white/90 text-xs sm:text-sm">
              No sign up, no waiting — just pick something and go.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-white/80 text-xs sm:text-sm font-medium shrink-0">
            <span>🎯 {stats.quizzes ?? '24'} quizzes</span>
            <span>💬 {stats.posts ?? '85'}+ jokes &amp; quotes</span>
            <span>🌐 English &amp; हिंदी</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4">
        <DailyQuizBanner quizzes={allQuizzes} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:items-start">
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
              <GameCard game={game} />
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

      {displayedItems && displayedItems.length > 0 &&
        activeTab !== 'quizzes' &&
        activeTab !== 'friendship' &&
        activeTab !== 'games' &&
        activeTab !== 'stories' &&
        activeTab !== 'horoscope' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((post, i) => (
            <PostCard key={post._id} post={post} index={i} />
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
