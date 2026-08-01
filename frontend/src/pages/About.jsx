import { useDocumentMeta } from '../utils/useDocumentMeta'

export default function About() {
  useDocumentMeta('About', 'Who\'s behind Twegle, and how to get in touch.')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">About Twegle</h1>

      <p className="mb-4">
        Twegle is a free entertainment site — quick personality quizzes, jokes, funny lines,
        quotes, and motivational quotes, made to be taken in a minute and shared with a friend.
        No sign up, no waiting, nothing to install — just pick something and go.
      </p>
      <p className="mb-4">
        Everything on Twegle is available in both English and Hindi, with more languages planned
        as the site grows. New quizzes and posts are added regularly, so there's always something
        new to come back for.
      </p>
      <p className="mb-8">
        Twegle is built and run independently, with content written to be light, family-friendly,
        and fun for pretty much anyone — kids, teens, and adults alike.
      </p>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Contact</h2>
      <p>
        Got feedback, found a bug, or want to suggest a quiz topic? We'd genuinely like to hear
        it — reach out at{' '}
        <a href="mailto:twegle.official@gmail.com" className="text-violet-600 dark:text-violet-400 font-medium">
          twegle.official@gmail.com
        </a>
        .
      </p>
    </div>
  )
}
