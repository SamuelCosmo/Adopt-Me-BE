import { Request, Response } from 'express'
import db from '../db/knexConfig'
import { hashPassword, verifyPassword } from '../utils/hash_passwords'
import crypto from 'crypto'

// Get all users (without passwords)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await db('users').select('id', 'name', 'email', 'created_at')
    res.status(200).json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body

  console.log('Create User Request: ', req.body)
  try {
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const userExists = await db('users').where({ email }).first()
    if (userExists) {
      res.status(409).json({ error: 'Email already in use' })
      return
    }

    const hashedPassword = await hashPassword(password)

    const [newUser] = await db('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning(['id', 'name', 'email'])

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

// Update user password
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body
  const { id } = req.params

  try {
    const user = await db('users').where({ id }).first()
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const isMatch = await verifyPassword(currentPassword, user.password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }

    const newHashedPassword = await hashPassword(newPassword)

    await db('users').where({ id }).update({
      password: newHashedPassword,
      updated_at: db.fn.now(),
    })

    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error updating password:', error)
    res.status(500).json({ error: 'Failed to update password' })
  }
}

// Delete user (soft delete)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    await db('users').where({ id }).update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

// Sign In User and Create a token
export const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  console.log('Sign In Request: ', req.body)
  try {
    // Check if user exists
    const user = await db('users').where({ email }).first()
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresIn = 60 * 60 * 24 * 30 * 6 // 6 months
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Save token in database
    await db('tokens').insert({
      user_id: user.id,
      token,
      type: 'access_token',
      expires_at: expiresAt,
    })

    res.status(200).json({
      message: 'Sign-in successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('Error signing in:', error)
    res.status(500).json({ error: 'Failed to sign in' })
  }
}

// Sign Out User and Remove Token
export const signOut = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body
  console.log('Sign Out Request: ', req.body)

  try {
    // Check if token exists
    const tokenExists = await db('tokens').where({ token }).first()
    if (!tokenExists) {
      res.status(401).json({ error: 'Invalid token or already signed out' })
      return
    }

    // Delete token from database
    await db('tokens').where({ token }).del()

    res.status(200).json({ message: 'Sign-out successful' })
  } catch (error) {
    console.error('Error signing out:', error)
    res.status(500).json({ error: 'Failed to sign out' })
  }
}
