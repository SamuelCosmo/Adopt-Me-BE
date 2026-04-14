import { Router } from 'express'
import { getBreeds } from '../controllers/Breed.controller'

const router = Router()

router.get('/', getBreeds)

export default router
