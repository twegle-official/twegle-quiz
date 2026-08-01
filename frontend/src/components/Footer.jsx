import { Link } from 'react-router-dom'
import { LogoWithWordmark } from './Logo'
import ShareButtons from './ShareButtons'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <LogoWithWordmark size={28} />
          <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
            Quizzes, jokes, quotes, and more — no sign up, just pick something and go. New stuff
            added regularly.
          </p>
          <div className="mt-4 xl:hidden">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Share Twegle
            </p>
            <ShareButtons
              title="Twegle — Quizzes, Quotes & Chaos for Everyone"
              url={window.location.origin}
              shareText="Check out Twegle — free quizzes, jokes, quotes & more, no sign up needed!"
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Explore</h3>
          <ul className="space-y-2 text-gray-500 dark:text-gray-400">
            <li><Link to="/" className="hover:text-gray-900 dark:hover:text-gray-100">All Quizzes</Link></li>
            <li><Link to="/?tab=friendship" className="hover:text-gray-900 dark:hover:text-gray-100">Friendship Quiz</Link></li>
            <li><Link to="/?tab=games" className="hover:text-gray-900 dark:hover:text-gray-100">Games</Link></li>
            <li><Link to="/?tab=stories" className="hover:text-gray-900 dark:hover:text-gray-100">Stories</Link></li>
            <li><Link to="/browse/jokes" className="hover:text-gray-900 dark:hover:text-gray-100">Jokes</Link></li>
            <li><Link to="/browse/funny-lines" className="hover:text-gray-900 dark:hover:text-gray-100">Funny Lines</Link></li>
            <li><Link to="/browse/quotes" className="hover:text-gray-900 dark:hover:text-gray-100">Quotes</Link></li>
            <li><Link to="/browse/motivational-quotes" className="hover:text-gray-900 dark:hover:text-gray-100">Motivational Quotes</Link></li>
            <li><Link to="/browse/memes" className="hover:text-gray-900 dark:hover:text-gray-100">Memes</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Company</h3>
          <ul className="space-y-2 text-gray-500 dark:text-gray-400">
            <li><Link to="/about" className="hover:text-gray-900 dark:hover:text-gray-100">About &amp; Contact</Link></li>
            <li><Link to="/feedback" className="hover:text-gray-900 dark:hover:text-gray-100">Feedback</Link></li>
            <li><Link to="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-gray-900 dark:hover:text-gray-100">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Twegle. All rights reserved.</p>
          <p>Some links may be affiliate links, and pages may show ads — this helps keep it free.</p>
        </div>
      </div>
    </footer>
  )
}
