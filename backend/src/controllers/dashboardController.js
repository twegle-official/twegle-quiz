import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import Story from '../models/Story.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import PlaySession from '../models/PlaySession.js'
import Feedback from '../models/Feedback.js'
import ActivityLog from '../models/ActivityLog.js'
import { computeWeeklyDigest } from './digestController.js'

const TOP_QUIZZES_LIMIT = 5
const RECENT_ACTIVITY_LIMIT = 5

// Everything the admin dashboard needs in one round trip, rather than the
// frontend firing off half a dozen separate requests on load — this is a
// landing page, so it's worth aggregating server-side once instead of
// reusing Analytics' many small endpoints piecemeal.
export async function getDashboard(req, res) {
  const [
    digest,
    quizCount,
    postCount,
    storyCount,
    friendshipQuizCount,
    unreadFeedbackCount,
    topQuizzes,
    recentActivity,
  ] = await Promise.all([
    computeWeeklyDigest(),
    Quiz.countDocuments({ status: 'published' }),
    Post.countDocuments({ status: 'published' }),
    Story.countDocuments({ status: 'published' }),
    FriendshipQuiz.countDocuments({ status: 'published' }),
    Feedback.countDocuments({ read: false }),
    PlaySession.aggregate([
      { $group: { _id: '$quiz', totalPlays: { $sum: 1 } } },
      { $sort: { totalPlays: -1 } },
      { $limit: TOP_QUIZZES_LIMIT },
      { $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' } },
      { $unwind: '$quiz' },
      { $project: { _id: 0, quizId: '$quiz._id', title: '$quiz.title', slug: '$quiz.slug', totalPlays: 1 } },
    ]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(RECENT_ACTIVITY_LIMIT),
  ])

  res.json({
    digest,
    contentCounts: {
      quizzes: quizCount,
      posts: postCount,
      stories: storyCount,
      friendshipQuizzes: friendshipQuizCount,
    },
    unreadFeedbackCount,
    topQuizzes,
    recentActivity,
  })
}
