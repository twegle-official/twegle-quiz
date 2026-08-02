import { Link } from 'react-router-dom'
import { LogoWithWordmark } from './Logo'
import ShareButtons from './ShareButtons'

// Plain inline SVGs (currentColor) rather than emoji — emoji render as tiny,
// inconsistent glyphs across platforms and don't clearly read as "this is the
// Instagram/Facebook/YouTube/LinkedIn link" the way a real brand mark does.
// No icon library added for just four icons; these are simplified outlines
// close to each platform's actual logo shape.
function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.32C16.24 4.28 15.32 4.2 14.25 4.2c-2.23 0-3.75 1.36-3.75 3.86V10.5H8v3h2.5V21h3z" />
    </svg>
  )
}

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10.5 9.8v4.4l4-2.2z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7.3" cy="8.3" r="1.4" />
      <rect x="6.2" y="10.8" width="2.2" height="7" />
      <path d="M11.2 10.8h2.1v1c.5-.75 1.3-1.2 2.4-1.2 2 0 2.9 1.3 2.9 3.6v3.6h-2.2v-3.2c0-1-.4-1.7-1.4-1.7-.8 0-1.3.55-1.5 1.05-.08.2-.1.45-.1.75v3.1h-2.2v-7z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <LogoWithWordmark size={28} />
          <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
            Quizzes, jokes, quotes, games, stories, horoscope &amp; chaos — no sign up, just pick
            something and go. New stuff added regularly.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <a
              href="https://instagram.com/twegle.official"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twegle on Instagram"
              className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61588711006029"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twegle on Facebook"
              className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com/@twegle"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twegle on YouTube"
              className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <YoutubeIcon className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/company/twegle"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twegle on LinkedIn"
              className="text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <LinkedinIcon className="w-5 h-5" />
            </a>
          </div>
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
            <li><Link to="/?tab=horoscope" className="hover:text-gray-900 dark:hover:text-gray-100">Horoscope</Link></li>
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
