import { describe, it, expect } from 'vitest'
import AdventureWorld from '../src/models/AdventureWorld.js'
import AdventureLocation from '../src/models/AdventureLocation.js'
import AdventureChallenge from '../src/models/AdventureChallenge.js'
import AdventureCollectible from '../src/models/AdventureCollectible.js'
import AdventureCharacter from '../src/models/AdventureCharacter.js'
import AdventureProgress from '../src/models/AdventureProgress.js'
import EndUser from '../src/models/EndUser.js'

// Phase 1 of Twegle Adventure World is data-model-only — no controllers,
// routes, or UI yet (see docs/PENDING_TASKS.md's dated entry for the full
// phased plan). These tests just confirm the 6 new schemas actually save/
// load/default/relate to each other correctly, since there's no endpoint
// yet to exercise them through a real request.
describe('adventure models (Phase 1)', () => {
  it('creates a world with its default unlockRequirement and status', async () => {
    const world = await AdventureWorld.create({
      name: 'Twegle Town',
      slug: 'twegle-town',
      mapPosition: { x: 0.5, y: 0.9 },
    })
    expect(world.unlockRequirement.type).toBe('always')
    expect(world.status).toBe('draft')
    expect(world.language).toBe('en')
  })

  it('creates a location linked to a world, defaulting to previousLocation unlock', async () => {
    const world = await AdventureWorld.create({ name: 'Mystery School', slug: 'mystery-school', mapPosition: { x: 0.5, y: 0.6 } })
    const location = await AdventureLocation.create({
      world: world._id,
      name: 'Library',
      slug: 'mystery-school-library',
      mapPosition: { x: 0.3, y: 0.4 },
    })
    expect(location.unlockRequirement.type).toBe('previousLocation')
    expect(location.world.toString()).toBe(world._id.toString())
  })

  it('creates a challenge referencing existing content by refId, and one of the new mini-challenge types with a payload', async () => {
    const world = await AdventureWorld.create({ name: 'Mystery School', slug: 'mystery-school-2', mapPosition: { x: 0.5, y: 0.6 } })
    const location = await AdventureLocation.create({ world: world._id, name: 'Library', slug: 'library-2', mapPosition: { x: 0.3, y: 0.4 } })

    const quizChallenge = await AdventureChallenge.create({
      location: location._id,
      title: "Today's Quiz",
      type: 'quiz',
      refId: 'which-ice-cream-flavour-are-you',
    })
    expect(quizChallenge.type).toBe('quiz')

    const codeBreaker = await AdventureChallenge.create({
      location: location._id,
      title: 'Decode the Message',
      type: 'code-breaker',
      payload: { cipher: 'HELLO', answer: 'hello' },
      rewardCollectibleKey: 'key',
      rewardCollectibleCount: 1,
    })
    expect(codeBreaker.payload.answer).toBe('hello')
    expect(codeBreaker.rewardCollectibleKey).toBe('key')
  })

  it('rejects a challenge with an unknown type', async () => {
    const world = await AdventureWorld.create({ name: 'W', slug: 'w1', mapPosition: { x: 0, y: 0 } })
    const location = await AdventureLocation.create({ world: world._id, name: 'L', slug: 'l1', mapPosition: { x: 0, y: 0 } })
    await expect(
      AdventureChallenge.create({ location: location._id, title: 'Bad', type: 'not-a-real-type' })
    ).rejects.toThrow()
  })

  it('creates a collectible, defaulting to common rarity', async () => {
    const star = await AdventureCollectible.create({ key: 'star', name: 'Star', type: 'star' })
    expect(star.rarity).toBe('common')
  })

  it('creates a character tied to a world, optionally to one location', async () => {
    const world = await AdventureWorld.create({ name: 'Adventure Forest', slug: 'adventure-forest', mapPosition: { x: 0.2, y: 0.3 } })
    const foxy = await AdventureCharacter.create({
      name: 'Foxy',
      avatar: '🦊',
      role: 'Adventure Guide',
      world: world._id,
      dialogueLines: ['Welcome to Twegle World!'],
    })
    expect(foxy.location).toBeNull()
    expect(foxy.dialogueLines).toHaveLength(1)
  })

  it('creates one progress document per account and enforces uniqueness', async () => {
    const user = await EndUser.create({ username: 'adventurer1', passwordHash: 'x', recoveryCodeHash: 'x', displayName: 'Adventurer', referralCode: 'ABC123' })
    const progress = await AdventureProgress.create({ endUser: user._id })
    expect(progress.unlockedWorlds).toEqual([])
    expect(progress.collectibles).toEqual([])

    await expect(AdventureProgress.create({ endUser: user._id })).rejects.toThrow()
  })

  it('tracks unlocked worlds/locations and collectible counts on a progress document', async () => {
    const user = await EndUser.create({ username: 'adventurer2', passwordHash: 'x', recoveryCodeHash: 'x', displayName: 'Adventurer 2', referralCode: 'DEF456' })
    const progress = await AdventureProgress.create({
      endUser: user._id,
      unlockedWorlds: ['twegle-town'],
      unlockedLocations: ['twegle-town-square'],
      currentWorld: 'twegle-town',
      currentLocation: 'twegle-town-square',
      collectibles: [{ key: 'star', count: 10 }],
    })
    expect(progress.collectibles[0].count).toBe(10)
    expect(progress.currentLocation).toBe('twegle-town-square')
  })
})
