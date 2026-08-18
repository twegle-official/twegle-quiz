import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

// Handles an admin signing in — checks their email/password and hands back a login token.
export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash) // checks the typed password against the stored scrambled version
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: admin.role, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '12h' } // this login token stops working after 12 hours
    )

    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// Returns the currently logged-in admin's own details — used to show who's logged in.
export async function me(req, res) {
  const admin = await Admin.findById(req.admin.id).select('-passwordHash')
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }
  res.json({ admin })
}
