import mongoose from 'mongoose'

// A single shareable card — jokes, funny lines, quotes, motivational quotes,
// memes. Unlike Quiz, there's no question/answer engine here: just content to
// share. `text` is required for every category except 'meme', where it's an
// optional caption and `imageUrl` carries the actual content instead — see
// validatePostPayload() in postController.js for the category-specific rule.
const postSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['joke', 'funny-line', 'quote', 'motivational-quote', 'meme'],
      required: true,
    },
    text: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    author: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
)

export default mongoose.model('Post', postSchema)
