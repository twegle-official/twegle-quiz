import { describe, it, expect } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app.js'
import AdventureWorld from '../src/models/AdventureWorld.js'
import AdventureLocation from '../src/models/AdventureLocation.js'
import AdventureChallenge from '../src/models/AdventureChallenge.js'
import Admin from '../src/models/Admin.js'

// Covers Twegle Adventure World's Phase 2 REST surface: public browsing,
// account-gated progress (auto-created on first visit), server-verified
// challenge completion and the unlock chain it triggers, and the daily
// treasure. See adventureController.js/adventureUnlocks.js for the
// behavior under test.
const app = createApp()

async function signup(username) {
  const res = await request(app).post('/api/users/signup').send({ username, password: 'correct-horse', displayName: username })
  return res.body.token
}

// A small 2-world chain: Twegle Town (always unlocked) -> Mystery School
// (unlocks once Twegle Town is 100% complete), one location + one
// challenge in each, so completing Town's only challenge should unlock
// both the second world and its first location in one call.
async function seedWorldChain() {
  const town = await AdventureWorld.create({ name: 'Twegle Town', slug: 'twegle-town', mapPosition: { x: 0.5, y: 0.9 }, status: 'published' })
  const school = await AdventureWorld.create({
    name: 'Mystery School',
    slug: 'mystery-school',
    mapPosition: { x: 0.5, y: 0.6 },
    status: 'published',
    unlockRequirement: { type: 'previousWorld', refSlug: 'twegle-town', percent: 100 },
  })
  const square = await AdventureLocation.create({ world: town._id, name: 'Town Square', slug: 'town-square', mapPosition: { x: 0.5, y: 0.9 }, status: 'published', unlockRequirement: { type: 'always' } })
  const library = await AdventureLocation.create({ world: school._id, name: 'Library', slug: 'library', mapPosition: { x: 0.3, y: 0.4 }, status: 'published', unlockRequirement: { type: 'always' } })
  const quizChallenge = await AdventureChallenge.create({
    location: square._id,
    title: "Today's Puzzle",
    type: 'puzzle',
    refId: 'some-puzzle-id',
    rewardCollectibleKey: 'star',
    rewardCollectibleCount: 5,
    status: 'published',
  })
  return { town, school, square, library, quizChallenge }
}

describe('adventure world', () => {
  it('lists published worlds publicly, unmarked as unlocked for a guest', async () => {
    await seedWorldChain()
    const res = await request(app).get('/api/adventure/worlds')
    expect(res.status).toBe(200)
    expect(res.body.worlds).toHaveLength(2)
    expect(res.body.worlds.every((w) => w.unlocked === false)).toBe(true)
  })

  it("auto-creates a fresh account's progress with only the 'always' world/location unlocked", async () => {
    await seedWorldChain()
    const token = await signup('explorer1')

    const res = await request(app).get('/api/adventure/me/progress').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.progress.unlockedWorlds).toEqual(['twegle-town'])
    expect(res.body.progress.unlockedLocations).toEqual(['town-square'])
  })

  it("excludes a challenge's payload from the list, but includes it in the single-item fetch", async () => {
    await seedWorldChain()
    const square = await AdventureLocation.findOne({ slug: 'town-square' })
    const codeBreaker = await AdventureChallenge.create({
      location: square._id,
      title: 'Decode It',
      type: 'code-breaker',
      payload: { cipher: 'ABC', answer: 'abc' },
      status: 'published',
    })

    const list = await request(app).get('/api/adventure/locations/town-square/challenges')
    const listed = list.body.challenges.find((c) => c._id === codeBreaker._id.toString())
    expect(listed.payload).toBeUndefined()

    const single = await request(app).get(`/api/adventure/challenges/${codeBreaker._id}`)
    expect(single.status).toBe(200)
    expect(single.body.challenge.payload.answer).toBe('abc')
  })

  it('rejects fetching progress without a token', async () => {
    const res = await request(app).get('/api/adventure/me/progress')
    expect(res.status).toBe(401)
  })

  it('completing a challenge awards its collectible once, and unlocks the next world + its first location in the same call', async () => {
    const { quizChallenge } = await seedWorldChain()
    const token = await signup('explorer2')
    await request(app).get('/api/adventure/me/progress').set('Authorization', `Bearer ${token}`) // create progress first

    const res = await request(app)
      .post(`/api/adventure/challenges/${quizChallenge._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(200)
    expect(res.body.alreadyCompleted).toBe(false)
    expect(res.body.collectibleAwarded).toEqual({ key: 'star', count: 5 })
    expect(res.body.newlyUnlockedWorlds).toEqual(['mystery-school'])
    expect(res.body.newlyUnlockedLocations).toEqual(['library'])
    expect(res.body.progress.collectibles.find((c) => c.key === 'star').count).toBe(5)
    // quizChallenge never had its own rewardPoints set (still 0, the
    // model's default), so the response falls back to the flat default.
    expect(res.body.rewardPoints).toBe(4)

    // Completing the same challenge again is a no-op, not a double award —
    // rewardPoints is 0 the second time too, so a client can't re-farm points.
    const again = await request(app)
      .post(`/api/adventure/challenges/${quizChallenge._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(again.body.alreadyCompleted).toBe(true)
    expect(again.body.collectibleAwarded).toBeNull()
    expect(again.body.progress.collectibles.find((c) => c.key === 'star').count).toBe(5)
    expect(again.body.rewardPoints).toBe(0)
  })

  it("completing a challenge with its own rewardPoints set awards that amount instead of the flat default", async () => {
    const { square } = await seedWorldChain()
    const token = await signup('explorerpoints')
    await request(app).get('/api/adventure/me/progress').set('Authorization', `Bearer ${token}`)
    const challenge = await AdventureChallenge.create({
      location: square._id,
      title: 'Bonus Round',
      type: 'guess',
      payload: { question: 'q', options: ['a', 'b'], correctIndex: 0 },
      rewardPoints: 20,
      status: 'published',
    })

    const res = await request(app)
      .post(`/api/adventure/challenges/${challenge._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(200)
    expect(res.body.rewardPoints).toBe(20)
  })

  it('rejects completing a challenge whose location is not unlocked yet', async () => {
    const town = await AdventureWorld.create({ name: 'Twegle Town', slug: 'twegle-town-2', mapPosition: { x: 0, y: 0 }, status: 'published' })
    const locked = await AdventureLocation.create({
      world: town._id,
      name: 'Locked Room',
      slug: 'locked-room',
      mapPosition: { x: 0, y: 0 },
      status: 'published',
      unlockRequirement: { type: 'previousLocation', refSlug: 'never-exists' },
    })
    const challenge = await AdventureChallenge.create({ location: locked._id, title: 'Hidden', type: 'guess', status: 'published' })
    const token = await signup('explorer3')

    const res = await request(app).post(`/api/adventure/challenges/${challenge._id}/complete`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(403)
  })

  it('rejects entering a world that is not unlocked yet', async () => {
    await seedWorldChain()
    const token = await signup('explorer4')
    const res = await request(app).post('/api/adventure/me/enter').set('Authorization', `Bearer ${token}`).send({ worldSlug: 'mystery-school' })
    expect(res.status).toBe(403)
  })

  it("claims today's daily treasure once, rejecting a second claim the same day and a wrong location guess", async () => {
    await seedWorldChain()
    const token = await signup('explorer5')

    const today = await request(app).get('/api/adventure/daily-treasure')
    expect(today.status).toBe(200)
    expect(today.body.location).not.toBeNull()

    const wrongGuess = await request(app).post('/api/adventure/daily-treasure/claim').set('Authorization', `Bearer ${token}`).send({ locationSlug: 'not-the-real-one' })
    expect(wrongGuess.status).toBe(400)

    const claim = await request(app)
      .post('/api/adventure/daily-treasure/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ locationSlug: today.body.location.slug })
    expect(claim.status).toBe(200)
    expect(claim.body.alreadyClaimed).toBe(false)

    const secondClaim = await request(app)
      .post('/api/adventure/daily-treasure/claim')
      .set('Authorization', `Bearer ${token}`)
      .send({ locationSlug: today.body.location.slug })
    expect(secondClaim.body.alreadyClaimed).toBe(true)

    // Sanity: today's pick must be one of this test's 2 seeded locations
    // (library belongs to a not-yet-unlocked world, but is still a
    // published location and therefore still an eligible treasure spot).
    expect(['town-square', 'library']).toContain(today.body.location.slug)
  })

  it('records an "opens" view for a location and surfaces it in the admin engagement summary (Phase 6)', async () => {
    const { square } = await seedWorldChain()

    const record = await request(app).post('/api/engagement').send({
      contentType: 'adventureLocation',
      contentId: square._id.toString(),
      action: 'view',
      anonymousId: 'test-visitor-1',
    })
    expect(record.status).toBe(201)

    const passwordHash = await bcrypt.hash('correct-horse', 10)
    await Admin.create({ name: 'Test superadmin', email: 'superadmin-eng@test.com', passwordHash, role: 'superadmin' })
    const login = await request(app).post('/api/auth/login').send({ email: 'superadmin-eng@test.com', password: 'correct-horse' })
    const adminToken = login.body.token

    const summary = await request(app).get('/api/admin/engagement/adventureLocation').set('Authorization', `Bearer ${adminToken}`)
    expect(summary.status).toBe(200)
    const row = summary.body.summary.find((s) => s.id === square._id.toString())
    expect(row.title).toBe('Town Square')
    expect(row.views).toBe(1)
  })
})
