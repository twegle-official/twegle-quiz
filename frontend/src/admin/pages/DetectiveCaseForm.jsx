import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getDetectiveCaseAdmin, createDetectiveCase, updateDetectiveCase } from '../adminApi'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/datetimeLocal'
import ImageUploadField from '../components/ImageUploadField'

const emptyCase = {
  title: '',
  slug: '',
  description: '',
  intro: '',
  difficulty: 'rookie',
  estimatedMinutes: 7,
  emoji: '🕵️',
  language: 'en',
  status: 'draft',
  publishAt: null,
  suspects: [{ key: '', name: '', avatar: '🕵️', role: '', description: '', statement: '' }],
  clues: [{ key: '', title: '', description: '', image: '', location: '', unlocksAfterText: '' }],
  deductionQuestions: [{ question: '', options: ['', ''], correctIndex: 0, explanation: '' }],
  hints: [],
  solution: { correctSuspectKey: '', explanation: '', provingClueKeys: [] },
}

// A clue's `unlocksAfter` is a list of other clue keys, edited here as one
// comma-separated text field (simpler than a proper multi-select for what's
// usually 0-2 dependencies) — converted to/from the real array only at the
// form's own edges (load and submit), so the rest of this component can
// just treat it as a normal text input.
function toFormClue(clue) {
  return { ...clue, unlocksAfterText: (clue.unlocksAfter || []).join(', ') }
}
function fromFormClue(clue) {
  const { unlocksAfterText, ...rest } = clue
  return {
    ...rest,
    unlocksAfter: unlocksAfterText.split(',').map((k) => k.trim()).filter(Boolean),
  }
}

// This page is the form for creating or editing one Twegle Detective case
// — a story, its suspects, its discoverable clues, its deduction questions,
// and its solution, all in one form (same "add/remove rows within one big
// form" pattern FriendshipQuizForm.jsx already uses for nested questions,
// just with more nested sections).
export default function DetectiveCaseForm() {
  const { session } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [detectiveCase, setCase] = useState(emptyCase)
  const [publishAtLocal, setPublishAtLocal] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getDetectiveCaseAdmin(session.token, id)
      .then((data) => {
        setCase({
          ...data.case,
          clues: data.case.clues.map(toFormClue),
          hints: data.case.hints || [],
        })
        setPublishAtLocal(toDatetimeLocalValue(data.case.publishAt))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function updateField(field, value) {
    setCase((c) => ({ ...c, [field]: value }))
  }

  // --- Suspects ---
  function updateSuspect(index, field, value) {
    setCase((c) => {
      const suspects = [...c.suspects]
      suspects[index] = { ...suspects[index], [field]: value }
      return { ...c, suspects }
    })
  }
  function addSuspect() {
    setCase((c) => ({ ...c, suspects: [...c.suspects, { key: '', name: '', avatar: '🕵️', role: '', description: '', statement: '' }] }))
  }
  function removeSuspect(index) {
    setCase((c) => ({ ...c, suspects: c.suspects.filter((_, i) => i !== index) }))
  }

  // --- Clues ---
  function updateClue(index, field, value) {
    setCase((c) => {
      const clues = [...c.clues]
      clues[index] = { ...clues[index], [field]: value }
      return { ...c, clues }
    })
  }
  function addClue() {
    setCase((c) => ({ ...c, clues: [...c.clues, { key: '', title: '', description: '', image: '', location: '', unlocksAfterText: '' }] }))
  }
  function removeClue(index) {
    setCase((c) => ({ ...c, clues: c.clues.filter((_, i) => i !== index) }))
  }

  // --- Deduction questions ---
  function updateQuestion(index, field, value) {
    setCase((c) => {
      const qs = [...c.deductionQuestions]
      qs[index] = { ...qs[index], [field]: value }
      return { ...c, deductionQuestions: qs }
    })
  }
  function updateQuestionOption(qIndex, oIndex, value) {
    setCase((c) => {
      const qs = [...c.deductionQuestions]
      const options = [...qs[qIndex].options]
      options[oIndex] = value
      qs[qIndex] = { ...qs[qIndex], options }
      return { ...c, deductionQuestions: qs }
    })
  }
  function addQuestionOption(qIndex) {
    setCase((c) => {
      const qs = [...c.deductionQuestions]
      qs[qIndex] = { ...qs[qIndex], options: [...qs[qIndex].options, ''] }
      return { ...c, deductionQuestions: qs }
    })
  }
  function addQuestion() {
    setCase((c) => ({ ...c, deductionQuestions: [...c.deductionQuestions, { question: '', options: ['', ''], correctIndex: 0, explanation: '' }] }))
  }
  function removeQuestion(index) {
    setCase((c) => ({ ...c, deductionQuestions: c.deductionQuestions.filter((_, i) => i !== index) }))
  }

  // --- Hints ---
  function updateHint(index, value) {
    setCase((c) => {
      const hints = [...c.hints]
      hints[index] = { text: value }
      return { ...c, hints }
    })
  }
  function addHint() {
    setCase((c) => ({ ...c, hints: [...c.hints, { text: '' }] }))
  }
  function removeHint(index) {
    setCase((c) => ({ ...c, hints: c.hints.filter((_, i) => i !== index) }))
  }

  // --- Solution ---
  function updateSolution(field, value) {
    setCase((c) => ({ ...c, solution: { ...c.solution, [field]: value } }))
  }
  function toggleProvingClue(key) {
    setCase((c) => {
      const current = c.solution.provingClueKeys || []
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
      return { ...c, solution: { ...c.solution, provingClueKeys: next } }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...detectiveCase,
        clues: detectiveCase.clues.map(fromFormClue),
        publishAt: fromDatetimeLocalValue(publishAtLocal),
      }
      if (isEdit) {
        await updateDetectiveCase(session.token, id, payload)
      } else {
        await createDetectiveCase(session.token, payload)
      }
      navigate('/admin/detective')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Loading...</p>

  const inputClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm'

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {isEdit ? 'Edit Detective Case' : 'New Detective Case'}
      </h1>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {/* Basic info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input required value={detectiveCase.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short description (shown on the case tile)</label>
          <input required value={detectiveCase.description} onChange={(e) => updateField('description', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intro / story (shown before "Start Investigation")</label>
          <textarea required rows={4} value={detectiveCase.intro} onChange={(e) => updateField('intro', e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
            <select value={detectiveCase.difficulty} onChange={(e) => updateField('difficulty', e.target.value)} className={inputClass}>
              <option value="rookie">⭐ Rookie Detective</option>
              <option value="junior">⭐⭐ Junior Detective</option>
              <option value="master">⭐⭐⭐ Master Detective</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated minutes</label>
            <input type="number" min="1" value={detectiveCase.estimatedMinutes} onChange={(e) => updateField('estimatedMinutes', Number(e.target.value))} className={`${inputClass} w-24`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
            <input value={detectiveCase.emoji} onChange={(e) => updateField('emoji', e.target.value)} className={`${inputClass} w-20 text-center`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={detectiveCase.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select value={detectiveCase.language} onChange={(e) => updateField('language', e.target.value)} className={inputClass}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Publish at <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input type="datetime-local" value={publishAtLocal} onChange={(e) => setPublishAtLocal(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Suspects */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Suspects</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">At least 2 needed. "Key" is a short id (e.g. "alex") used to reference this suspect from the solution below — must be unique in this case.</p>
        <div className="space-y-4">
          {detectiveCase.suspects.map((s, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input placeholder="key (e.g. alex)" value={s.key} onChange={(e) => updateSuspect(i, 'key', e.target.value)} className={`${inputClass} w-28`} />
                <input placeholder="Avatar emoji" value={s.avatar} onChange={(e) => updateSuspect(i, 'avatar', e.target.value)} className={`${inputClass} w-20 text-center`} />
                <input placeholder="Name" value={s.name} onChange={(e) => updateSuspect(i, 'name', e.target.value)} className={`${inputClass} flex-1 min-w-[8rem]`} />
                <input placeholder="Role (e.g. Sports Captain)" value={s.role} onChange={(e) => updateSuspect(i, 'role', e.target.value)} className={`${inputClass} flex-1 min-w-[8rem]`} />
                <button type="button" onClick={() => removeSuspect(i)} className="text-red-500 text-sm px-2 shrink-0">Remove</button>
              </div>
              <textarea placeholder="Short description" rows={2} value={s.description} onChange={(e) => updateSuspect(i, 'description', e.target.value)} className={inputClass} />
              <textarea placeholder="Statement (what they say when questioned)" rows={2} value={s.statement} onChange={(e) => updateSuspect(i, 'statement', e.target.value)} className={inputClass} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addSuspect} className="mt-3 text-violet-600 text-sm font-semibold">+ Add Suspect</button>
      </div>

      {/* Clues */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Clues / Evidence</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">At least 3 needed. "Unlocks after" (optional) is a comma-separated list of other clue keys that must already be found before this one becomes available — leave blank for a clue that's available from the start.</p>
        <div className="space-y-4">
          {detectiveCase.clues.map((c, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input placeholder="key (e.g. footprints)" value={c.key} onChange={(e) => updateClue(i, 'key', e.target.value)} className={`${inputClass} w-32`} />
                <input placeholder="Title" value={c.title} onChange={(e) => updateClue(i, 'title', e.target.value)} className={`${inputClass} flex-1 min-w-[8rem]`} />
                <input placeholder="Location tag (e.g. Gym)" value={c.location} onChange={(e) => updateClue(i, 'location', e.target.value)} className={`${inputClass} w-32`} />
                <button type="button" onClick={() => removeClue(i)} className="text-red-500 text-sm px-2 shrink-0">Remove</button>
              </div>
              <textarea placeholder="Description" rows={2} value={c.description} onChange={(e) => updateClue(i, 'description', e.target.value)} className={inputClass} />
              <ImageUploadField value={c.image} onChange={(url) => updateClue(i, 'image', url)} label="Clue photo (optional)" />
              <input placeholder="Unlocks after (comma-separated clue keys)" value={c.unlocksAfterText} onChange={(e) => updateClue(i, 'unlocksAfterText', e.target.value)} className={`${inputClass} w-full`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addClue} className="mt-3 text-violet-600 text-sm font-semibold">+ Add Clue</button>
      </div>

      {/* Deduction questions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Deduction Questions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">At least 1 needed — asked after the player picks their suspect ("What was their motive?" etc.), so a correct suspect can't just be a lucky guess.</p>
        <div className="space-y-4">
          {detectiveCase.deductionQuestions.map((q, qIndex) => (
            <div key={qIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input placeholder={`Question ${qIndex + 1}`} value={q.question} onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)} className={`${inputClass} flex-1 min-w-[10rem]`} />
                <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 text-sm px-2 shrink-0">Remove question</button>
              </div>
              <div className="space-y-1.5 pl-3">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctIndex === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                      title="Correct answer"
                    />
                    <input placeholder={`Option ${oIndex + 1}`} value={option} onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)} className={`${inputClass} flex-1`} />
                  </div>
                ))}
                <button type="button" onClick={() => addQuestionOption(qIndex)} className="text-violet-600 text-sm font-medium">+ Add option</button>
              </div>
              <textarea placeholder="Explanation shown after answering (optional)" rows={2} value={q.explanation} onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)} className={inputClass} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addQuestion} className="mt-3 text-violet-600 text-sm font-semibold">+ Add Question</button>
      </div>

      {/* Hints */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Hints <span className="font-normal text-gray-400">(optional)</span></h2>
        <div className="space-y-2">
          {detectiveCase.hints.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input value={h.text} onChange={(e) => updateHint(i, e.target.value)} className={`${inputClass} flex-1`} placeholder="Hint text" />
              <button type="button" onClick={() => removeHint(i)} className="text-red-500 text-sm px-2 shrink-0">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addHint} className="mt-3 text-violet-600 text-sm font-semibold">+ Add Hint</button>
      </div>

      {/* Solution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 mb-6 space-y-3">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Solution</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Who did it?</label>
          <select value={detectiveCase.solution.correctSuspectKey} onChange={(e) => updateSolution('correctSuspectKey', e.target.value)} className={inputClass}>
            <option value="">Pick a suspect...</option>
            {detectiveCase.suspects.filter((s) => s.key).map((s) => (
              <option key={s.key} value={s.key}>{s.name || s.key}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation (shown on the reveal screen)</label>
          <textarea rows={3} value={detectiveCase.solution.explanation} onChange={(e) => updateSolution('explanation', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Which clues proved it?</label>
          <div className="flex flex-wrap gap-3">
            {detectiveCase.clues.filter((c) => c.key).map((c) => (
              <label key={c.key} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={(detectiveCase.solution.provingClueKeys || []).includes(c.key)}
                  onChange={() => toggleProvingClue(c.key)}
                />
                {c.title || c.key}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Case'}
      </button>
    </form>
  )
}
