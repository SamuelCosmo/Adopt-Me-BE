import { Router } from 'express'
import { getSpecies } from '../controllers/Species.controller'

const router = Router()

router.get('/', getSpecies)

export default router
