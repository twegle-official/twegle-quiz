import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchStoryBySlug, fetchStories, getStoryShareUrl, recordEngagement } from '../api'
import ShareButtons from '../components/ShareButtons'
import AdSlot from '../components/AdSlot'
import StoryCard from '../components/StoryCard'
import ReportButton from '../components/ReportButton'
import { STORY_CATEGORY_STYLE } from '../storyStyles'
import { shuffleArray } from '../utils/shuffle'
import { useDocumentMeta } from '../utils/useDocumentMeta'

const SUGGESTION_COUNT = 4

// A thin wrapper around the browser's built-in Web Speech API
// (SpeechSynthesisUtterance) — no recorded voice, no paid TTS service, so
// there's zero infrastructure cost and zero licensing/copyright question
// around the narration itself (see PENDING_TASKS.md for the full reasoning).
// Not every browser/OS combination ships every language's voice, so this
// degrades to a plain "not supported here" message rather than erroring.
function useReadAloud(text, language) {
  const [status, setStatus] = useState('idle') // idle | speaking | paused
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Keyed on `text` (not just mount/unmount) so switching to a different
  // story — which React Router renders by reusing this same component
  // instance, just with new params/state, not a fresh mount — still stops
  // whatever the previous story was saying before the new one loads.
  useEffect(() => {
    if (supported) window.speechSynthesis.cancel()
    setStatus('idle')
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported, text])

  function play() {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US'
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    window.speechSynthesis.speak(utterance)
    setStatus('speaking')
  }

  function pause() {
    window.speechSynthesis.pause()
    setStatus('paused')
  }

  function resume() {
    window.speechSynthesis.resume()
    setStatus('speaking')
  }

  function stop() {
    window.speechSynthesis.cancel()
    setStatus('idle')
  }

  return { supported, status, play, pause, resume, stop }
}

export default function StoryView() {
  const { slug } = useParams()
  const [story, setStory] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const speech = useReadAloud(story?.body || '', story?.language)
  const viewedRef = useRef(false)

  useEffect(() => {
    fetchStoryBySlug(slug)
      .then((data) => (data ? setStory(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
  }, [slug])

  useEffect(() => {
    if (!story || viewedRef.current) return
    viewedRef.current = true
    recordEngagement('story', story._id, 'view')
  }, [story])

  useEffect(() => {
    if (!story) return
    fetchStories(story.language)
      .then((all) => {
        const others = all.filter((s) => s.slug !== story.slug)
        const sameCategory = shuffleArray(others.filter((s) => s.category === story.category))
        const rest = shuffleArray(others.filter((s) => s.category !== story.category))
        setSuggestions([...sameCategory, ...rest].slice(0, SUGGESTION_COUNT))
      })
      .catch(() => {})
  }, [story])

  const style = story && STORY_CATEGORY_STYLE[story.category]

  useDocumentMeta(
    story && `${story.emoji || ''} ${story.title}`.trim(),
    story && `A ${style.label.toLowerCase()} story on Twegle — read it, or have it read to you.`
  )

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">We couldn't find that.</p>
        <Link to="/" className="text-violet-600 font-semibold">Back home</Link>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
      </div>
    )
  }

  const shareUrl = getStoryShareUrl(story.slug)

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-center">
      <div
        className={`animate-pop-in rounded-3xl p-10 text-white shadow-lg bg-gradient-to-br ${style.gradient}`}
      >
        <div className="text-6xl mb-4">{story.emoji || style.emoji}</div>
        <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">{style.label}</p>
        <h1 className="text-2xl font-bold leading-snug">{story.title}</h1>
      </div>

      <div className="mt-6 flex justify-center">
        {!speech.supported ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Read-aloud isn't supported in this browser — just read on below.</p>
        ) : speech.status === 'idle' ? (
          <button
            onClick={speech.play}
            className="px-5 py-2.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90"
          >
            🔊 Listen to this story
          </button>
        ) : (
          <div className="flex gap-2">
            {speech.status === 'speaking' ? (
              <button
                onClick={speech.pause}
                className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={speech.resume}
                className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
              >
                ▶ Resume
              </button>
            )}
            <button
              onClick={speech.stop}
              className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ⏹ Stop
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{story.body}</p>
      </div>

      <div className="mt-6">
        <ShareButtons
          title={story.title}
          url={shareUrl}
          shareText={`"${story.title}" — a ${style.label.toLowerCase()} story on Twegle!`}
          onShare={() => recordEngagement('story', story._id, 'share')}
        />
      </div>

      <div className="mt-8">
        <AdSlot />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-10 text-left">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((s, i) => (
              <StoryCard key={s.slug} story={s} index={i} />
            ))}
          </div>
        </div>
      )}

      <Link
        to="/"
        className="inline-block mt-8 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300"
      >
        See more
      </Link>

      <div className="mt-6">
        <ReportButton contentType="story" contentId={story._id} contentLabel={story.title} />
      </div>
    </div>
  )
}
