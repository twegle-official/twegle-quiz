import cloudinary, { isCloudinaryConfigured } from '../utils/cloudinary.js'

// Handles an admin uploading a real image file (a puzzle picture, a
// Detective clue photo, etc.) — streams it straight to Cloudinary (never
// touches Render's own disk, which is wiped on every redeploy — see
// docs/PENDING_TASKS.md's original "why not just save it on the server"
// reasoning) and hands back the real, permanent URL to drop into whatever
// `imageUrl`/`image` field asked for it. One shared endpoint for every
// content type's image field, same "one endpoint, not one per type"
// reasoning as previewController.js.
export async function uploadImage(req, res) {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ error: 'Image uploads are not set up yet — Cloudinary credentials are missing.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No image file was received' })
  }

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'twegle', resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      )
      stream.end(req.file.buffer)
    })
    res.status(201).json({ url })
  } catch {
    res.status(502).json({ error: 'Image upload failed — please try again.' })
  }
}
