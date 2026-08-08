import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { listFriendshipQuizzesAdmin, deleteFriendshipQuiz, createFriendshipQuiz } from '../adminApi'
import StatusLabel from '../components/StatusLabel'
import Pager from '../components/Pager'
import AdminPreviewButton from '../components/AdminPreviewButton'

const PAGE_SIZE = 20

export default function FriendshipQuizList() {
  const { session, hasRole } = useAuth()
  const [quizzes, setQuizzes] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const canWrite = hasRole('superadmin', 'editor')

  function load() {
    listFriendshipQuizzesAdmin(session.token, { page, limit: PAGE_SIZE })
      .then((data) => {
        setQuizzes(data.quizzes)
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [session.token, page])

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteFriendshipQuiz(session.token, id)
    load()
  }

  async function handleClone(quiz) {
    try {
      // See QuizList.jsx's handleClone for why this needs a unique tag, not
      // just a static "(Copy)" — same slug-collision reasoning for Hindi titles.
      const tag = Date.now().toString(36).slice(-4)
      await createFriendshipQuiz(session.token, {
        title: `${quiz.title} (Copy ${tag})`,
        description: quiz.description,
        emoji: quiz.emoji,
        gradient: quiz.gradient,
        language: quiz.language,
        status: 'draft',
        questions: quiz.questions,
      })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Friendship Quizzes</h1>
        {canWrite && (
          <Link
            to="/admin/friendship-quizzes/new"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            + New Friendship Quiz
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        These are question templates — "how well do you know me" style. A visitor picks one, fills
        in their own real answers, and shares the resulting link with friends to guess.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!quizzes && !error && <p className="text-gray-400 dark:text-gray-500">Loading...</p>}

      {quizzes && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          {quizzes.length === 0 && (
            <p className="p-6 text-gray-400 dark:text-gray-500 text-center">No friendship quizzes yet.</p>
          )}
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {quiz.emoji} {quiz.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  /{quiz.slug} · {quiz.questions.length} questions · <StatusLabel item={quiz} />
                </p>
              </div>
              <div className="flex gap-2">
                <AdminPreviewButton contentType="friendshipQuiz" id={quiz._id} publicPath={`/friendship/${quiz.slug}`} />
                {canWrite && (
                  <>
                    <button
                      onClick={() => handleClone(quiz)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Clone
                    </button>
                    <Link
                      to={`/admin/friendship-quizzes/${quiz._id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz._id, quiz.title)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <Pager page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  )
}
