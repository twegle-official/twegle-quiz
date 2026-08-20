import Quiz from '../models/Quiz.js'
import Post from '../models/Post.js'
import FriendshipQuiz from '../models/FriendshipQuiz.js'
import Story from '../models/Story.js'
import Puzzle from '../models/Puzzle.js'

// Generates sitemap.xml straight from the database so it never goes stale as
// content is added/published — a static file would need manual updates every
// time a quiz/post is added. Uses the FRONTEND_URL (the public site's own
// domain), not this API's domain — search engines expect a sitemap to list
// the pages people actually visit.
//
// NOTE: this lives at the API's own /sitemap.xml, not under /api. Once
// deployed with the frontend and backend on separate domains (frontend on
// Vercel, backend on Render/Railway — see ORIGINAL_PLAN.md), a one-time
// hosting-level rewrite is needed so https://<your-frontend-domain>/sitemap.xml
// proxies to this endpoint — search engines expect the sitemap to live on the
// same domain as the pages it lists, not on a separate API subdomain.
// Escapes special XML characters so text values are safe to put inside the XML.
function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

// Returns the public site's own web address, used to build page links.
function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

// Builds and returns sitemap.xml — the list of all public page links search engines use to crawl the site.
export async function getSitemap(req, res) {
  const base = frontendUrl()
  // The site's fixed pages that always belong in the sitemap
  const urls = [
    { loc: `${base}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${base}/about`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${base}/faq`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${base}/privacy`, changefreq: 'monthly', priority: '0.2' },
    { loc: `${base}/terms`, changefreq: 'monthly', priority: '0.2' },
    { loc: `${base}/browse/jokes`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${base}/browse/funny-lines`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${base}/browse/quotes`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${base}/browse/motivational-quotes`, changefreq: 'weekly', priority: '0.6' },
  ]

  // Fetches every published item of each content type, all at the same time
  const [quizzes, posts, friendshipQuizzes, stories, puzzles] = await Promise.all([
    Quiz.find({ status: 'published' }).select('slug updatedAt'),
    Post.find({ status: 'published' }).select('_id updatedAt'),
    FriendshipQuiz.find({ status: 'published' }).select('slug updatedAt'),
    Story.find({ status: 'published' }).select('slug updatedAt'),
    Puzzle.find({ status: 'published' }).select('_id updatedAt'),
  ])

  quizzes.forEach((q) => {
    urls.push({
      loc: `${base}/quiz/${q.slug}`,
      lastmod: q.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.8',
    })
  })
  posts.forEach((p) => {
    urls.push({
      loc: `${base}/post/${p._id}`,
      lastmod: p.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.5',
    })
  })
  friendshipQuizzes.forEach((f) => {
    urls.push({
      loc: `${base}/friendship/${f.slug}`,
      lastmod: f.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.7',
    })
  })
  stories.forEach((s) => {
    urls.push({
      loc: `${base}/story/${s.slug}`,
      lastmod: s.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.6',
    })
  })
  puzzles.forEach((p) => {
    urls.push({
      loc: `${base}/puzzle/${p._id}`,
      lastmod: p.updatedAt.toISOString(),
      changefreq: 'monthly',
      priority: '0.5',
    })
  })

  // Turns the list of page links into the actual XML text for the sitemap
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n')

  // Sends the response as XML, not the usual JSON, since this is what search engines expect
  res.set('Content-Type', 'application/xml')
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
  )
}
