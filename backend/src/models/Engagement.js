import mongoose from 'mongoose'

// Anonymous view/share tracking for content types that don't already have
// their own — Quiz/FriendshipQuiz/Games each already track *completions*
// (PlaySession/FriendshipAttempt/GameSession), but none of them track a
// "someone opened this" view or a distinct "someone hit share" event the way
// Post already does via PostEngagement. One shared collection instead of
// four near-identical ones, since all four are being added in the same pass
// — see PostEngagement.js for the older, separately-evolved equivalent.
const engagementSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: ['quiz', 'friendshipQuiz', 'game', 'story', 'horoscope'], required: true },
    // Quiz/FriendshipQuiz/Story: the content's own Mongo _id, as a string.
    // Game: the game's slug (games have no database row — see GameSession.js).
    // Horoscope: the zodiac sign's key (also has no database row — see zodiacSigns.js).
    contentId: { type: String, required: true },
    action: { type: String, enum: ['view', 'share'], required: true },
    anonymousId: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('Engagement', engagementSchema)
