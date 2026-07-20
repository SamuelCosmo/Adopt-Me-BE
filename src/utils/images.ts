import { AuthRequest } from '../middleware/auth.middleware'
import { ImageInput, ImageStored } from './types'

export const getRequestFiles = (req: AuthRequest): Express.Multer.File[] => {
  return Array.isArray(req.files) ? req.files : []
}

export const parseImages = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export const parseImageUrls = (value: unknown): string[] => {
  const parsed = parseImages(value)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((image) => (image as ImageStored)?.url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
}

export const validateImages = (images: unknown): string | null => {
  if (!Array.isArray(images)) return 'images must be an array'
  if (images.length < 1 || images.length > 6) return 'images must contain between 1 and 6 elements'

  const usedOrders = new Set<number>()
  for (const image of images as ImageInput[]) {
    if (!image || typeof image.url !== 'string' || !image.url.trim()) {
      return 'each image must include a valid url'
    }

    if (!Number.isInteger(image.order) || image.order < 1 || image.order > 6) {
      return 'each image order must be an integer between 1 and 6'
    }

    if (usedOrders.has(image.order)) {
      return 'image order values must be unique'
    }
    usedOrders.add(image.order)
  }

  return null
}
