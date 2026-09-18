import { v2 as cloudinary } from 'cloudinary'

// One shared, configured Cloudinary client — every upload goes through
// this same instance rather than each caller re-reading the 3 env vars
// and re-configuring the SDK itself.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// True once real credentials exist — lets callers give a clear "not set up
// yet" error instead of a confusing failure deep inside the Cloudinary SDK.
export function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

export default cloudinary
