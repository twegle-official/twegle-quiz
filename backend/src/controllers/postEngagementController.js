import Post from '../models/Post.js'
import PostEngagement from '../models/PostEngagement.js'

// Anonymous by design — see PostEngagement.js. anonymousId is a client-generated
// id (same one used for quiz plays), never personal information.
// Handles a visitor viewing or sharing a post — records that action for analytics.
export async function recordEngagement(req, res) {
  const { action, anonymousId } = req.body

  if (action !== 'view' && action !== 'share') {
    return res.status(400).json({ error: 'action must be "view" or "share"' })
  }
  if (!anonymousId) {
    return res.status(400).json({ error: 'anonymousId is required' })
  }

  const post = await Post.findOne({ _id: req.params.id, status: 'published' })
  if (!post) return res.status(404).json({ error: 'Post not found' })

  await PostEngagement.create({ post: post._id, action, anonymousId })

  res.status(201).json({ ok: true })
}

// Builds the analytics numbers admins see — how many views and shares each post got.
export async function getPostAnalyticsSummary(req, res) {
  const counts = await PostEngagement.aggregate([
    { $group: { _id: { post: '$post', action: '$action' }, count: { $sum: 1 } } }, // count views and shares separately per post
  ])

  const byPost = {}
  counts.forEach(({ _id, count }) => {
    const key = _id.post.toString()
    if (!byPost[key]) byPost[key] = { views: 0, shares: 0 }
    byPost[key][_id.action === 'view' ? 'views' : 'shares'] = count // put the count under the right bucket (views or shares)
  })

  const postIds = Object.keys(byPost)
  const posts = await Post.find({ _id: { $in: postIds } }).select('text category language')

  const summary = posts
    .map((p) => ({
      postId: p._id,
      text: p.text,
      category: p.category,
      language: p.language,
      views: byPost[p._id.toString()]?.views || 0,
      shares: byPost[p._id.toString()]?.shares || 0,
    }))
    .sort((a, b) => b.views + b.shares - (a.views + a.shares)) // show the most-engaged posts first

  res.json({ summary })
}
