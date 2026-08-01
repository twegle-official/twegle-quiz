import mongoose from 'mongoose'

// A read/listen story — its own content type since the shape (one long body
// of prose, read aloud client-side via the Web Speech API) doesn't fit
// Quiz (question/answer engine) or Post (short shareable card) at all.
const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['horror', 'comedy', 'romance', 'mystery', 'moral', 'motivational'],
      default: 'moral',
    },
    // The full story text. This is also exactly what gets read aloud by
    // SpeechSynthesisUtterance on the frontend, so it should stay clean
    // prose — no markup.
    body: { type: String, required: true },
    emoji: { type: String, default: '📖' },
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('Story', storySchema)
