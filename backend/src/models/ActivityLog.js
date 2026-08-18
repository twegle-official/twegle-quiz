import mongoose from 'mongoose'

// This is the database shape for one row in the admin activity/audit log.
// A simple audit trail: who created/edited/deleted which quiz, post, or
// friendship-quiz template, and when. adminName/resourceLabel are
// denormalized so the log still reads sensibly even if that admin account or
// resource is later deleted.
const activityLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // which admin performed the action
    adminName: { type: String, required: true }, // that admin's name at the time, kept even if the account is later deleted
    action: { type: String, enum: ['create', 'update', 'delete'], required: true }, // what was done
    resourceType: { type: String, enum: ['quiz', 'post', 'friendshipQuiz', 'story', 'puzzle', 'endUser'], required: true }, // what kind of thing was affected
    resourceId: { type: String, required: true }, // the affected item's own id
    resourceLabel: { type: String, required: true }, // a readable name/title for the affected item, kept even if it's later deleted
  },
  { timestamps: true }
)

export default mongoose.model('ActivityLog', activityLogSchema)
