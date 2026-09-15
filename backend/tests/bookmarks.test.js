import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import Quiz from '../src/models/Quiz.js'

// Covers the bookmarks flow: an account saving/un-saving a quiz, listing
// what's saved (with content), and the account-only requirement. See
// bookmarkController.js for the behavior under test.
const app = createApp()

async function seedQuiz(overrides = {}) {
  return Quiz.create({
    title: 'Which Snack Are You?',
    slug: 'which-snack-are-you',
    description: 'Find your inner snack.',
    emoji: '🍿',
    status: 'published',
    questions: [{ text: 'Pick one.', options: [{ text: 'A', result: 'chips' }] }],
    results: [{ key: 'chips', title: "You're Chips!", description: 'Salty.' }],
    ...overrides,
  })
}

async function signup(username) {
  const res = await request(app).post('/api/users/signup').send({
    username,
    password: 'correct-horse',
    displayName: username,
  })
  return res.body.token
}

describe('bookmarks', () => {
  it('rejects every bookmark route for a guest (no token)', async () => {
    const quiz = await seedQuiz()
    const list = await request(app).get('/api/users/me/bookmarks')
    const add = await request(app).post('/api/users/me/bookmarks').send({ contentType: 'quiz', contentId: quiz._id.toString() })
    expect(list.status).toBe(401)
    expect(add.status).toBe(401)
  })

  it('saves a quiz, then lists it with its own content attached', async () => {
    const quiz = await seedQuiz()
    const token = await signup('bookmarker1')

    const add = await request(app)
      .post('/api/users/me/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'quiz', contentId: quiz._id.toString() })
    expect(add.status).toBe(201)

    const list = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    expect(list.body.bookmarks).toHaveLength(1)
    expect(list.body.bookmarks[0].contentType).toBe('quiz')
    expect(list.body.bookmarks[0].content.title).toBe('Which Snack Are You?')
  })

  it('rejects bookmarking content that does not exist', async () => {
    const token = await signup('bookmarker2')
    const res = await request(app)
      .post('/api/users/me/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'quiz', contentId: '6aa000000000000000000000' })
    expect(res.status).toBe(404)
  })

  it('treats saving the same item twice as a harmless no-op, not a duplicate', async () => {
    const quiz = await seedQuiz()
    const token = await signup('bookmarker3')

    await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })
    const second = await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })
    expect(second.status).toBe(201)

    const list = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`)
    expect(list.body.bookmarks).toHaveLength(1)
  })

  it('removes a bookmark', async () => {
    const quiz = await seedQuiz()
    const token = await signup('bookmarker4')
    await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })

    const remove = await request(app)
      .delete(`/api/users/me/bookmarks/quiz/${quiz._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
    expect(remove.status).toBe(204)

    const list = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`)
    expect(list.body.bookmarks).toHaveLength(0)
  })

  it("only returns just the ids from the ids endpoint, not full content", async () => {
    const quiz = await seedQuiz()
    const token = await signup('bookmarker5')
    await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })

    const res = await request(app).get('/api/users/me/bookmark-ids').set('Authorization', `Bearer ${token}`)
    expect(res.body.bookmarks).toEqual([{ contentType: 'quiz', contentId: quiz._id.toString() }])
  })

  it('excludes a bookmarked quiz that was since unpublished, from the list', async () => {
    const quiz = await seedQuiz({ slug: 'now-a-draft', status: 'published' })
    const token = await signup('bookmarker6')
    await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })

    quiz.status = 'draft'
    await quiz.save()

    const list = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${token}`)
    expect(list.body.bookmarks).toHaveLength(0)
  })

  it("keeps each account's bookmarks separate from another account's", async () => {
    const quiz = await seedQuiz()
    const tokenA = await signup('bookmarker7')
    const tokenB = await signup('bookmarker8')
    await request(app).post('/api/users/me/bookmarks').set('Authorization', `Bearer ${tokenA}`).send({ contentType: 'quiz', contentId: quiz._id.toString() })

    const listA = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${tokenA}`)
    const listB = await request(app).get('/api/users/me/bookmarks').set('Authorization', `Bearer ${tokenB}`)
    expect(listA.body.bookmarks).toHaveLength(1)
    expect(listB.body.bookmarks).toHaveLength(0)
  })
})
