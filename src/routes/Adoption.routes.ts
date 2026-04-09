import { Router } from 'express'
import {
  createAdoption,
  deleteAdoption,
  getAdoptionById,
  getAdoptionsByUserId,
  getAdoptions,
  updateAdoption,
  updateAdoptionStatus,
} from '../controllers/Adoption.controller'
import { verifyAuth } from '../middleware/auth.middleware'
import { uploadAdoptionImages } from '../middleware/upload.middleware'

const router = Router()

router.get('/', getAdoptions)
router.get('/user/:userId', getAdoptionsByUserId)
router.get('/:id', getAdoptionById)
router.post('/', verifyAuth, uploadAdoptionImages, createAdoption)
router.patch('/:id', verifyAuth, uploadAdoptionImages, updateAdoption)
router.patch('/:id/status', verifyAuth, updateAdoptionStatus)
router.delete('/:id', verifyAuth, deleteAdoption)

export default router
