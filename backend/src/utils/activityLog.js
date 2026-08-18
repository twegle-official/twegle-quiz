import ActivityLog from '../models/ActivityLog.js'

// Fire-and-forget by design: a logging failure should never break the actual
// create/update/delete it's describing, so errors are swallowed (and noted in
// server logs) rather than propagated.
// Saves a note in the Activity log recording what an admin just did
export async function logActivity({ admin, action, resourceType, resourceId, resourceLabel }) {
  try {
    await ActivityLog.create({
      admin: admin.id,
      adminName: admin.name,
      action,
      resourceType,
      resourceId: resourceId.toString(),
      resourceLabel,
    })
  } catch (err) {
    console.error('Failed to log activity', err)
  }
}
