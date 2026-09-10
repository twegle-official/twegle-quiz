import { beforeAll, afterAll, afterEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Every test file's database — a fresh in-memory MongoDB, never the real
// local dev database (backend/.mongo-dev, used by `npm run dev`) or
// production. No dbPath is given, so nothing is written to disk and
// nothing survives past this test run: it's created fresh in beforeAll and
// torn down in afterAll, every single run.
let memoryServer

// A fixed test secret, not read from .env — tests must never depend on
// (or risk touching) real deployment config. Set before any test file
// imports app.js, since controllers read process.env.JWT_SECRET at call
// time, not at import time, but setting it here up front avoids relying on
// that ordering detail.
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-real-deployment'
process.env.CORS_ORIGIN = '*'

beforeAll(async () => {
  memoryServer = await MongoMemoryServer.create()
  await mongoose.connect(memoryServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await memoryServer.stop()
})

// Clears every collection between individual tests (not test *files* — see
// vitest.config.js's fileParallelism:false, which keeps files from racing
// each other over this same shared connection) so one test's data never
// leaks into the next one's assertions.
afterEach(async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})
