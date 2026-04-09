import { NextFunction, Request, Response } from 'express'
import multer from 'multer'

const MAX_FILES = 6
const MAX_FILE_SIZE_MB = 5

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_FILES,
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }

    cb(null, true)
  },
})

export const uploadAdoptionImages = (req: Request, res: Response, next: NextFunction): void => {
  upload.array('images', MAX_FILES)(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: `Each image must be smaller than ${MAX_FILE_SIZE_MB}MB` })
        return
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({ error: `You can upload up to ${MAX_FILES} images` })
        return
      }
    }

    res.status(400).json({ error: error.message || 'Invalid image upload' })
  })
}
