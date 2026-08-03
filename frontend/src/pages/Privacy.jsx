import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

export default function Privacy() {
  useDocumentMeta('Privacy Policy', 'What Twegle does and doesn\'t collect, and how it\'s used.')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">Last updated: 27 July 2026</p>

      <p className="mb-6">
        Twegle ("we", "us", "the site") is a free entertainment site — quizzes, jokes, funny
        lines, quotes, and motivational quotes — meant to be quick, shareable fun. This policy
        explains what information we collect when you use Twegle, and what we don't.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. No account, no personal information</h2>
      <p className="mb-6">
        You can take any quiz or read any post on Twegle without creating an account. We do not
        ask for your name, email address, phone number, date of birth, or any other personal
        information anywhere in the core experience — taking a quiz, reading a joke or quote,
        and sharing a result all work without you ever telling us who you are.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. What we do collect</h2>
      <p className="mb-3">
        When you take a quiz, your browser generates a random, anonymous identifier and stores it
        locally on your device (in "localStorage"). This identifier is not linked to your name,
        email, or any personal information — we use it purely to count how many times a quiz has
        been played (e.g. so we can show "12k took this" on a quiz card) and to avoid counting
        the same play twice. It never leaves an anonymous form, and we don't attempt to identify
        who you are from it.
      </p>
      <p className="mb-6">
        We also keep basic, aggregated traffic information (like which quizzes and posts are
        popular, or which language is used more) to decide what content to add next. This is
        looked at in aggregate, not tied to any individual visitor.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. Advertising</h2>
      <p className="mb-6">
        Twegle is not currently showing any ads. When advertising is added, our intention is to
        use non-personalized, contextual ads rather than ads that track you across other
        websites — this policy will be updated with specifics (including which ad network is
        used and how to control ad preferences) before ads go live.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">4. Affiliate links</h2>
      <p className="mb-6">
        Some quiz results or posts may include affiliate links — meaning if you click through and
        make a purchase, Twegle may earn a small commission at no extra cost to you. Any page
        with an affiliate link says so near the link. Clicking one may let the destination site
        (not Twegle) know you came from here, the same as clicking any external link would.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">5. Children's privacy</h2>
      <p className="mb-6">
        Twegle is designed to be family-friendly and safe for visitors of any age, including
        children. Because we don't collect names, emails, or any other personal information from
        anyone in the core experience, we don't knowingly collect personal information from
        children under 13 (or the relevant age in your country). If that ever changes — for
        example, if an optional account feature is added later — this policy will be updated
        first, and appropriate protections (such as an age check) will be added before that
        feature launches.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">6. Cookies &amp; local storage</h2>
      <p className="mb-6">
        We use your browser's local storage (not tracking cookies) to remember your anonymous
        play-tracking ID and your language preference. We don't use third-party tracking cookies
        today. If that changes (for example, once an ad network is added), we'll add a cookie
        notice explaining what's used and letting you control non-essential cookies.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">7. Changes to this policy</h2>
      <p className="mb-6">
        If this policy changes in a meaningful way — for example, if we start collecting new
        information or add an accounts feature — we'll update the "last updated" date above and,
        where appropriate, make the change clearly visible on the site.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">8. Contact us</h2>
      <p>
        Questions about this policy or how Twegle handles information? Reach us at{' '}
        <a href="mailto:twegle.official@gmail.com" className="text-violet-600 dark:text-violet-400 font-medium">
          twegle.official@gmail.com
        </a>
        .
      </p>
    </div>
  )
}
