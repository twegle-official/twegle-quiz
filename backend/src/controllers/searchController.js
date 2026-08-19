import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import Story from '../models/Story.js'
import Puzzle from '../models/Puzzle.js'

const RESULTS_PER_TYPE = 8 // max number of matches to return per content type
const MIN_QUERY_LENGTH = 2 // don't search until someone's typed at least this many characters

// Same "published, and either no publishAt or it's already passed" rule used
// by every other public list endpoint (scheduled-publishing support).
// Builds the "only show live content" filter, optionally narrowed to one language
function publishedFilter(language) {
  const filter = { status: 'published', $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }] }
  if (language === 'hi' || language === 'en') filter.language = language
  return filter
}

// Combined with publishedFilter via $and (not spread onto the same object)
// so this $or doesn't clobber publishedFilter's own $or key.
// Combines the "must be published" rule with the "must match the search text" rule
function withTextMatch(baseFilter, textOr) {
  return { $and: [baseFilter, { $or: textOr }] }
}

// Handles the site-wide search box — looks up the text across every content type at once
export async function search(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (q.length < MIN_QUERY_LENGTH) return res.json({ results: [] })

  // Escapes special regex characters so the search text is treated as plain text, not a pattern
  const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = { $regex: pattern, $options: 'i' } // case-insensitive "contains this text" match
  const language = req.query.language

  // Searches all content types in parallel and waits for every result to come back
  const [quizzes, posts, friendshipQuizzes, stories, puzzles] = await Promise.all([
    Quiz.find(withTextMatch(publishedFilter(language), [{ title: regex }, { description: regex }]))
      .select('title slug description emoji gradient category sponsor')
      .limit(RESULTS_PER_TYPE),
    Post.find(withTextMatch(publishedFilter(language), [{ text: regex }, { author: regex }]))
      .select('text author category imageUrl sponsor')
      .limit(RESULTS_PER_TYPE),
    FriendshipQuiz.find(withTextMatch(publishedFilter(language), [{ title: regex }, { description: regex }]))
      .select('title slug description emoji gradient')
      .limit(RESULTS_PER_TYPE),
    Story.find(withTextMatch(publishedFilter(language), [{ title: regex }, { body: regex }]))
      .select('title slug category emoji gradient')
      .limit(RESULTS_PER_TYPE),
    Puzzle.find(withTextMatch(publishedFilter(language), [{ question: regex }]))
      .select('question imageUrl difficulty emoji gradient')
      .limit(RESULTS_PER_TYPE),
  ])

  // Tags each result with its content type and flattens everything into one list
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
        sponsor: q.sponsor,
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
        sponsor: p.sponsor,
      })),
      ...puzzles.map((p) => ({
        type: 'puzzle',
        _id: p._id,
        question: p.question,
        imageUrl: p.imageUrl,
        emoji: p.emoji,
        gradient: p.gradient,
        difficulty: p.difficulty,
      })),
    ],
  })
}
