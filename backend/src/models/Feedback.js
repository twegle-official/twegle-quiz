import mongoose from 'mongoose'

// Guest-first like everything else — email is optional (only given if the
// visitor wants a reply), no account/identity required to submit feedback.
//
// The "Report" feature (flagging a specific quiz/post as offensive, wrong,
// or broken) reuses this same model/admin-list rather than a parallel
// system — a report is just a feedback entry with its content* fields set.
// General feedback submissions leave all four null/empty, which is why
// none of them are required.
const feedbackSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    email: { type: String, default: '' },
    read: { type: Boolean, default: false },
    contentType: { type: String, enum: ['quiz', 'post', 'story', null], default: null },
    contentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Denormalized title/slug so the admin list can show what was reported
    // without a join — same reasoning as ActivityLog's resourceLabel.
    contentLabel: { type: String, default: '' },
    reason: { type: String, enum: ['offensive', 'incorrect', 'broken', 'other', null], default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Feedback', feedbackSchema)
