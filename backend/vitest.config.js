import { defineConfig } from 'vitest/config'

// Runs the backend's automated test suite (see tests/) against a throwaway
// in-memory MongoDB (see tests/setup.js) — never the real local dev
// database (backend/.mongo-dev) or production. Sequential (fileParallelism
// off) since every test file shares one in-memory database connection and
// clears its collections between tests; running files in parallel would
// let one file's cleanup race another's assertions.
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
