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

const TOP_LIMIT = 5
const RECENT_ACTIVITY_LIMIT = 5

const RANGE_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
  // 'all' deliberately has no entry — resolveSince returns null for it,
  // meaning "no date filter" rather than some huge lookback window.
}

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
export async function getDashboard(req, res) {
  const range = ['day', 'week', 'month', 'year', 'all'].includes(req.query.range) ? req.query.range : 'week'
  const since = resolveSince(range)
  const dateMatch = since ? [{ $match: { createdAt: { $gte: since } } }] : []

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
    Quiz.countDocuments({ status: 'published' }),
    Post.countDocuments({ status: 'published' }),
    Story.countDocuments({ status: 'published' }),
    Puzzle.countDocuments({ status: 'published' }),
    FriendshipQuiz.countDocuments({ status: 'published' }),
    Feedback.countDocuments({ read: false }),
    PlaySession.aggregate([
      ...dateMatch,
      { $group: { _id: '$quiz', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $project: { _id: 0, id: '$quiz._id', label: '$quiz.title', total: 1 } },
    ]),
    FriendshipAttempt.aggregate([
      ...dateMatch,
      { $group: { _id: '$friendshipQuiz', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $lookup: { from: 'friendshipquizzes', localField: '_id', foreignField: '_id', as: 'fq' } },
      { $unwind: '$fq' },
      { $project: { _id: 0, id: '$fq._id', label: '$fq.title', total: 1 } },
    ]),
    GameSession.aggregate([
      ...dateMatch,
      { $group: { _id: '$gameSlug', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: TOP_LIMIT },
      { $project: { _id: 0, slug: '$_id', total: 1 } },
    ]),
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
          label: { $cond: [{ $eq: ['$post.category', 'meme'] }, 'Meme', '$post.text'] },
          total: 1,
        },
      },
    ]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(RECENT_ACTIVITY_LIMIT),
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
