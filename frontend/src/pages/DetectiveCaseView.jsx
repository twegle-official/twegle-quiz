import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchDetectiveCaseBySlug, solveDetectiveCase, getDetectiveShareUrl, recordEngagement } from '../api'
import { recordDetectiveCaseSolved } from '../utils/badges'
import { recordRecentlyViewed } from '../utils/recentlyViewed'
import { difficultyLabel, DETECTIVE_DIFFICULTY_META } from '../utils/detectiveDifficulty'
import BackButton from '../components/BackButton'
import ShareButtons from '../components/ShareButtons'
import PreviewBanner from '../components/PreviewBanner'
import { useDocumentMeta } from '../utils/useDocumentMeta'

// A function, not a plain array, since the labels depend on the case's own
// language (see isHindi below) — this file's other section headings
// already translate the same way, this tab switcher just hadn't caught up.
function getTabs(isHindi) {
  return [
    { key: 'suspects', label: isHindi ? '👤 संदिग्ध' : '👤 Suspects' },
    { key: 'evidence', label: isHindi ? '🔎 सबूत' : '🔎 Evidence' },
    { key: 'notes', label: isHindi ? '📝 जासूसी नोट्स' : '📝 Detective Notes' },
  ]
}

const MARKER_CYCLE = [null, '🟢', '🟡', '🔴']

// The full Twegle Detective investigation flow: intro -> investigate
// (suspects/evidence/notes tabs, clues unlocking progressively) -> final
// deduction (pick a suspect + answer follow-up questions) -> reveal. See
// DetectiveCase.js's model comment for why there's no separate per-player
// session model — everything except the final answer-check is trusted
// client-side, the same trade-off Puzzle's reveal-on-demand already makes.
export default function DetectiveCaseView() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const previewToken = searchParams.get('preview')

  const [detectiveCase, setCase] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [phase, setPhase] = useState('intro') // intro | investigate | deduce | result
  const [activeTab, setActiveTab] = useState('suspects')
  const [discoveredClues, setDiscoveredClues] = useState(() => new Set())
  const [openClueKey, setOpenClueKey] = useState(null)
  const [noteMarkers, setNoteMarkers] = useState({})
  const [revealedHints, setRevealedHints] = useState(0)
  const [chosenSuspectKey, setChosenSuspectKey] = useState(null)
  const [deductionAnswers, setDeductionAnswers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const viewedRef = useRef(false)

  useEffect(() => {
    fetchDetectiveCaseBySlug(slug, previewToken)
      .then((data) => (data ? setCase(data) : setNotFound(true)))
      .catch(() => setNotFound(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    if (!detectiveCase || viewedRef.current || previewToken) return
    viewedRef.current = true
    recordEngagement('detectiveCase', detectiveCase._id, 'view')
    recordRecentlyViewed({
      type: 'detective',
      url: `/detective/${detectiveCase.slug}`,
      title: detectiveCase.title,
      emoji: detectiveCase.emoji,
      gradient: detectiveCase.gradient,
    })
  }, [detectiveCase, previewToken])

  useDocumentMeta(
    detectiveCase && `${detectiveCase.emoji || '🕵️'} ${detectiveCase.title}`,
    detectiveCase && `A Twegle Detective mystery — ${detectiveCase.description}`
  )

  const isHindi = detectiveCase?.language === 'hi'

  const unlockedClues = useMemo(() => {
    if (!detectiveCase) return []
    return detectiveCase.clues.filter((c) => (c.unlocksAfter || []).every((k) => discoveredClues.has(k)))
  }, [detectiveCase, discoveredClues])

  const allCluesFound = detectiveCase ? discoveredClues.size >= detectiveCase.clues.length : false

  function discoverClue(key) {
    setDiscoveredClues((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setOpenClueKey(key)
  }

  function cycleMarker(suspectKey) {
    setNoteMarkers((prev) => {
      const current = prev[suspectKey] ?? null
      const idx = MARKER_CYCLE.indexOf(current)
      return { ...prev, [suspectKey]: MARKER_CYCLE[(idx + 1) % MARKER_CYCLE.length] }
    })
  }

  function startDeduction() {
    setDeductionAnswers(new Array(detectiveCase.deductionQuestions.length).fill(null))
    setPhase('deduce')
  }

  const allDeductionsAnswered = deductionAnswers.length > 0 && deductionAnswers.every((a) => a !== null)

  async function submitAccusation() {
    if (!chosenSuspectKey || !allDeductionsAnswered || submitting) return
    setSubmitting(true)
    try {
      const data = await solveDetectiveCase(slug, {
        chosenSuspectKey,
        deductionAnswers,
        cluesFoundCount: discoveredClues.size,
        hintsUsed: revealedHints,
      })
      recordDetectiveCaseSolved({
        slug,
        difficulty: detectiveCase.difficulty,
        score: data.score,
        cluesFound: data.cluesFound,
        totalClues: data.totalClues,
        correctSuspect: data.correctSuspect,
        deductionsCorrectCount: data.deductionsCorrectCount,
        totalDeductions: data.totalDeductions,
      })
      recordEngagement('detectiveCase', detectiveCase._id, 'share') // reuses the existing "share"-style completion signal — see WordOfTheDay's own recordEngagement call pattern
      setResult(data)
      setPhase('result')
    } catch {
      // Network hiccup — leave the player on the deduction screen to retry
    } finally {
      setSubmitting(false)
    }
  }

  function investigateAgain() {
    setPhase('intro')
    setActiveTab('suspects')
    setDiscoveredClues(new Set())
    setOpenClueKey(null)
    setNoteMarkers({})
    setRevealedHints(0)
    setChosenSuspectKey(null)
    setDeductionAnswers([])
    setResult(null)
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">That case doesn't exist.</p>
        <Link to="/?tab=detective" className="text-violet-600 font-semibold">Back to Detective</Link>
      </div>
    )
  }

  if (!detectiveCase) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl mx-auto" />
      </div>
    )
  }

  const diff = DETECTIVE_DIFFICULTY_META[detectiveCase.difficulty] || DETECTIVE_DIFFICULTY_META.rookie

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {previewToken && <PreviewBanner />}
      <div className="flex items-center justify-between mb-4">
        <BackButton />
      </div>

      {phase === 'intro' && (
        <div className="text-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white rounded-3xl p-8 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-300 mb-2">🕵️ Case File</p>
          <div className="text-6xl mb-4">{detectiveCase.emoji || '🕵️'}</div>
          <h1 className="text-2xl font-bold mb-3">{detectiveCase.title}</h1>
          <p className="text-sm text-amber-200 mb-4">
            {diff.stars} {difficultyLabel(detectiveCase.difficulty, isHindi ? 'hi' : 'en')} &nbsp;·&nbsp; ⏱ {detectiveCase.estimatedMinutes || 7} {isHindi ? 'मिनट' : 'min'}
          </p>
          <p className="text-white/90 leading-relaxed whitespace-pre-line text-left bg-black/20 rounded-2xl p-4 mb-6">
            {detectiveCase.intro}
          </p>
          <button
            onClick={() => setPhase('investigate')}
            className="px-8 py-3 rounded-full bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors"
          >
            {isHindi ? 'जांच शुरू करें' : 'Start Investigation'}
          </button>

          {/* Previously the only way to share a case was the reveal screen
              after solving it, or the small tile icon on the browse grid —
              easy to miss if a visitor lands here straight from a shared
              link. Added here too so "send this to a friend" is available
              before investigating, not just after. */}
          <div className="mt-6">
            <ShareButtons
              title={detectiveCase.title}
              url={getDetectiveShareUrl(detectiveCase.slug)}
              shareText={
                isHindi
                  ? `🕵️ क्या तुम "${detectiveCase.title}" रहस्य सुलझा सकते हो? Twegle Detective पर कोशिश करो!`
                  : `🕵️ Can you solve "${detectiveCase.title}"? Try Twegle Detective!`
              }
            />
          </div>
        </div>
      )}

      {phase === 'investigate' && (
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {getTabs(isHindi).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'suspects' && (
            <div className="space-y-3">
              {detectiveCase.suspects.map((s) => (
                <div key={s.key} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{s.avatar || '🕵️'}</span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{s.name}</p>
                      {s.role && <p className="text-xs text-gray-500 dark:text-gray-400">{s.role}</p>}
                    </div>
                  </div>
                  {s.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{s.description}</p>}
                  {s.statement && (
                    <p className="text-sm italic text-gray-700 dark:text-gray-300 mt-2 border-l-2 border-amber-400 pl-3">
                      "{s.statement}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                {discoveredClues.size}/{detectiveCase.clues.length} {isHindi ? 'सबूत मिले' : 'clues found'}
              </p>
              <div className="space-y-3">
                {detectiveCase.clues.map((c) => {
                  const isDiscovered = discoveredClues.has(c.key)
                  const isUnlocked = unlockedClues.some((u) => u.key === c.key)
                  const isOpen = openClueKey === c.key
                  if (!isUnlocked) {
                    return (
                      <div key={c.key} className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-gray-400 dark:text-gray-600 text-sm flex items-center gap-2">
                        🔒 {isHindi ? 'और जांच करने पर पता चलेगा' : 'Investigate further to uncover this'}
                      </div>
                    )
                  }
                  return (
                    <button
                      key={c.key}
                      onClick={() => (isDiscovered ? setOpenClueKey(isOpen ? null : c.key) : discoverClue(c.key))}
                      className="w-full text-left rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {isDiscovered ? '🔎' : '❓'} {isDiscovered ? c.title : (isHindi ? 'नया सुराग — जांचें' : 'New lead — tap to investigate')}
                        </p>
                        {c.location && isDiscovered && (
                          <span className="text-[10px] uppercase tracking-wide font-semibold text-amber-600 dark:text-amber-400">{c.location}</span>
                        )}
                      </div>
                      {isDiscovered && isOpen && (
                        <>
                          {c.image && <img src={c.image} alt={c.title} className="w-full rounded-xl mt-3 max-h-56 object-cover" />}
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{c.description}</p>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {isHindi ? 'संदिग्ध' : 'Suspects'}
                </p>
                <div className="space-y-1.5">
                  {detectiveCase.suspects.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => cycleMarker(s.key)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</span>
                      <span className="text-lg">{noteMarkers[s.key] || '⚪'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {isHindi ? 'सबूत' : 'Evidence'}
                </p>
                {discoveredClues.size === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">{isHindi ? 'अभी तक कोई सबूत नहीं मिला।' : 'No clues found yet.'}</p>
                ) : (
                  <ul className="space-y-1">
                    {detectiveCase.clues.filter((c) => discoveredClues.has(c.key)).map((c) => (
                      <li key={c.key} className="text-sm text-gray-700 dark:text-gray-300">✓ {c.title}</li>
                    ))}
                  </ul>
                )}
              </div>

              {detectiveCase.hints?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    {isHindi ? 'संकेत' : 'Hints'}
                  </p>
                  {detectiveCase.hints.slice(0, revealedHints).map((h, i) => (
                    <p key={i} className="text-sm text-amber-700 dark:text-amber-300 mb-1">💡 {h.text}</p>
                  ))}
                  {revealedHints < detectiveCase.hints.length && (
                    <button
                      onClick={() => setRevealedHints((n) => n + 1)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {isHindi ? '+ एक संकेत पाएं' : '+ Reveal a hint'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deliberately not `sticky` — on a phone that overlapped the
              content list above it (nothing pushes the last card up out of
              the way when a sticky element floats on top of the normal
              document flow), so this is a plain in-flow button instead:
              scroll a little further and tap it, same as every other
              bottom-of-page button on the site. */}
          <div className="mt-6">
            <button
              onClick={startDeduction}
              disabled={!allCluesFound}
              className="w-full px-5 py-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {allCluesFound
                ? (isHindi ? 'फैसला करने का समय!' : 'Ready to Make Your Deduction!')
                : `${discoveredClues.size}/${detectiveCase.clues.length} ${isHindi ? 'सबूत मिले — बाकी ढूंढें' : 'clues found — keep investigating'}`}
            </button>
          </div>
        </div>
      )}

      {phase === 'deduce' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
            {isHindi ? 'आपको क्या लगता है, किसने किया?' : 'Who do you think did it?'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {detectiveCase.suspects.map((s) => (
              <button
                key={s.key}
                onClick={() => setChosenSuspectKey(s.key)}
                className={`rounded-2xl border-2 p-4 text-center transition-colors ${
                  chosenSuspectKey === s.key
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-3xl mb-1">{s.avatar || '🕵️'}</div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{s.name}</p>
              </button>
            ))}
          </div>

          {chosenSuspectKey && (
            <div className="space-y-5">
              {detectiveCase.deductionQuestions.map((q, qIndex) => (
                <div key={qIndex}>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{q.question}</p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => setDeductionAnswers((a) => a.map((v, i) => (i === qIndex ? oIndex : v)))}
                        className={`text-left px-4 py-2.5 rounded-xl border font-medium transition-colors ${
                          deductionAnswers[qIndex] === oIndex
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200'
                            : 'border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={submitAccusation}
                disabled={!allDeductionsAnswered || submitting}
                className="w-full mt-2 px-5 py-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold disabled:opacity-40"
              >
                {submitting ? (isHindi ? 'जांच हो रही है...' : 'Checking...') : (isHindi ? 'अंतिम आरोप लगाएं' : 'Submit Final Accusation')}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'result' && result && (
        <div className="text-center">
          <div className="text-6xl mb-3">{result.correctSuspect ? '🎉' : '🕵️'}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {result.correctSuspect
              ? (isHindi ? 'केस सुलझ गया!' : 'CASE SOLVED!')
              : (isHindi ? 'करीब था, पर सही नहीं' : 'Not Quite Right')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {detectiveCase.suspects.find((s) => s.key === result.solution.correctSuspectKey)?.name} {isHindi ? 'ने यह किया।' : 'was behind it.'}
          </p>

          <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6">
            <p className="text-gray-800 dark:text-gray-200 mb-3">{result.solution.explanation}</p>
            {result.solution.provingClueKeys?.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {isHindi ? 'साबित करने वाले सबूत' : 'The clues that proved it'}
                </p>
                <ul className="space-y-0.5">
                  {result.solution.provingClueKeys.map((key) => {
                    const clue = detectiveCase.clues.find((c) => c.key === key)
                    return clue ? <li key={key} className="text-sm text-amber-700 dark:text-amber-300">🔎 {clue.title}</li> : null
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.score}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isHindi ? 'डिटेक्टिव स्कोर' : 'Detective Score'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.cluesFound}/{result.totalClues}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isHindi ? 'सबूत मिले' : 'Clues found'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.correctSuspect ? '✓' : '✗'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isHindi ? 'सही संदिग्ध' : 'Correct suspect'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.deductionsCorrectCount}/{result.totalDeductions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isHindi ? 'सही निष्कर्ष' : 'Deductions correct'}</p>
            </div>
          </div>

          <ShareButtons
            title={detectiveCase.title}
            url={getDetectiveShareUrl(detectiveCase.slug)}
            shareText={
              isHindi
                ? `🕵️ मैंने Twegle Detective का केस सुलझाया! "${detectiveCase.title}" — स्कोर: ${result.score}. क्या तुम सुलझा सकते हो?`
                : `🕵️ I solved Twegle's Mystery! CASE: ${detectiveCase.title} — Score: ${result.score}. Can you solve it?`
            }
          />

          <div className="flex items-center justify-center gap-6 mt-8">
            <button onClick={investigateAgain} className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              🔁 {isHindi ? 'फिर से जांच करें' : 'Investigate Again'}
            </button>
            <Link to="/?tab=detective" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {isHindi ? 'और केस देखें →' : 'More cases →'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
