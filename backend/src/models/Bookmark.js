import mongoose from 'mongoose'

// This is the database shape for one saved-for-later bookmark — a logged-in
// account saving a quiz/post/story to revisit, same "generic content
// reference" idea Reaction.js/Engagement.js already use, but keyed to a
// real account (not an anonymousId) since a bookmark needs to follow the
// visitor across devices, the whole point of tying it to an account rather
// than localStorage the way "recently viewed" already works anonymously.
export const BOOKMARK_CONTENT_TYPES = ['quiz', 'post', 'story']

const bookmarkSchema = new mongoose.Schema(
  {
    endUser: { type: mongoose.Schema.Types.ObjectId, ref: 'EndUser', required: true }, // whose bookmark this is
    contentType: { type: String, enum: BOOKMARK_CONTENT_TYPES, required: true }, // which kind of content this bookmark points at
    contentId: { type: String, required: true }, // the content's own Mongo _id, as a string
  },
  { timestamps: true }
)

// One bookmark per account per piece of content — re-saving the same item
// is just a no-op (see bookmarkController.js's addBookmark), not a
// duplicate row.
bookmarkSchema.index({ endUser: 1, contentType: 1, contentId: 1 }, { unique: true })
// Speeds up "list my bookmarks, most recent first" — the only list query this ever runs.
bookmarkSchema.index({ endUser: 1, createdAt: -1 })

export default mongoose.model('Bookmark', bookmarkSchema)
