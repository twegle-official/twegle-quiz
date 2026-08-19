import mongoose from 'mongoose'

// This is the database shape for a single shareable card — jokes, funny
// lines, quotes, motivational quotes.
// Unlike Quiz, there's no question/answer engine here: just content to share.
const postSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['joke', 'funny-line', 'quote', 'motivational-quote'], // the only allowed category values
      required: true,
    }, // what kind of post this is
    text: { type: String, default: '' }, // the post's main text
    author: { type: String, default: '' }, // who the quote/line is attributed to
    language: { type: String, enum: ['en', 'hi'], default: 'en' }, // which language this post is written in
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }, // whether this post is visible to visitors yet
    // See Quiz.js's publishAt for the reasoning — same scheduled-publishing pattern.
    publishAt: { type: Date, default: null }, // a future date/time to auto-publish this post
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // which admin created this post
    // See Quiz.js's `sponsor` for the reasoning — same manual,
    // admin-entered, clearly-disclosed sponsorship pattern.
    sponsor: {
      name: { type: String, default: '' }, // brand name, e.g. "Nykaa"
      logo: { type: String, default: '' }, // an emoji
      url: { type: String, default: '' }, // optional "Visit sponsor" link
    },
  },
  { timestamps: true }
)

export default mongoose.model('Post', postSchema)
