import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB, disconnectDB } from '../config/db.js'
import Admin from '../models/Admin.js'

// Run with: npm run seed:admin -- "Your Name" you@example.com "a-strong-password"
// Creates the first superadmin account so you can log in to the admin panel.
async function main() {
  // Read the name, email, and password typed after the command.
  const [name, email, password] = process.argv.slice(2)

  // Stop if any of the required details are missing.
  if (!name || !email || !password) {
    console.error('Usage: npm run seed:admin -- "Your Name" you@example.com "a-strong-password"')
    process.exit(1)
  }

  await connectDB()

  // Don't create a duplicate if this email is already an admin.
  const existing = await Admin.findOne({ email: email.toLowerCase() })
  if (existing) {
    console.log(`An admin with email ${email} already exists.`)
    await disconnectDB()
    return
  }

  // Scramble the password before saving it, then create the admin account.
  const passwordHash = await bcrypt.hash(password, 10)
  await Admin.create({ name, email: email.toLowerCase(), passwordHash, role: 'superadmin' })

  console.log(`Superadmin created: ${email}`)
  await disconnectDB()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
