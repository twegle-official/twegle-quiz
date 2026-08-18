import mongoose from 'mongoose'

// This is the database "shape" for an admin account (someone who logs into
// the /admin panel to manage content) — not a regular site visitor.
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // the admin's display name, shown in the panel and Activity log
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used to log in; must be unique across all admins
    passwordHash: { type: String, required: true }, // the password, already scrambled (hashed) — the real password is never stored anywhere
    role: {
      type: String,
      enum: ['superadmin', 'editor', 'analyst'], // the only 3 allowed values
      default: 'editor',
    }, // controls what this admin is allowed to do — see middleware/auth.js
  },
  { timestamps: true } // Mongoose automatically adds createdAt/updatedAt fields
)

export default mongoose.model('Admin', adminSchema)
