import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import Story from '../models/Story.js'
import Puzzle from '../models/Puzzle.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import PlaySession from '../models/PlaySession.js'
import GameSession from '../models/GameSession.js'
import FriendshipAttempt from '../models/FriendshipAttempt.js'
import PostEngagement from '../models/PostEngagement.js'
import Feedback from '../models/Feedback.js'
import ActivityLog from '../models/ActivityLog.js'
import { computeDigestForRange } from './digestController.js'

const TOP_LIMIT = 5 // how many top items to show in each "most popular" list
const RECENT_ACTIVITY_LIMIT = 5 // how many recent admin actions to show

// How far back to look for each time range option, in milliseconds
const RANGE_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
  // 'all' deliberately has no entry — resolveSince returns null for it,
  // meaning "no date filter" rather than some huge lookback window.
}

// Turns a range name like "week" into an actual cutoff date (or null for "all time")
function resolveSince(range) {
  const ms = RANGE_MS[range]
  return ms ? new Date(Date.now() - ms) : null
}

// Everything the admin dashboard needs in one round trip, rather than the
// frontend firing off half a dozen separate requests on load — this is a
// landing page, so it's worth aggregating server-side once instead of
// reusing Analytics' many small endpoints piecemeal. `range` (day/week/
// month/year/all) controls both the digest numbers and which content
// counts as "top" — content counts (published totals) and unread feedback
// are always current-state, not time-windowed, since "how much do we have
// live right now" doesn't really have a date range.
// Builds all the numbers and lists shown on the admin homepage in one go
export async function getDashboard(req, res) {
  const range = ['day', 'week', 'month', 'year', 'all'].includes(req.query.range) ? req.query.range : 'week'
  const since = resolveSince(range)
  const dateMatch = since ? [{ $match: { createdAt: { $gte: since } } }] : [] // optional date filter used inside the aggregations below

  const [
    digest,
    quizCount,
    postCount,
    storyCount,
    puzzleCount,
    friendshipQuizCount,
    unreadFeedbackCount,
    topQuizzes,
    topFriendshipQuizzes,
    topGames,
    topPosts,
    recentActivity,
  ] = await Promise.all([
    computeDigestForRange(since),
    Quiz.countDocuments({ status: 'published' }), // how many quizzes are live right now
    Post.countDocuments({ status: 'published' }), // how many feed posts are live right now
    Story.countDocuments({ status: 'published' }), // how many stories are live right now
    Puzzle.countDocuments({ status: 'published' }), // how many puzzles are live right now
    FriendshipQuiz.countDocuments({ status: 'published' }), // how many friendship quizzes are live right now
    Feedback.countDocuments({ read: false }), // how many feedback entries haven't been looked at yet
    // Finds the most-played quizzes in this time range
    PlaySession.aggregate([
      ...dateMatch,
      { $group: { _id: '$quiz', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $project: { _id: 0, id: '$quiz._id', label: '$quiz.title', total: 1 } },
    ]),
    // Finds the most-played friendship quizzes in this time range
    FriendshipAttempt.aggregate([
      ...dateMatch,
      { $group: { _id: '$friendshipQuiz', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $lookup: { from: 'friendshipquizzes', localField: '_id', foreignField: '_id', as: 'fq' } },
      { $unwind: '$fq' },
      { $project: { _id: 0, id: '$fq._id', label: '$fq.title', total: 1 } },
    ]),
    // Finds the most-played games in this time range
    GameSession.aggregate([
      ...dateMatch,
      { $group: { _id: '$gameSlug', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $project: { _id: 0, slug: '$_id', total: 1 } },
    ]),
    // Finds the most-engaged-with feed posts in this time range
    PostEngagement.aggregate([
      ...dateMatch,
      { $group: { _id: '$post', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $lookup: { from: 'posts', localField: '_id', foreignField: '_id', as: 'post' } },
      { $unwind: '$post' },
      {
        $project: {
          _id: 0,
          id: '$post._id',
          label: '$post.text',
          total: 1,
        },
      },
    ]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(RECENT_ACTIVITY_LIMIT), // the latest actions admins have taken
  ])

  res.json({
    range,
    digest,
    contentCounts: {
      quizzes: quizCount,
      posts: postCount,
      stories: storyCount,
      puzzles: puzzleCount,
      friendshipQuizzes: friendshipQuizCount,
    },
    unreadFeedbackCount,
    topContent: {
      quizzes: topQuizzes,
      friendshipQuizzes: topFriendshipQuizzes,
      games: topGames,
      posts: topPosts,
    },
    recentActivity,
  })
}
