import Quiz from '../models/Quiz.js'
import PlaySession from '../models/PlaySession.js'

// Anonymous by design — see PlaySession.js. anonymousId is a client-generated
// id (e.g. stored in localStorage), never personal information.
// Handles a visitor finishing a quiz — saves which quiz they played and which result they landed on.
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

// Builds the analytics numbers admins see — how many times each quiz was played and by how many different people.
export async function getAnalyticsSummary(req, res) {
  const summary = await PlaySession.aggregate([
    {
      $group: {
        _id: '$quiz', // group all play records together by which quiz they belong to
        totalPlays: { $sum: 1 }, // count how many times each quiz was played
        uniquePlayers: { $addToSet: '$anonymousId' }, // collect the distinct visitor ids who played
      },
    },
    {
      $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'quiz' }, // pull in the matching quiz's details
    },
    { $unwind: '$quiz' }, // turn the joined quiz array into a single quiz object
    {
      $project: {
        _id: 0,
        quizId: '$quiz._id',
        title: '$quiz.title',
        slug: '$quiz.slug',
        totalPlays: 1,
        uniquePlayers: { $size: '$uniquePlayers' }, // turn the list of unique player ids into a count
      },
    },
    { $sort: { totalPlays: -1 } }, // show the most-played quizzes first
  ])

  res.json({ summary })
}
