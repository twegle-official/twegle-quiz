import mongoose from 'mongoose'

// A simple audit trail: who created/edited/deleted which quiz, post, or
// friendship-quiz template, and when. adminName/resourceLabel are
// denormalized so the log still reads sensibly even if that admin account or
// resource is later deleted.
const activityLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, required: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    resourceType: { type: String, enum: ['quiz', 'post', 'friendshipQuiz', 'story'], required: true },
    resourceId: { type: String, required: true },
    resourceLabel: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('ActivityLog', activityLogSchema)
