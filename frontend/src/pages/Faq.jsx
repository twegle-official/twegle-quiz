import { useState } from 'react'
import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

const FAQS = [
  {
    q: 'Do I need to sign up to use Twegle?',
    a: 'No. Every quiz, puzzle, game, story, joke, and horoscope on Twegle works fully for guests — no account needed. Creating a free account is entirely optional, and only useful if you want your daily streaks, level/points progress, and badges to follow you across devices.',
  },
  {
    q: 'Is Twegle free?',
    a: 'Yes, completely free. No subscriptions, no paywalls, no premium content. The site is supported by ads and occasional affiliate links, which is why you may see them on some pages.',
  },
  {
    q: 'Do I need to give my email or phone number to create an account?',
    a: 'No. Twegle accounts only need a username and password — we never ask for an email address or phone number, for anyone.',
  },
  {
    q: 'What is a "Friendship Quiz"?',
    a: 'A two-person format: you answer a set of questions about yourself, then share the resulting link with friends. They try to guess your answers and see how well they actually know you — no account needed for either side.',
  },
  {
    q: 'What are the daily streaks, and what happens if I miss a day?',
    a: 'There are two separate streaks: playing today\'s Quiz of the Day keeps your Quiz streak going, and revealing today\'s Puzzle of the Day keeps your Puzzle streak going. They\'re tracked independently, so doing only one still gives you an honest count for that one. If you miss a day on either, that streak resets to zero — but you can always start it again right away, no penalty beyond that.',
  },
  {
    q: 'How do Achievements, levels, and badges work?',
    a: 'The My Achievements page tracks 10 levels you work up through by earning points from pretty much everything you do — quizzes, puzzles, games, reactions, shares, and keeping your streaks alive. The page itself shows exactly how many points each action is worth. There\'s also a public leaderboard of the top accounts by points (an account is needed to appear on it). Separately, 7 smaller "Bonus Badges" exist too — things like completing a set number of quizzes or getting a perfect trivia score — as a lighter side-collection, not part of the points system.',
  },
  {
    q: 'Is my data safe, and what do you actually collect?',
    a: 'We don\'t collect personal information beyond what you choose to give us (like a username, if you make an account). See our Privacy Policy for the full details on what\'s stored and why.',
  },
  {
    q: 'I found a bug, or a quiz/joke that shouldn\'t be there — what do I do?',
    a: 'Every piece of content has a "🚩 Report" option right on the page. For anything else — bugs, suggestions, or general feedback — use the Feedback page or email us directly.',
  },
  {
    q: 'Is Twegle available in languages other than English?',
    a: 'Yes — most content is also available in Hindi. Look for the language switcher on the homepage.',
  },
  {
    q: 'Is the content appropriate for kids and teens?',
    a: 'Yes, that\'s by design — everything on Twegle is written to be light and family-friendly, suitable for kids, teens, and adults alike.',
  },
]

export default function Faq() {
  useDocumentMeta('FAQ & Help', 'Answers to common questions about using Twegle — accounts, streaks, badges, privacy, and more.')
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        })}
      </script>

      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">FAQ &amp; Help</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Quick answers to the questions we hear most. Still stuck? Reach out via{' '}
        <a href="/feedback" className="text-violet-600 dark:text-violet-400 font-medium">Feedback</a> or{' '}
        <a href="mailto:twegle.official@gmail.com" className="text-violet-600 dark:text-violet-400 font-medium">
          email
        </a>
        .
      </p>

      <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
        {FAQS.map(({ q, a }, i) => {
          const isOpen = openIndex === i
          return (
            <div key={q}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">{q}</span>
                <span className="shrink-0 text-gray-400 dark:text-gray-500">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
