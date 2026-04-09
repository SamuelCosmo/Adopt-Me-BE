import { v2 as cloudinary } from 'cloudinary'

export type CloudinaryImageInput = {
  url: string
  order: number
}

let isConfigured = false

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  }

  return { cloudName, apiKey, apiSecret }
}

const ensureCloudinaryConfigured = () => {
  if (isConfigured) {
    return
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  isConfigured = true
}

const isCloudinaryUrl = (url: string) => /res\.cloudinary\.com/i.test(url)

const extractPublicIdFromCloudinaryUrl = (url: string): string | null => {
  if (!isCloudinaryUrl(url)) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname
    const uploadMarker = '/upload/'
    const uploadIndex = path.indexOf(uploadMarker)

    if (uploadIndex === -1) {
      return null
    }

    const afterUpload = path.slice(uploadIndex + uploadMarker.length)
    const pathSegments = afterUpload.split('/').filter(Boolean)
    if (pathSegments.length === 0) {
      return null
    }

    const versionIndex = pathSegments.findIndex((segment) => /^v\d+$/i.test(segment))
    const assetSegments = versionIndex >= 0
      ? pathSegments.slice(versionIndex + 1)
      : pathSegments

    if (assetSegments.length === 0) {
      return null
    }

    const lastSegment = assetSegments[assetSegments.length - 1]
    const extensionIndex = lastSegment.lastIndexOf('.')
    if (extensionIndex <= 0) {
      return null
    }

    assetSegments[assetSegments.length - 1] = lastSegment.slice(0, extensionIndex)

    return assetSegments.join('/')
  } catch {
    return null
  }
}

export const uploadImagesToCloudinary = async (
  images: CloudinaryImageInput[],
  folder = 'adopt-me',
): Promise<CloudinaryImageInput[]> => {
  ensureCloudinaryConfigured()

  const normalizedImages = [...images].sort((a, b) => a.order - b.order)

  return Promise.all(
    normalizedImages.map(async (image) => {
      const source = image.url.trim()

      if (isCloudinaryUrl(source)) {
        return {
          url: source,
          order: image.order,
        }
      }

      const result = await cloudinary.uploader.upload(source, {
        folder,
        resource_type: 'image',
      })

      return {
        url: result.secure_url,
        order: image.order,
      }
    }),
  )
}

export const uploadImageFilesToCloudinary = async (
  files: Express.Multer.File[],
  folder = 'adopt-me',
): Promise<CloudinaryImageInput[]> => {
  ensureCloudinaryConfigured()

  return Promise.all(
    files.map(async (file, index) => {
      const fileAsDataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`

      const result = await cloudinary.uploader.upload(fileAsDataUri, {
        folder,
        resource_type: 'image',
      })

      return {
        url: result.secure_url,
        order: index + 1,
      }
    }),
  )
}

export const deleteImagesFromCloudinary = async (urls: string[]): Promise<void> => {
  if (urls.length === 0) {
    return
  }

  ensureCloudinaryConfigured()

  const publicIds = [...new Set(urls
    .map((url) => extractPublicIdFromCloudinaryUrl(url))
    .filter((publicId): publicId is string => Boolean(publicId)))]

  await Promise.all(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: 'image' })),
  )
}
