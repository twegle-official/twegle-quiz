import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getFriendshipQuizAdmin, createFriendshipQuiz, updateFriendshipQuiz } from '../adminApi'
import { GRADIENT_OPTIONS } from '../../gradients'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const emptyQuiz = {
  title: '',
  description: '',
  emoji: '',
  status: 'draft',
  gradient: GRADIENT_OPTIONS[0].value,
  language: 'en',
  publishAt: null,
  questions: [{ text: '', options: ['', ''] }],
}

export default function FriendshipQuizForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [quiz, setQuiz] = useState(emptyQuiz)
  const [publishAtLocal, setPublishAtLocal] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getFriendshipQuizAdmin(session.token, id)
      .then((data) => {
        setQuiz(data.quiz)
        setPublishAtLocal(toDatetimeLocalValue(data.quiz.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function updateField(field, value) {
    setQuiz((q) => ({ ...q, [field]: value }))
  }

  // --- Questions ---
  function updateQuestionText(qIndex, value) {
    setQuiz((q) => {
      const questions = [...q.questions]
      questions[qIndex] = { ...questions[qIndex], text: value }
      return { ...q, questions }
    })
  }
  function addQuestion() {
    setQuiz((q) => ({
      ...q,
      questions: [...q.questions, { text: '', options: ['', ''] }],
    }))
  }
  function removeQuestion(qIndex) {
    setQuiz((q) => ({ ...q, questions: q.questions.filter((_, i) => i !== qIndex) }))
  }

  function updateOption(qIndex, oIndex, value) {
    setQuiz((q) => {
      const questions = [...q.questions]
      const options = [...questions[qIndex].options]
      options[oIndex] = value
      questions[qIndex] = { ...questions[qIndex], options }
      return { ...q, questions }
    })
  }
  function addOption(qIndex) {
    setQuiz((q) => {
      const questions = [...q.questions]
      questions[qIndex] = { ...questions[qIndex], options: [...questions[qIndex].options, ''] }
      return { ...q, questions }
    })
  }
  function removeOption(qIndex, oIndex) {
    setQuiz((q) => {
      const questions = [...q.questions]
      questions[qIndex] = {
        ...questions[qIndex],
        options: questions[qIndex].options.filter((_, i) => i !== oIndex),
      }
      return { ...q, questions }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...quiz, publishAt: fromDatetimeLocalValue(publishAtLocal) }
      if (isEdit) {
        await updateFriendshipQuiz(session.token, id, payload)
      } else {
        await createFriendshipQuiz(session.token, payload)
      }
      navigate('/admin/friendship-quizzes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {isEdit ? 'Edit Friendship Quiz' : 'New Friendship Quiz'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Basic info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            required
            value={quiz.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input
            value={quiz.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
            <input
              value={quiz.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={quiz.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Color</label>
            <select
              value={quiz.gradient}
              onChange={(e) => updateField('gradient', e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {GRADIENT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select
              value={quiz.language}
              onChange={(e) => updateField('language', e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Publish at <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={publishAtLocal}
              onChange={(e) => setPublishAtLocal(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Questions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Each question needs at least 2 fixed answer options — the person filling this in picks the
          one that's true about them, and a friend later guesses which one they picked.
        </p>
        <div className="space-y-5">
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  placeholder={`Question ${qIndex + 1}`}
                  value={question.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex-1 min-w-[10rem] px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-500 text-sm px-2 shrink-0"
                >
                  Remove question
                </button>
              </div>

              <div className="space-y-2 pl-3">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex flex-wrap gap-2">
                    <input
                      placeholder={`Option ${oIndex + 1} (e.g. 🍕 Pizza)`}
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex-1 min-w-[8rem] px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-red-500 text-sm px-1 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-violet-600 text-sm font-medium"
                >
                  + Add answer option
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addQuestion}
          className="mt-3 text-violet-600 text-sm font-semibold"
        >
          + Add Question
        </button>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Friendship Quiz'}
      </button>
    </form>
  )
}
