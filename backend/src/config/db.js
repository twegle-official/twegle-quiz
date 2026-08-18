import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let memoryServer

// Connects the app to the database (real one if configured, temporary local one if not).
// If MONGODB_URI is set (e.g. a MongoDB Atlas connection string), we connect to
// that real database. Otherwise, for local development only, we spin up an
// in-memory MongoDB so the app runs without any account setup. Production must
// always set MONGODB_URI — see BACKEND.md.
export async function connectDB() {
  let uri = process.env.MONGODB_URI

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    // Fixed dbPath so data survives across separate `npm run dev` / seed script
    // runs during local development. Still not a substitute for a real database.
    const dbPath = path.join(__dirname, '..', '..', '.mongo-dev')
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, dbName: 'twegle-quiz-dev', storageEngine: 'wiredTiger' },
    })
    uri = memoryServer.getUri('twegle-quiz-dev')
    console.log('No MONGODB_URI set — using a local dev-only database at backend/.mongo-dev')
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}

// Closes the database connection (and stops the temporary local database if one was used).
export async function disconnectDB() {
  await mongoose.disconnect()
  if (memoryServer) {
    await memoryServer.stop()
  }
}
