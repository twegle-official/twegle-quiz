import mongoose from 'mongoose'

// This is the database shape for a feedback message or a content report from a visitor.
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
    message: { type: String, required: true }, // the feedback text the visitor typed
    email: { type: String, default: '' }, // optional contact email, only if the visitor wants a reply
    read: { type: Boolean, default: false }, // whether an admin has already looked at this
    contentType: { type: String, enum: ['quiz', 'post', 'story', 'puzzle', null], default: null }, // what kind of content this report is about, if it's a report
    contentId: { type: mongoose.Schema.Types.ObjectId, default: null }, // which specific piece of content this report is about
    // Denormalized title/slug so the admin list can show what was reported
    // without a join — same reasoning as ActivityLog's resourceLabel.
    contentLabel: { type: String, default: '' }, // a readable label (title/slug) for the reported content
    reason: { type: String, enum: ['offensive', 'incorrect', 'broken', 'other', null], default: null }, // why the content was reported
  },
  { timestamps: true }
)

export default mongoose.model('Feedback', feedbackSchema)
