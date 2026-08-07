import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

export default function Privacy() {
  useDocumentMeta('Privacy Policy', 'What Twegle does and doesn\'t collect, and how it\'s used.')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">Last updated: 7 August 2026</p>

      <p className="mb-6">
        Twegle ("we", "us", "the site") is a free entertainment site — quizzes, puzzles,
        friendship quizzes, games, jokes, funny lines, quotes, motivational quotes, stories, and
        horoscopes — meant to be quick, shareable fun. This policy explains what information we
        collect when you use Twegle, and what we don't.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. No account needed, and no personal information required</h2>
      <p className="mb-6">
        Every piece of content on Twegle — quizzes, puzzles, games, jokes, quotes, stories,
        horoscopes — can be used without creating an account. We do not ask for your name, email
        address, phone number, date of birth, or any other personal information anywhere in the
        core experience — taking a quiz, revealing a puzzle, playing a game, and sharing a result
        all work without you ever telling us who you are.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. Optional accounts — still no email or phone number</h2>
      <p className="mb-3">
        If you'd like your daily streak, badges, and quiz/puzzle history to stay consistent across
        the devices you use, you can create a free account. Creating one only ever asks for a
        <strong> username</strong> and a <strong>password</strong> — we never ask for or collect
        an email address, phone number, or any other contact detail as part of this. Your password
        is stored as an irreversible cryptographic hash, never in readable form; nobody at Twegle,
        including admins, can ever see it.
      </p>
      <p className="mb-3">
        Because there's no email or phone number on file, a forgotten password can't be reset by
        email link the way most sites do it. Instead, you're shown a one-time <strong>Recovery
        Code</strong> when you sign up, which is the only way back into your account if you forget
        your password — please save it somewhere safe. If both your password and your Recovery
        Code are lost, we have no way to recover or verify ownership of the account, and it cannot
        be restored.
      </p>
      <p className="mb-3">
        You also choose a public <strong>Gamer Tag</strong> (display name), separate from your
        private login username, which may be shown on game leaderboards. Please don't use your
        real name, or any other personally identifying information, as your username or Gamer Tag
        — anything you choose to type into either field is visible to us and, in the Gamer Tag's
        case, to other visitors.
      </p>
      <p className="mb-6">
        Accounts are entirely optional — every feature on Twegle works fully without one, and
        nothing is locked behind signing up.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. What we do collect</h2>
      <p className="mb-3">
        When you use Twegle, your browser generates a random, anonymous identifier and stores it
        locally on your device (in "localStorage"). This identifier is not linked to your name,
        email, or any personal information — we use it purely to count how many times a quiz,
        puzzle, or game has been played (e.g. so we can show "12k took this" on a card) and to
        avoid counting the same play twice. It never leaves an anonymous form, and we don't
        attempt to identify who you are from it.
      </p>
      <p className="mb-3">
        If you're signed in, this same kind of progress data (your daily streak, unlocked badges,
        and which quizzes/puzzles you've completed) is additionally stored against your account
        so it can stay in sync across your devices — it's tied to your account, not to your
        identity, since your account itself carries no personal information.
      </p>
      <p className="mb-3">
        We also keep basic, aggregated traffic information (like which content is popular, or
        which language is used more) to decide what to add next. This is looked at in aggregate,
        not tied to any individual visitor.
      </p>
      <p className="mb-6">
        The Feedback form has an optional email field, only used if you'd like a reply — leaving
        it blank sends feedback with no contact information attached at all.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">4. Advertising</h2>
      <p className="mb-6">
        Twegle is not currently showing any ads. When advertising is added, our intention is to
        use non-personalized, contextual ads rather than ads that track you across other
        websites — this policy will be updated with specifics (including which ad network is
        used and how to control ad preferences) before ads go live.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">5. Affiliate links</h2>
      <p className="mb-6">
        Some quiz results or posts may include affiliate links — meaning if you click through and
        make a purchase, Twegle may earn a small commission at no extra cost to you. Any page
        with an affiliate link says so near the link. Clicking one may let the destination site
        (not Twegle) know you came from here, the same as clicking any external link would.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">6. Children's privacy</h2>
      <p className="mb-6">
        Twegle is designed to be family-friendly and safe for visitors of any age, including
        children, and every feature works fully without ever creating an account. We don't ask
        for a name, email address, phone number, date of birth, or any other real-world identifier
        anywhere on the site — not even the optional account feature (see Section 2 above) asks
        for any of that, since it only ever collects a username, password, and an optional public
        Gamer Tag. We ask that a username or Gamer Tag not be a real name or other identifying
        information. If a parent or guardian believes a child has entered identifying information
        anywhere on Twegle (for example, as their username), please contact us at the address
        below and we'll remove it.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">7. Cookies &amp; local storage</h2>
      <p className="mb-6">
        We use your browser's local storage (not tracking cookies) to remember your anonymous
        play-tracking ID, your language/theme preference, and — if you're signed in — your login
        session and synced progress. We don't use third-party tracking cookies today. If that
        changes (for example, once an ad network is added), we'll add a cookie notice explaining
        what's used and letting you control non-essential cookies.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">8. Changes to this policy</h2>
      <p className="mb-6">
        If this policy changes in a meaningful way — for example, if we start collecting new
        information or change how the account feature works — we'll update the "last updated"
        date above and, where appropriate, make the change clearly visible on the site.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">9. Contact us</h2>
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
