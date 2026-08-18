import mongoose from 'mongoose'

// This is the database shape for one view or share event on a piece of content.
// Anonymous view/share tracking for content types that don't already have
// their own — Quiz/FriendshipQuiz/Games each already track *completions*
// (PlaySession/FriendshipAttempt/GameSession), but none of them track a
// "someone opened this" view or a distinct "someone hit share" event the way
// Post already does via PostEngagement. One shared collection instead of
// four near-identical ones, since all four are being added in the same pass
// — see PostEngagement.js for the older, separately-evolved equivalent.
const engagementSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: ['quiz', 'friendshipQuiz', 'game', 'story', 'horoscope', 'puzzle'], required: true }, // what kind of content this engagement is about
    // Quiz/FriendshipQuiz/Story: the content's own Mongo _id, as a string.
    // Game: the game's slug (games have no database row — see GameSession.js).
    // Horoscope: the zodiac sign's key (also has no database row — see zodiacSigns.js).
    contentId: { type: String, required: true }, // which specific piece of content this is about
    action: { type: String, enum: ['view', 'share'], required: true }, // whether the content was viewed or shared
    anonymousId: { type: String, required: true }, // a random id for this visitor, not tied to a real identity
  },
  { timestamps: true }
)

export default mongoose.model('Engagement', engagementSchema)
