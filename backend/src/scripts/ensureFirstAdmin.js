import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'

// Runs on every server boot. If no admin accounts exist yet and
// SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are set, creates the first superadmin —
// so a freshly deployed server (or a local dev database) always has a way in
// without needing shell access to run a one-off script.
export async function ensureFirstAdmin() {
  const count = await Admin.countDocuments()
  if (count > 0) return

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  const name = process.env.SEED_ADMIN_NAME || 'Admin'

  if (!email || !password) {
    console.log('No admin accounts exist yet. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create one automatically, or use "npm run seed:admin".')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await Admin.create({ name, email: email.toLowerCase(), passwordHash, role: 'superadmin' })
  console.log(`First superadmin created automatically: ${email}`)
}
