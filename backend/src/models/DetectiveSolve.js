import mongoose from 'mongoose'

// One row per (detectiveCase, endUser) pair — the best score that account
// has ever gotten on that case, not a log of every attempt. Keeps replaying
// a case (see DetectiveCaseView.jsx's "Investigate Again") from growing this
// collection unbounded, and makes the leaderboard query a plain sorted find
// with no aggregation needed.
//
// Deliberately keyed by the case's own ObjectId, not a hardcoded slug list
// like GameScore.js's GAME_LEADERBOARDS — a leaderboard needs to exist for
// every case an admin creates, including ones that don't exist yet, without
// a developer ever touching code. Guest solves are never recorded here at
// all (unlike GameScore, which stores a free-typed nickname for guests too)
// — Detective's solve endpoint takes no nickname field, and per the same
// "accounts-only ranking" call the weekly game leaderboard already made,
// nothing meaningful to rank a guest attempt by exists here anyway.
const detectiveSolveSchema = new mongoose.Schema(
  {
    detectiveCase: { type: mongoose.Schema.Types.ObjectId, ref: 'DetectiveCase', required: true },
    endUser: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true },
    score: { type: Number, required: true },
    cluesFound: { type: Number, required: true },
    totalClues: { type: Number, required: true },
    correctSuspect: { type: Boolean, required: true },
    deductionsCorrectCount: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
  },
  { timestamps: true }
)

detectiveSolveSchema.index({ detectiveCase: 1, endUser: 1 }, { unique: true }) // one best-score row per account per case
detectiveSolveSchema.index({ detectiveCase: 1, score: -1 }) // speeds up fetching a case's leaderboard sorted by score

export default mongoose.model('DetectiveSolve', detectiveSolveSchema)
