import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import Quiz from '../src/models/Quiz.js'

// Covers the public quiz-taking flow: browsing published quizzes, opening
// one by its slug, and recording a play once someone finishes it. See
// quizController.js/playController.js for the behavior under test.
const app = createApp()

// A minimal, valid personality quiz — same shape createQuiz() in
// quizController.js would produce, built directly against the Mongoose
// model (not the admin API) since these tests are about the *public*
// play flow, not admin content creation.
async function seedQuiz(overrides = {}) {
  return Quiz.create({
    title: 'Which Snack Are You?',
    slug: 'which-snack-are-you',
    description: 'Find your inner snack.',
    emoji: '🍿',
    status: 'published',
    questions: [
      {
        text: 'Pick a weekend activity.',
        options: [
          { text: 'Napping', result: 'chips' },
          { text: 'Cooking', result: 'popcorn' },
        ],
      },
    ],
    results: [
      { key: 'chips', title: "You're Chips!", description: 'Salty and satisfying.' },
      { key: 'popcorn', title: "You're Popcorn!", description: 'Fun and a little messy.' },
    ],
    ...overrides,
  })
}

describe('public quiz-taking flow', () => {
  it('lists a published quiz on the homepage feed', async () => {
    await seedQuiz()

    const res = await request(app).get('/api/quizzes')

    expect(res.status).toBe(200)
    expect(res.body.quizzes).toHaveLength(1)
    expect(res.body.quizzes[0].slug).toBe('which-snack-are-you')
    expect(res.body.quizzes[0].totalPlays).toBe(0)
  })

  it('does not list a draft quiz on the homepage feed', async () => {
    await seedQuiz({ slug: 'still-a-draft', status: 'draft' })

    const res = await request(app).get('/api/quizzes')

    expect(res.status).toBe(200)
    expect(res.body.quizzes).toHaveLength(0)
  })

  it('fetches a published quiz by its slug, with its full question/result data', async () => {
    await seedQuiz()

    const res = await request(app).get('/api/quizzes/which-snack-are-you')

    expect(res.status).toBe(200)
    expect(res.body.quiz.title).toBe('Which Snack Are You?')
    expect(res.body.quiz.questions).toHaveLength(1)
    expect(res.body.quiz.results).toHaveLength(2)
  })

  it('404s for a quiz slug that does not exist', async () => {
    const res = await request(app).get('/api/quizzes/no-such-quiz')
    expect(res.status).toBe(404)
  })

  it('404s for a draft quiz opened directly by slug (not just hidden from the list)', async () => {
    await seedQuiz({ slug: 'hidden-draft', status: 'draft' })

    const res = await request(app).get('/api/quizzes/hidden-draft')
    expect(res.status).toBe(404)
  })

  it('records a play and reflects it in the next play-count fetch', async () => {
    await seedQuiz()

    const play = await request(app).post('/api/quizzes/which-snack-are-you/plays').send({
      resultKey: 'chips',
      anonymousId: 'test-visitor-1',
    })
    expect(play.status).toBe(201)

    const list = await request(app).get('/api/quizzes')
    expect(list.body.quizzes[0].totalPlays).toBe(1)
  })

  it('rejects recording a play with no resultKey/anonymousId', async () => {
    await seedQuiz()

    const res = await request(app).post('/api/quizzes/which-snack-are-you/plays').send({})
    expect(res.status).toBe(400)
  })
})
