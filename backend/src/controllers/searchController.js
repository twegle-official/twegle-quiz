import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import Story from '../models/Story.js'

const RESULTS_PER_TYPE = 8
const MIN_QUERY_LENGTH = 2

// Same "published, and either no publishAt or it's already passed" rule used
// by every other public list endpoint (scheduled-publishing support).
function publishedFilter(language) {
  const filter = { status: 'published', $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }] }
  if (language === 'hi' || language === 'en') filter.language = language
  return filter
}

// Combined with publishedFilter via $and (not spread onto the same object)
// so this $or doesn't clobber publishedFilter's own $or key.
function withTextMatch(baseFilter, textOr) {
  return { $and: [baseFilter, { $or: textOr }] }
}

export async function search(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (q.length < MIN_QUERY_LENGTH) return res.json({ results: [] })

  const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = { $regex: pattern, $options: 'i' }
  const language = req.query.language

  const [quizzes, posts, friendshipQuizzes, stories] = await Promise.all([
    Quiz.find(withTextMatch(publishedFilter(language), [{ title: regex }, { description: regex }]))
      .select('title slug description emoji gradient category')
      .limit(RESULTS_PER_TYPE),
    Post.find(withTextMatch(publishedFilter(language), [{ text: regex }, { author: regex }]))
      .select('text author category imageUrl')
      .limit(RESULTS_PER_TYPE),
    FriendshipQuiz.find(withTextMatch(publishedFilter(language), [{ title: regex }, { description: regex }]))
      .select('title slug description emoji gradient')
      .limit(RESULTS_PER_TYPE),
    Story.find(withTextMatch(publishedFilter(language), [{ title: regex }, { body: regex }]))
      .select('title slug category emoji gradient')
      .limit(RESULTS_PER_TYPE),
  ])

  res.json({
    results: [
      ...quizzes.map((q) => ({
        type: 'quiz',
        slug: q.slug,
        title: q.title,
        description: q.description,
        emoji: q.emoji,
        gradient: q.gradient,
        category: q.category,
      })),
      ...friendshipQuizzes.map((q) => ({
        type: 'friendship',
        slug: q.slug,
        title: q.title,
        description: q.description,
        emoji: q.emoji,
        gradient: q.gradient,
      })),
      ...stories.map((s) => ({
        type: 'story',
        slug: s.slug,
        title: s.title,
        emoji: s.emoji,
        gradient: s.gradient,
        category: s.category,
      })),
      ...posts.map((p) => ({
        type: 'post',
        _id: p._id,
        text: p.text,
        author: p.author,
        category: p.category,
        imageUrl: p.imageUrl,
      })),
    ],
  })
}
