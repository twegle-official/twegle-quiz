import { signPreviewToken } from '../utils/previewToken.js'

// One shared endpoint for all 5 admin-authored content types rather than
// duplicating this into each adminXRoutes.js file -- the frontend only ever
// needs "give me a token for this contentType+id," and every public
// controller already knows how to verify a token against itself.
const CONTENT_TYPES = ['quiz', 'post', 'story', 'puzzle', 'friendshipQuiz']

// Makes a secret preview link/token for unpublished content — called when an admin clicks "Preview" before publishing.
export function createPreviewLink(req, res) {
  const { contentType, id } = req.query
  if (!CONTENT_TYPES.includes(contentType) || !id) {
    return res.status(400).json({ error: 'contentType and id are required' })
  }
  const token = signPreviewToken(contentType, id)
  res.json({ token })
}
