import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import FriendshipQuiz from '../src/models/FriendshipQuiz.js'

// Covers the "guess" mode Friendship Quiz flow end to end: person A
// (the subject) submits real answers about themselves and gets a
// shareable code, then person B (a friend) opens that code, submits
// guesses, and gets scored against person A's real answers. See
// friendshipInstanceController.js for the behavior under test.
const app = createApp()

async function seedTemplate(overrides = {}) {
  return FriendshipQuiz.create({
    title: 'How Well Do You Know Me?',
    slug: 'how-well-do-you-know-me-test',
    description: 'Answer about yourself, then see who really knows you.',
    emoji: '🤝',
    status: 'published',
    mode: 'guess',
    questions: [
      { text: 'My go-to comfort food is...', options: ['Pizza', 'Noodles', 'Chocolate'] },
      { text: 'My hidden talent is...', options: ['Singing', 'Drawing', 'Cooking'] },
    ],
    ...overrides,
  })
}

describe('Friendship Quiz (guess mode) flow', () => {
  it('lets person A submit real answers and get back a shareable code', async () => {
    await seedTemplate()

    const res = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0, 2],
    })

    expect(res.status).toBe(201)
    expect(res.body.code).toBeTruthy()
  })

  it('rejects person A submitting a wrong number of answers', async () => {
    await seedTemplate()

    const res = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0], // template has 2 questions
    })

    expect(res.status).toBe(400)
  })

  it("lets a friend open the instance without seeing person A's real answers", async () => {
    await seedTemplate()
    const create = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0, 2],
    })

    const res = await request(app).get(`/api/friendship/instances/${create.body.code}`)

    expect(res.status).toBe(200)
    expect(res.body.subjectName).toBe('Ashish')
    expect(res.body.questions).toHaveLength(2)
    // The real answers must never be sent to a friend who hasn't guessed yet.
    expect(res.body.answers).toBeUndefined()
  })

  it('scores a full match as a perfect score', async () => {
    await seedTemplate()
    const create = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0, 2],
    })

    const res = await request(app).post(`/api/friendship/instances/${create.body.code}/attempts`).send({
      guesserName: 'Priya',
      guesses: [0, 2], // matches both real answers
      anonymousId: 'friend-visitor-1',
    })

    expect(res.status).toBe(201)
    expect(res.body.score).toBe(2)
    expect(res.body.total).toBe(2)
    expect(res.body.results.every((r) => r.correct)).toBe(true)
  })

  it('scores a partial match correctly, per question', async () => {
    await seedTemplate()
    const create = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0, 2],
    })

    const res = await request(app).post(`/api/friendship/instances/${create.body.code}/attempts`).send({
      guesserName: 'Rohan',
      guesses: [0, 1], // first right, second wrong
      anonymousId: 'friend-visitor-2',
    })

    expect(res.status).toBe(201)
    expect(res.body.score).toBe(1)
    expect(res.body.results[0].correct).toBe(true)
    expect(res.body.results[1].correct).toBe(false)
  })

  it('lets the result be fetched again later by attempt id, with the same score', async () => {
    await seedTemplate()
    const create = await request(app).post('/api/friendship/quizzes/how-well-do-you-know-me-test/instances').send({
      subjectName: 'Ashish',
      answers: [0, 2],
    })
    const attempt = await request(app).post(`/api/friendship/instances/${create.body.code}/attempts`).send({
      guesserName: 'Priya',
      guesses: [0, 2],
      anonymousId: 'friend-visitor-1',
    })

    const res = await request(app).get(`/api/friendship/attempts/${attempt.body.attemptId}`)

    expect(res.status).toBe(200)
    expect(res.body.score).toBe(2)
    expect(res.body.guesserName).toBe('Priya')
  })

  it('404s for an instance code that does not exist', async () => {
    const res = await request(app).get('/api/friendship/instances/no-such-code')
    expect(res.status).toBe(404)
  })
})
