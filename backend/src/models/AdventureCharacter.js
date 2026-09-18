import mongoose from 'mongoose'

// A friendly NPC shown at a world or location (Foxy the fox guide, Byte
// the space robot, ...). Deliberately just a name/avatar/short dialogue
// lines list — no branching dialogue tree or quest-giving logic, per the
// feature's own "keep dialogue short, don't over-build" instruction. A
// character can belong to a whole world (shows up anywhere in it) or one
// specific location — `location` is optional for exactly that reason.
const adventureCharacterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: '🦊' }, // emoji portrait, same convention as DetectiveCase suspects' avatar field
    role: { type: String, default: '' }, // e.g. "Adventure Guide"
    world: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureWorld', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'AdventureLocation', default: null }, // null = appears anywhere in `world`
    // Short rotating lines shown when the player interacts with this
    // character — the frontend picks one (randomly or in sequence), not
    // every line at once. Kept as plain strings, not a dialogue graph.
    dialogueLines: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
)

adventureCharacterSchema.index({ world: 1 })

export default mongoose.model('AdventureCharacter', adventureCharacterSchema)
