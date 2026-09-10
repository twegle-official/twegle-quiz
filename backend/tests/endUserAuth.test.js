import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

// Covers the end-user login flow: signing up, logging in, and using the
// resulting token to fetch the logged-in account's own profile. See
// endUserAuthController.js for the behavior under test.
const app = createApp()

describe('end-user signup/login flow', () => {
  it('signs up a new account and returns a token + recovery code', async () => {
    const res = await request(app).post('/api/users/signup').send({
      username: 'quiztester',
      password: 'correct-horse',
      displayName: 'Quiz Tester',
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.recoveryCode).toMatch(/^TWEGLE-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(res.body.user.username).toBe('quiztester')
    expect(res.body.user.displayName).toBe('Quiz Tester')
    // The password/recovery code must never be echoed back, even hashed.
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.body.user.recoveryCodeHash).toBeUndefined()
  })

  it('rejects a signup with a too-short password', async () => {
    const res = await request(app).post('/api/users/signup').send({
      username: 'shortpass',
      password: '123',
      displayName: 'Short Pass',
    })

    expect(res.status).toBe(400)
  })

  it('rejects a second signup with a username that is already taken', async () => {
    await request(app).post('/api/users/signup').send({
      username: 'duplicateuser',
      password: 'correct-horse',
      displayName: 'First',
    })

    const res = await request(app).post('/api/users/signup').send({
      username: 'duplicateuser',
      password: 'another-password',
      displayName: 'Second',
    })

    expect(res.status).toBe(409)
  })

  it('logs an existing account in with the right password', async () => {
    await request(app).post('/api/users/signup').send({
      username: 'loginflow',
      password: 'correct-horse',
      displayName: 'Login Flow',
    })

    const res = await request(app).post('/api/users/login').send({
      username: 'loginflow',
      password: 'correct-horse',
    })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.username).toBe('loginflow')
  })

  it('rejects a login with the wrong password', async () => {
    await request(app).post('/api/users/signup').send({
      username: 'wrongpass',
      password: 'correct-horse',
      displayName: 'Wrong Pass',
    })

    const res = await request(app).post('/api/users/login').send({
      username: 'wrongpass',
      password: 'not-the-right-password',
    })

    expect(res.status).toBe(401)
  })

  it('rejects a login for a username that does not exist', async () => {
    const res = await request(app).post('/api/users/login').send({
      username: 'nobody-signed-up-with-this-name',
      password: 'whatever123',
    })

    expect(res.status).toBe(401)
  })

  it("lets a logged-in visitor fetch their own profile with the token, and rejects the same request with no token", async () => {
    const signup = await request(app).post('/api/users/signup').send({
      username: 'profilecheck',
      password: 'correct-horse',
      displayName: 'Profile Check',
    })
    const token = signup.body.token

    const authed = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`)
    expect(authed.status).toBe(200)
    expect(authed.body.user.username).toBe('profilecheck')

    const unauthed = await request(app).get('/api/users/me')
    expect(unauthed.status).toBe(401)
  })
})
