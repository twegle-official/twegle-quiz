import PlaySession from '../models/PlaySession.js'
import GameSession from '../models/GameSession.js'
import FriendshipAttempt from '../models/FriendshipAttempt.js'
import PostEngagement from '../models/PostEngagement.js'
import Engagement from '../models/Engagement.js'
import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import Story from '../models/Story.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// A 3-number summary for the top of admin Analytics — "how's the last week
// looked" without scanning six separate tables. Deliberately just three
// counts (plays, views+shares, new content), each a straight count across
// every model that tracks that kind of activity — no per-item detail here,
// that's what the tables below it are for.
// Extracted so the dashboard endpoint can reuse the exact same numbers
// instead of re-deriving them or making the frontend call two endpoints.
export async function computeWeeklyDigest() {
  const since = new Date(Date.now() - WEEK_MS)
  const filter = { createdAt: { $gte: since } }

  const [quizPlays, gamePlays, friendshipAttempts, postViews, otherViews, newQuizzes, newPosts, newStories, newFriendshipQuizzes] =
    await Promise.all([
      PlaySession.countDocuments(filter),
      GameSession.countDocuments(filter),
      FriendshipAttempt.countDocuments(filter),
      PostEngagement.countDocuments(filter),
      Engagement.countDocuments(filter),
      Quiz.countDocuments(filter),
      Post.countDocuments(filter),
      Story.countDocuments(filter),
      FriendshipQuiz.countDocuments(filter),
    ])

  return {
    totalPlays: quizPlays + gamePlays + friendshipAttempts,
    totalViewsAndShares: postViews + otherViews,
    newContentCount: newQuizzes + newPosts + newStories + newFriendshipQuizzes,
  }
}

export async function getWeeklyDigest(req, res) {
  const digest = await computeWeeklyDigest()
  res.json({ digest })
}
