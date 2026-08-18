import { useDocumentMeta } from '../utils/useDocumentMeta'
import BackButton from '../components/BackButton'

// A simple static page — the legal terms text, no data fetching or state.
export default function Terms() {
  useDocumentMeta('Terms of Service', 'The terms for using Twegle.')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">Last updated: 7 August 2026</p>

      <p className="mb-6">
        By using Twegle, you agree to these terms. They're written in plain language on purpose —
        Twegle is a free entertainment site, not a service with paid contracts, so there's no need
        to make this complicated.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">1. Entertainment only</h2>
      <p className="mb-6">
        Quizzes, results, puzzles, games, horoscopes, stories, jokes, funny lines, quotes, and
        motivational quotes on Twegle are for fun and entertainment only. Nothing on this site is
        professional advice of any kind — medical, psychological, legal, financial, or otherwise —
        and quiz results, puzzle-solving, and horoscopes are not a real assessment of your
        personality, health, future, or anything else. Don't rely on anything here for a decision
        that actually matters.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">2. Accounts are optional</h2>
      <p className="mb-3">
        You can use every feature on Twegle without signing up. If you'd like your streak, badges,
        and progress to follow you across devices, you can create a free account with a username
        and password — no email or phone number required.
      </p>
      <p className="mb-3">
        Since there's no email or phone number on file, forgotten passwords can only be reset with
        the one-time Recovery Code shown when you sign up — it's your responsibility to keep it
        somewhere safe. If both your password and Recovery Code are lost, we have no way to verify
        or restore access to the account, and it is permanently unrecoverable. You're welcome to
        create a new one at any time.
      </p>
      <p className="mb-3">
        Your public Gamer Tag may be shown to other visitors (for example, on a game leaderboard).
        Please don't use it, or your login username, to share your real name or any other
        identifying information.
      </p>
      <p className="mb-6">
        We may disable or remove an account that violates Section 3 below (Acceptable use). You
        can stop using an account at any time; since accounts hold no personal information beyond
        a username and password, there's nothing further for us to delete on request beyond the
        account record itself — contact us below if you'd like that removed.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">3. Acceptable use</h2>
      <p className="mb-6">
        Please don't use Twegle to do anything illegal, to try to break or overload the site
        (for example, automated scraping or bulk requests), or to attempt to access any admin or
        internal area you're not authorized to use. We reserve the right to block access for
        anyone who does.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">4. Content ownership</h2>
      <p className="mb-6">
        The quizzes, questions, results, puzzles, stories, horoscope text, jokes, funny lines,
        quotes, motivational quotes, logo, and design on Twegle belong to us (unless a quote is
        attributed to someone else, in which case it belongs to them). You're welcome to share a
        link or a generated result image with others — that's what it's for — but please don't
        copy the site's content wholesale to run elsewhere.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">5. Advertising &amp; affiliate links</h2>
      <p className="mb-6">
        Some pages may contain affiliate links — if you click through and buy something, Twegle
        may earn a small commission at no extra cost to you, and any such link is clearly marked.
        Twegle may also display advertising to help keep the site free; see our{' '}
        <a href="/privacy" className="text-violet-600 dark:text-violet-400 font-medium">Privacy Policy</a> for details
        on how ads work here.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">6. Family-friendly content</h2>
      <p className="mb-6">
        Twegle is meant to be safe and appropriate for a general audience, including children. If
        you ever come across content that doesn't feel family-friendly, please let us know using
        the contact details below so we can fix it.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">7. No warranty, limited liability</h2>
      <p className="mb-6">
        Twegle is provided "as is," for fun, with no guarantees about accuracy, availability, or
        that it will always be free of errors. To the fullest extent allowed by law, we're not
        liable for any loss or damage arising from your use of the site.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">8. Changes to these terms</h2>
      <p className="mb-6">
        We may update these terms as the site grows — for example, if we add new features or
        content types. The "last updated" date above will always reflect the latest version, and
        continuing to use Twegle after a change means you accept the updated terms.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">9. Contact us</h2>
      <p>
        Questions about these terms? Reach us at{' '}
        <a href="mailto:twegle.official@gmail.com" className="text-violet-600 dark:text-violet-400 font-medium">
          twegle.official@gmail.com
        </a>
        .
      </p>
    </div>
  )
}
