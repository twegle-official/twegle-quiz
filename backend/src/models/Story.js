import mongoose from 'mongoose'

// This is the database shape for a read/listen story — its own content type
// since the shape (one long body
// of prose, read aloud client-side via the Web Speech API) doesn't fit
// Quiz (question/answer engine) or Post (short shareable card) at all.
const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // the story's display title
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // the URL-friendly id used in links
    category: {
      type: String,
      enum: ['horror', 'comedy', 'romance', 'mystery', 'moral', 'motivational'], // the only allowed category values
      default: 'moral',
    }, // which genre this story is filed under
    // The full story text. This is also exactly what gets read aloud by
    // SpeechSynthesisUtterance on the frontend, so it should stay clean
    // prose — no markup.
    body: { type: String, required: true }, // the full story text
    emoji: { type: String, default: '📖' }, // icon shown alongside the story
    gradient: { type: String, default: 'from-violet-400 to-indigo-500' }, // the background color gradient for the story card
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // which language this story is written in
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // whether this story is visible to visitors yet
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null }, // a future date/time to auto-publish this story
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // which admin created this story
  },
  { timestamps: true }
)

export default mongoose.model('Story', storySchema)
