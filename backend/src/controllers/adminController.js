import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import { isValidEmail, isValidPassword, LIMITS } from '../utils/validators.js'

// Returns the list of all admin accounts, without their password hashes, for the admin management page.
export async function listAdmins(req, res) {
  const admins = await Admin.find().select('-passwordHash')
  res.json({ admins })
}

// Handles a superadmin creating a new admin account, after checking all the entered details are valid.
export async function createAdmin(req, res) {
  const { name, email, password, role } = req.body

  if (typeof name !== 'string' || !name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }
  if (name.length > LIMITS.MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Name must be ${LIMITS.MAX_NAME_LENGTH} characters or fewer` })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' })
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: `Password must be at least ${LIMITS.MIN_PASSWORD_LENGTH} characters` })
  }
  if (!['superadmin', 'editor', 'analyst'].includes(role)) {
    return res.status(400).json({ error: 'Role must be superadmin, editor, or analyst' })
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(409).json({ error: 'An admin with that email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10) // scrambles the password so it's never stored in plain text
  const admin = await Admin.create({ name, email: email.toLowerCase(), passwordHash, role })

  res.status(201).json({
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  })
}

// Handles removing an admin account, but blocks an admin from deleting themselves.
export async function deleteAdmin(req, res) {
  if (req.params.id === req.admin.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }
  await Admin.findByIdAndDelete(req.params.id)
  res.status(204).send()
}
