import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import GameScore from '../src/models/GameScore.js'

// Covers the weekly "Champion of the Week" leaderboard: a guest score
// stays off it entirely, a logged-in submitter's score gets linked to
// their account and appears, and a score from a completed past week shows
// up as `lastWeekChampion` instead of in the live `entries` list. See
// gameScoreController.js's getWeeklyLeaderboard/startOfWeek.
const app = createApp()
const SLUG = 'guess-the-number' // order: 'asc' (lower is better)

async function signup(username) {
  const res = await request(app).post('/api/users/signup').send({
    username,
    password: 'correct-horse',
    displayName: username,
  })
  return res.body
}

describe('weekly game leaderboard', () => {
  it('excludes a guest submission (no account token) entirely', async () => {
    await request(app).post(`/api/games/${SLUG}/leaderboard`).send({ nickname: 'GuestPlayer', value: 3 })

    const res = await request(app).get(`/api/games/${SLUG}/leaderboard/weekly`)

    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(0)
  })

  it("links a logged-in submitter's score to their account and shows it", async () => {
    const { token, user } = await signup('weeklyplayer1')

    await request(app)
      .post(`/api/games/${SLUG}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: user.displayName, value: 4 })

    const res = await request(app).get(`/api/games/${SLUG}/leaderboard/weekly`)

    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(1)
    expect(res.body.entries[0].endUser.displayName).toBe('weeklyplayer1')
    expect(res.body.entries[0].value).toBe(4)
  })

  it('ranks account-linked entries best-first for an ascending game', async () => {
    const a = await signup('weeklyplayer2')
    const b = await signup('weeklyplayer3')
    await request(app).post(`/api/games/${SLUG}/leaderboard`).set('Authorization', `Bearer ${a.token}`).send({ nickname: a.user.displayName, value: 8 })
    await request(app).post(`/api/games/${SLUG}/leaderboard`).set('Authorization', `Bearer ${b.token}`).send({ nickname: b.user.displayName, value: 2 })

    const res = await request(app).get(`/api/games/${SLUG}/leaderboard/weekly`)

    expect(res.body.entries[0].endUser.displayName).toBe('weeklyplayer3') // lower value, ranks first
    expect(res.body.entries[1].endUser.displayName).toBe('weeklyplayer2')
  })

  it("surfaces a score from last week as lastWeekChampion, not in this week's entries", async () => {
    const { token, user } = await signup('weeklychampion')
    await request(app)
      .post(`/api/games/${SLUG}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: user.displayName, value: 1 })

    // Backdate the just-created score into the middle of last week —
    // bypassing the app layer (there's no API for this, by design) since
    // this is purely test setup, not something a real request can do.
    // Goes through the raw MongoDB driver (`.collection`, not the Mongoose
    // model) deliberately — Mongoose's own `updateOne` re-stamps
    // `createdAt` via its `timestamps: true` middleware even when it's
    // explicitly passed in `$set`, silently undoing the backdate.
    const midLastWeek = new Date()
    midLastWeek.setUTCDate(midLastWeek.getUTCDate() - 4)
    await GameScore.collection.updateOne({ nickname: user.displayName }, { $set: { createdAt: midLastWeek } })

    const res = await request(app).get(`/api/games/${SLUG}/leaderboard/weekly`)

    expect(res.body.entries).toHaveLength(0) // no longer "this week"
    expect(res.body.lastWeekChampion).not.toBeNull()
    expect(res.body.lastWeekChampion.endUser.displayName).toBe('weeklychampion')
  })

  it('returns lastWeekChampion: null when nobody qualified last week', async () => {
    const res = await request(app).get(`/api/games/${SLUG}/leaderboard/weekly`)
    expect(res.body.lastWeekChampion).toBeNull()
  })

  it('404s for a game slug with no leaderboard', async () => {
    const res = await request(app).get('/api/games/tic-tac-toe/leaderboard/weekly')
    expect(res.status).toBe(404)
  })
})
