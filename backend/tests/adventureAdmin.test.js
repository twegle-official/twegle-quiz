import { describe, it, expect } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app.js'
import Admin from '../src/models/Admin.js'

// Covers Twegle Adventure World's Phase 5 admin CRUD: create/update/delete
// for all 5 content types, and that the write routes actually enforce the
// analyst-is-read-only role split every other admin content type already
// has. See adminAdventureController.js for the behavior under test.
const app = createApp()

async function loginAdmin(role = 'superadmin') {
  const passwordHash = await bcrypt.hash('correct-horse', 10)
  await Admin.create({ name: `Test ${role}`, email: `${role}@test.com`, passwordHash, role })
  const res = await request(app).post('/api/auth/login').send({ email: `${role}@test.com`, password: 'correct-horse' })
  return res.body.token
}

describe('adventure admin', () => {
  it('rejects every route without a token', async () => {
    const res = await request(app).get('/api/admin/adventure/worlds')
    expect(res.status).toBe(401)
  })

  it('creates, lists, updates, and deletes a world', async () => {
    const token = await loginAdmin()

    const create = await request(app)
      .post('/api/admin/adventure/worlds')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Twegle Town', mapPosition: { x: 0.5, y: 0.9 } })
    expect(create.status).toBe(201)
    expect(create.body.world.slug).toBe('twegle-town') // auto-slugified
    const id = create.body.world._id

    const list = await request(app).get('/api/admin/adventure/worlds').set('Authorization', `Bearer ${token}`)
    expect(list.body.worlds).toHaveLength(1)

    const update = await request(app)
      .put(`/api/admin/adventure/worlds/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Twegle Town', mapPosition: { x: 0.5, y: 0.9 }, status: 'published' })
    expect(update.status).toBe(200)
    expect(update.body.world.status).toBe('published')

    const del = await request(app).delete(`/api/admin/adventure/worlds/${id}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(204)
    const listAfter = await request(app).get('/api/admin/adventure/worlds').set('Authorization', `Bearer ${token}`)
    expect(listAfter.body.worlds).toHaveLength(0)
  })

  it('creates a location tied to a world and populates the world summary back', async () => {
    const token = await loginAdmin()
    const world = await request(app).post('/api/admin/adventure/worlds').set('Authorization', `Bearer ${token}`).send({ name: 'Mystery School', mapPosition: { x: 0.5, y: 0.6 } })

    const create = await request(app)
      .post('/api/admin/adventure/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Library', world: world.body.world._id, mapPosition: { x: 0.3, y: 0.4 } })
    expect(create.status).toBe(201)
    expect(create.body.location.slug).toBe('library')

    const get = await request(app).get(`/api/admin/adventure/locations/${create.body.location._id}`).set('Authorization', `Bearer ${token}`)
    expect(get.body.location.world.name).toBe('Mystery School')
  })

  it('rejects a location with no world', async () => {
    const token = await loginAdmin()
    const res = await request(app).post('/api/admin/adventure/locations').set('Authorization', `Bearer ${token}`).send({ name: 'Orphan Room', mapPosition: { x: 0, y: 0 } })
    expect(res.status).toBe(400)
  })

  it('creates a quiz-type challenge requiring a refId, and rejects one missing it', async () => {
    const token = await loginAdmin()
    const world = await request(app).post('/api/admin/adventure/worlds').set('Authorization', `Bearer ${token}`).send({ name: 'W', mapPosition: { x: 0, y: 0 } })
    const location = await request(app).post('/api/admin/adventure/locations').set('Authorization', `Bearer ${token}`).send({ name: 'L', world: world.body.world._id, mapPosition: { x: 0, y: 0 } })

    const missing = await request(app)
      .post('/api/admin/adventure/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Today\'s Quiz', location: location.body.location._id, type: 'quiz' })
    expect(missing.status).toBe(400)

    const ok = await request(app)
      .post('/api/admin/adventure/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: "Today's Quiz", location: location.body.location._id, type: 'quiz', refId: 'some-quiz-slug' })
    expect(ok.status).toBe(201)

    const codeBreaker = await request(app)
      .post('/api/admin/adventure/challenges')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Decode It', location: location.body.location._id, type: 'code-breaker', payload: { cipher: 'ABC', answer: 'abc' } })
    expect(codeBreaker.status).toBe(201)
    expect(codeBreaker.body.challenge.payload.answer).toBe('abc')
  })

  it('rejects a duplicate collectible key with a friendly error, not a raw Mongo error', async () => {
    const token = await loginAdmin()
    const first = await request(app).post('/api/admin/adventure/collectibles').set('Authorization', `Bearer ${token}`).send({ name: 'Star', key: 'star', type: 'star' })
    expect(first.status).toBe(201)

    const dupe = await request(app).post('/api/admin/adventure/collectibles').set('Authorization', `Bearer ${token}`).send({ name: 'Star Again', key: 'star', type: 'star' })
    expect(dupe.status).toBe(400)
    expect(dupe.body.error).toMatch(/already used/)
  })

  it('creates a character tied to a world with no location, and one tied to a specific location', async () => {
    const token = await loginAdmin()
    const world = await request(app).post('/api/admin/adventure/worlds').set('Authorization', `Bearer ${token}`).send({ name: 'Adventure Forest', mapPosition: { x: 0, y: 0 } })
    const location = await request(app).post('/api/admin/adventure/locations').set('Authorization', `Bearer ${token}`).send({ name: 'Clearing', world: world.body.world._id, mapPosition: { x: 0, y: 0 } })

    const foxy = await request(app)
      .post('/api/admin/adventure/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Foxy', world: world.body.world._id, dialogueLines: ['Welcome!'] })
    expect(foxy.body.character.location).toBeNull()

    const local = await request(app)
      .post('/api/admin/adventure/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clearing Sprite', world: world.body.world._id, location: location.body.location._id })
    expect(local.body.character.location).toBeTruthy()
  })

  it("an analyst can read but not write", async () => {
    const analystToken = await loginAdmin('analyst')
    const read = await request(app).get('/api/admin/adventure/worlds').set('Authorization', `Bearer ${analystToken}`)
    expect(read.status).toBe(200)

    const write = await request(app).post('/api/admin/adventure/worlds').set('Authorization', `Bearer ${analystToken}`).send({ name: 'Nope', mapPosition: { x: 0, y: 0 } })
    expect(write.status).toBe(403)
  })
})
