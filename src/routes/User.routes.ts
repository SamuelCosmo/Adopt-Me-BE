import { Router } from 'express'
import { getUsers, createUser, updatePassword, deleteUser, signIn, signOut } from '../controllers/User.controller'
import { verifyAuth } from '../middleware/auth.middleware'

const router = Router()

// Public routes
router.get('/', getUsers)
router.post('/', createUser)
router.post('/signin', signIn)

// Protected routes (require authentication)
router.post('/signout', verifyAuth, signOut)
router.patch('/password', verifyAuth, updatePassword)
router.delete('/account', verifyAuth, deleteUser)

export default router
