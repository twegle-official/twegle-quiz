import mongoose from 'mongoose'

export const DETECTIVE_DIFFICULTIES = ['rookie', 'junior', 'master']

// A suspect the player can investigate. `key` is a short admin-chosen id
// (e.g. "alex") used to reference this suspect from the case's solution —
// deliberately not Mongo's own `_id`, so an admin authoring a case can
// write the solution before the document (and its real ids) exist yet.
const suspectSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '🕵️' }, // emoji shown as the suspect's portrait
    role: { type: String, default: '' }, // e.g. "Sports Captain"
    description: { type: String, default: '' },
    statement: { type: String, default: '' }, // what this suspect says when questioned
  },
  { _id: false }
)

// One piece of evidence. `unlocksAfter` gates progressive discovery — this
// clue only becomes available once every clue key listed there has already
// been found, so the investigation can't be fully skimmed at once (the
// point of a mystery). `location` is a free-text tag ("Gym", "Classroom")
// used purely to group clues in the investigation UI, not a separate
// content type of its own — keeps case-authoring to one form.
const clueSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' }, // optional picture, paste-a-URL like Puzzle.imageUrl
    location: { type: String, default: '' },
    unlocksAfter: { type: [String], default: [] }, // clue keys that must be found first
  },
  { _id: false }
)

// A multiple-choice follow-up asked during the final deduction, e.g. "What
// was their motive?" — `correctIndex` is never sent to the public list/
// detail response, only checked server-side when a case is solved (see
// detectiveController.js's `solveDetectiveCase`).
const deductionQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
)

const hintSchema = new mongoose.Schema(
  { text: { type: String, required: true } },
  { _id: false }
)

// The answer. Kept as its own nested object (not flattened onto the case)
// so it's trivial to `.select('-solution')` it away from every public
// response — see detectiveController.js. `correctSuspectKey`/
// `provingClueKeys` reference `suspects[].key`/`clues[].key` above, not
// database ids.
const solutionSchema = new mongoose.Schema(
  {
    correctSuspectKey: { type: String, required: true },
    explanation: { type: String, required: true },
    provingClueKeys: { type: [String], default: [] },
  },
  { _id: false }
)

// This is the database shape for one "Daily Mystery" / Twegle Detective
// case — an admin-authored investigation: a story, a handful of suspects,
// discoverable clues, a few deduction questions, and the solution. Mirrors
// every other admin-authored content type's status/language/publishAt
// shape (see Quiz.js's publishAt for the scheduled-publishing reasoning),
// with the investigation content nested underneath instead of a single
// question/answer pair.
//
// Deliberately no separate per-player "session" model (unlike Friendship
// Quiz's FriendshipInstance, or Skydrift Isles' server-tracked discovery
// log) — a case is played solo, not shared with anyone else the way an
// island or a friendship-quiz link is, so there's nothing another player
// could tamper with by a client trusting its own local investigation
// state. Only the final answer-check (`solveDetectiveCase`) is server-
// verified, the same "trust the client for the low-stakes parts, verify
// the one part that matters" trade-off Puzzle's reveal-on-demand already
// makes for its answer.
const detectiveCaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' }, // short teaser shown on the case's tile
    intro: { type: String, required: true }, // the longer story text shown before "Start Investigation"
    difficulty: { type: String, enum: DETECTIVE_DIFFICULTIES, default: 'rookie' },
    estimatedMinutes: { type: Number, default: 7 },
    emoji: { type: String, default: '🕵️' },
    gradient: { type: String, default: 'from-amber-500 to-orange-700' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishAt: { type: Date, default: null },
    suspects: { type: [suspectSchema], default: [] },
    clues: { type: [clueSchema], default: [] },
    deductionQuestions: { type: [deductionQuestionSchema], default: [] },
    hints: { type: [hintSchema], default: [] },
    solution: { type: solutionSchema, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('DetectiveCase', detectiveCaseSchema)
