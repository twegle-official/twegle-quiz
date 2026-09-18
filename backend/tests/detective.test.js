import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import DetectiveCase from '../src/models/DetectiveCase.js'

// Covers the public Twegle Detective flow: browsing published cases,
// opening one by slug without the solution leaking, checking a final
// accusation server-side, and the per-case leaderboard it feeds. See
// detectiveController.js for the behavior under test.
const app = createApp()

async function signup(username) {
  const res = await request(app).post('/api/users/signup').send({
    username,
    password: 'correct-horse',
    displayName: username,
  })
  return res.body.token
}

async function seedCase(overrides = {}) {
  return DetectiveCase.create({
    title: 'The Missing Trophy',
    slug: 'the-missing-trophy',
    description: 'The school trophy vanished before the big competition.',
    intro: 'Something strange happened at school today...',
    difficulty: 'rookie',
    status: 'published',
    suspects: [
      { key: 'alex', name: 'Alex', role: 'Sports Captain', statement: 'I was at practice the whole time.' },
      { key: 'mia', name: 'Mia', role: 'Class Monitor', statement: 'I left the classroom at 3:15.' },
      { key: 'ryan', name: 'Ryan', role: 'Art Club Member', statement: 'I was in the art room all afternoon.' },
    ],
    clues: [
      { key: 'clock', title: 'Slow Clock', description: 'The classroom clock runs 10 minutes slow.' },
      { key: 'footprints', title: 'Footprints', description: 'Muddy footprints lead toward the gym.', unlocksAfter: ['clock'] },
      { key: 'key', title: 'Spare Key', description: 'The spare key to the trophy case is missing.' },
    ],
    deductionQuestions: [
      { question: 'What was the motive?', options: ['Jealousy', 'A prank', 'Revenge'], correctIndex: 0, explanation: 'Alex wanted the spotlight.' },
    ],
    hints: [{ text: 'Check the clock in the classroom.' }],
    solution: { correctSuspectKey: 'mia', explanation: 'Mia lied about the time — the clock was slow, so she actually left at 3:25, after the trophy went missing.', provingClueKeys: ['clock', 'footprints'] },
    ...overrides,
  })
}

describe('detective', () => {
  it('lists a published case but not a draft one', async () => {
    await seedCase()
    await seedCase({ slug: 'draft-case', status: 'draft' })

    const res = await request(app).get('/api/detective')
    expect(res.status).toBe(200)
    expect(res.body.cases).toHaveLength(1)
    expect(res.body.cases[0].slug).toBe('the-missing-trophy')
  })

  it('fetches a published case by slug without leaking the solution or correct answers', async () => {
    await seedCase()

    const res = await request(app).get('/api/detective/the-missing-trophy')
    expect(res.status).toBe(200)
    expect(res.body.case.solution).toBeUndefined()
    expect(res.body.case.suspects).toHaveLength(3)
    expect(res.body.case.clues).toHaveLength(3)
    expect(res.body.case.deductionQuestions[0].correctIndex).toBeUndefined()
    expect(res.body.case.deductionQuestions[0].question).toBe('What was the motive?')
  })

  it('404s for a missing or draft slug', async () => {
    await seedCase({ slug: 'draft-case', status: 'draft' })
    const missing = await request(app).get('/api/detective/no-such-case')
    const draft = await request(app).get('/api/detective/draft-case')
    expect(missing.status).toBe(404)
    expect(draft.status).toBe(404)
  })

  it('correctly checks a right accusation with every deduction correct', async () => {
    await seedCase()

    const res = await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .send({ chosenSuspectKey: 'mia', deductionAnswers: [0], cluesFoundCount: 3, hintsUsed: 0 })

    expect(res.status).toBe(200)
    expect(res.body.correctSuspect).toBe(true)
    expect(res.body.deductionResults[0].correct).toBe(true)
    expect(res.body.solution.correctSuspectKey).toBe('mia')
    expect(res.body.cluesFound).toBe(3)
    expect(res.body.totalClues).toBe(3)
    // suspectPoints(500) + deductionPoints(100) + cluePoints(200, all found) - no hint penalty
    expect(res.body.score).toBe(800)
  })

  it('correctly checks a wrong accusation and a wrong deduction, with a lower score', async () => {
    await seedCase()

    const res = await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .send({ chosenSuspectKey: 'alex', deductionAnswers: [1], cluesFoundCount: 1, hintsUsed: 1 })

    expect(res.status).toBe(200)
    expect(res.body.correctSuspect).toBe(false)
    expect(res.body.deductionResults[0].correct).toBe(false)
    // suspectPoints(0) + deductionPoints(0) + cluePoints(round(1/3*200)=67) - hintPenalty(30)
    expect(res.body.score).toBe(37)
  })

  it('rejects a solve attempt missing the required fields', async () => {
    await seedCase()
    const res = await request(app).post('/api/detective/the-missing-trophy/solve').send({})
    expect(res.status).toBe(400)
  })

  it('404s a solve attempt against a nonexistent case', async () => {
    const res = await request(app)
      .post('/api/detective/no-such-case/solve')
      .send({ chosenSuspectKey: 'mia', deductionAnswers: [0] })
    expect(res.status).toBe(404)
  })

  it('records a leaderboard entry for a logged-in solve, but not a guest one', async () => {
    await seedCase()
    const token = await signup('sleuth1')

    await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .set('Authorization', `Bearer ${token}`)
      .send({ chosenSuspectKey: 'mia', deductionAnswers: [0], cluesFoundCount: 3, hintsUsed: 0 })
    // A guest solve right after — should never show up on the board.
    await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .send({ chosenSuspectKey: 'alex', deductionAnswers: [1], cluesFoundCount: 1, hintsUsed: 0 })

    const res = await request(app).get('/api/detective/the-missing-trophy/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(1)
    expect(res.body.entries[0].endUser.displayName).toBe('sleuth1')
    expect(res.body.entries[0].score).toBe(800)
  })

  it('keeps only the best score when the same account solves a case again', async () => {
    await seedCase()
    const token = await signup('sleuth2')

    // First solve: wrong suspect, lower score.
    await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .set('Authorization', `Bearer ${token}`)
      .send({ chosenSuspectKey: 'alex', deductionAnswers: [1], cluesFoundCount: 1, hintsUsed: 0 })
    // Second solve: right suspect, higher score.
    await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .set('Authorization', `Bearer ${token}`)
      .send({ chosenSuspectKey: 'mia', deductionAnswers: [0], cluesFoundCount: 3, hintsUsed: 0 })

    const res = await request(app).get('/api/detective/the-missing-trophy/leaderboard')
    expect(res.body.entries).toHaveLength(1) // one row per account, not one per attempt
    expect(res.body.entries[0].score).toBe(800)

    // A worse third solve shouldn't overwrite the best score.
    await request(app)
      .post('/api/detective/the-missing-trophy/solve')
      .set('Authorization', `Bearer ${token}`)
      .send({ chosenSuspectKey: 'ryan', deductionAnswers: [2], cluesFoundCount: 0, hintsUsed: 0 })
    const after = await request(app).get('/api/detective/the-missing-trophy/leaderboard')
    expect(after.body.entries[0].score).toBe(800)
  })

  it('404s a leaderboard request for a nonexistent case', async () => {
    const res = await request(app).get('/api/detective/no-such-case/leaderboard')
    expect(res.status).toBe(404)
  })
})
