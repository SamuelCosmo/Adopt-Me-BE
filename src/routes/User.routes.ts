import { Router } from 'express'
import { getUsers, createUser, updatePassword, deleteUser, signIn, signOut } from '../controllers/User.controller'
const router = Router()

// Route to get all tasks
router.get('/', getUsers)

// Route to create a new task
router.post('/', createUser)

// Route for user sign-in
router.post('/signin', signIn)

// Route for user sign-out
router.post('/signout', signOut)

// Route to update an existing task by its ID
router.patch('/:id', updatePassword)

// Route to delete a task by its ID
router.delete('/:id', deleteUser)

export default router
