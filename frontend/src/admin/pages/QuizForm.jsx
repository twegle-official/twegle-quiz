import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getQuizAdmin, createQuiz, updateQuiz } from '../adminApi'
import { GRADIENT_OPTIONS } from '../../gradients'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'

const QUIZ_CATEGORIES = [
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'entertainment', label: 'Bollywood & Pop Culture' },
  { value: 'kpop', label: 'K-pop' },
  { value: 'lifestyle', label: 'Lifestyle & Personality' },
  { value: 'fun', label: 'Fun & Random' },
]

const emptyQuiz = {
  title: '',
  description: '',
  emoji: '',
  status: 'draft',
  gradient: GRADIENT_OPTIONS[0].value,
  category: QUIZ_CATEGORIES[0].value,
  language: 'en',
  type: 'personality',
  publishAt: null,
  questions: [{ text: '', options: [{ text: '', result: '' }] }],
  results: [{ key: '', emoji: '', title: '', description: '' }],
}

export default function QuizForm() {
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
    getQuizAdmin(session.token, id)
      .then((data) => {
        setQuiz({ type: 'personality', ...data.quiz })
        setPublishAtLocal(toDatetimeLocalValue(data.quiz.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function updateField(field, value) {
    setQuiz((q) => ({ ...q, [field]: value }))
  }

  // --- Results ---
  function updateResult(index, field, value) {
    setQuiz((q) => {
      const results = [...q.results]
      results[index] = { ...results[index], [field]: value }
      return { ...q, results }
    })
  }
  function addResult() {
    setQuiz((q) => ({
      ...q,
      results: [...q.results, { key: '', emoji: '', title: '', description: '' }],
    }))
  }
  function removeResult(index) {
    setQuiz((q) => ({ ...q, results: q.results.filter((_, i) => i !== index) }))
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
      questions: [...q.questions, { text: '', options: [{ text: '', result: '' }] }],
    }))
  }
  function removeQuestion(qIndex) {
    setQuiz((q) => ({ ...q, questions: q.questions.filter((_, i) => i !== qIndex) }))
  }

  function updateOption(qIndex, oIndex, field, value) {
    setQuiz((q) => {
      const questions = [...q.questions]
      const options = [...questions[qIndex].options]
      options[oIndex] = { ...options[oIndex], [field]: value }
      questions[qIndex] = { ...questions[qIndex], options }
      return { ...q, questions }
    })
  }
  function addOption(qIndex) {
    setQuiz((q) => {
      const questions = [...q.questions]
      questions[qIndex] = {
        ...questions[qIndex],
        options: [...questions[qIndex].options, { text: '', result: '' }],
      }
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
        await updateQuiz(session.token, id, payload)
      } else {
        await createQuiz(session.token, payload)
      }
      navigate('/admin/quizzes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  const resultKeys = quiz.results.map((r) => r.key).filter(Boolean)

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Quiz' : 'New Quiz'}
      </h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={quiz.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={quiz.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="bg-white text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              value={quiz.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              className="bg-white text-gray-900 w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={quiz.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Color</label>
            <select
              value={quiz.gradient}
              onChange={(e) => updateField('gradient', e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              {GRADIENT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
            <select
              value={quiz.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="personality">Personality (answers → a result)</option>
              <option value="trivia">Trivia (right/wrong → a score)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={quiz.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              {QUIZ_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={quiz.language}
              onChange={(e) => updateField('language', e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish at <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={publishAtLocal}
              onChange={(e) => setPublishAtLocal(e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to go live immediately once Published. Set a future date/time to keep it
              hidden from visitors until then, even if Status is already Published.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Results</h2>
        <p className="text-sm text-gray-500 mb-4">
          {quiz.type === 'trivia'
            ? 'Each possible score tier (e.g. 0-2 correct, 3-4 correct). Give each one a short unique key — it becomes part of the shareable result URL, same as a personality quiz\'s.'
            : 'Each possible outcome of the quiz. Give each one a short unique key (e.g. "oily") — you\'ll pick it from a list when setting up answer options below.'}
        </p>
        <div className="space-y-4">
          {quiz.results.map((result, i) => (
            <div key={i} className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  placeholder="key (e.g. oily)"
                  value={result.key}
                  onChange={(e) => updateResult(i, 'key', e.target.value)}
                  className="bg-white text-gray-900 w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  placeholder="emoji"
                  value={result.emoji}
                  onChange={(e) => updateResult(i, 'emoji', e.target.value)}
                  className="bg-white text-gray-900 w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
                />
                <input
                  placeholder="Title"
                  value={result.title}
                  onChange={(e) => updateResult(i, 'title', e.target.value)}
                  className="bg-white text-gray-900 flex-1 min-w-[8rem] px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                {quiz.type === 'trivia' && (
                  <>
                    <input
                      type="number"
                      min="0"
                      placeholder="Min score"
                      value={result.minScore ?? ''}
                      onChange={(e) => updateResult(i, 'minScore', e.target.value === '' ? null : Number(e.target.value))}
                      className="bg-white text-gray-900 w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max score"
                      value={result.maxScore ?? ''}
                      onChange={(e) => updateResult(i, 'maxScore', e.target.value === '' ? null : Number(e.target.value))}
                      className="bg-white text-gray-900 w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeResult(i)}
                  className="text-red-500 text-sm px-2 shrink-0"
                >
                  Remove
                </button>
              </div>
              <textarea
                placeholder="Description shown on the result page"
                value={result.description}
                onChange={(e) => updateResult(i, 'description', e.target.value)}
                className="bg-white text-gray-900 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addResult}
          className="mt-3 text-violet-600 text-sm font-semibold"
        >
          + Add Result
        </button>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Questions</h2>
        <div className="space-y-5">
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  placeholder={`Question ${qIndex + 1}`}
                  value={question.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  className="bg-white text-gray-900 flex-1 min-w-[10rem] px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
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
                      placeholder="Answer text"
                      value={option.text}
                      onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                      className="bg-white text-gray-900 flex-1 min-w-[8rem] px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    {quiz.type === 'trivia' ? (
                      <label className="flex items-center gap-1.5 px-2 py-1.5 text-sm shrink-0 text-gray-600">
                        <input
                          type="checkbox"
                          checked={option.result === 'correct'}
                          onChange={(e) => updateOption(qIndex, oIndex, 'result', e.target.checked ? 'correct' : 'incorrect')}
                        />
                        Correct
                      </label>
                    ) : (
                      <select
                        value={option.result}
                        onChange={(e) => updateOption(qIndex, oIndex, 'result', e.target.value)}
                        className="bg-white text-gray-900 px-2 py-1.5 border border-gray-300 rounded-lg text-sm shrink-0"
                      >
                        <option value="">Pick result...</option>
                        {resultKeys.map((key) => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    )}
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
        {saving ? 'Saving...' : 'Save Quiz'}
      </button>
    </form>
  )
}
