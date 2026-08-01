import Quiz from '../models/Quiz.js'
import PlaySession from '../models/PlaySession.js'

// Anonymous by design — see PlaySession.js. anonymousId is a client-generated
// id (e.g. stored in localStorage), never personal information.
export async function recordPlay(req, res) {
  const { quizSlug, resultKey, anonymousId, referrer } = req.body

  if (!quizSlug || !resultKey || !anonymousId) {
    return res.status(400).json({ error: 'quizSlug, resultKey, and anonymousId are required' })
  }

  const quiz = await Quiz.findOne({ slug: quizSlug })
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' })

  await PlaySession.create({
    quiz: quiz._id,
    resultKey,
    anonymousId,
    referrer: referrer || '',
  })

  res.status(201).json({ ok: true })
}

export async function getAnalyticsSummary(req, res) {
  const summary = await PlaySession.aggregate([
    {
      $group: {
        _id: '$quiz',
        totalPlays: { $sum: 1 },
        uniquePlayers: { $addToSet: '$anonymousId' },
      },
    },
    {
      $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' },
    },
    { $unwind: '$quiz' },
    {
      $project: {
        _id: 0,
        quizId: '$quiz._id',
        title: '$quiz.title',
        slug: '$quiz.slug',
        totalPlays: 1,
        uniquePlayers: { $size: '$uniquePlayers' },
      },
    },
    { $sort: { totalPlays: -1 } },
  ])

  res.json({ summary })
}
