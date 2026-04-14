import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db/knexConfig'
import { hashPassword, verifyPassword } from '../utils/hash_passwords'
import { AuthRequest } from '../middleware/auth.middleware'

// Get all users (without passwords)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await db('users')
      .select('id', 'name', 'email', 'created_at')
      .whereNull('deleted_at')
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
export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body
  const userId = req.userId

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' })
      return
    }

    const user = await db('users').where({ id: userId }).first()
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const isMatch = await verifyPassword(currentPassword, user.password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid current password' })
      return
    }

    const newHashedPassword = await hashPassword(newPassword)

    await db('users').where({ id: userId }).update({
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
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await db('users').where({ id: userId }).first()
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    await db('users').where({ id: userId }).update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    // Revoke all user tokens
    await db('tokens').where({ user_id: userId }).update({
      is_revoked: true,
      updated_at: db.fn.now(),
    })

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

// Sign In User and Create a JWT token
export const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  console.log('Sign In Request: ', req.body)
  try {
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Check if user exists
    const user = await db('users').where({ email }).whereNull('deleted_at').first()
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

    // Generate JWT token (15 days)
    const jwtSecret = process.env.JWT_SECRET!
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: '15d',
    })

    // Calculate expiration time
    const expiresIn = 15 * 24 * 60 * 60 // 15 days in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Save token in database
    await db('tokens').insert({
      user_id: user.id,
      token,
      type: 'access_token',
      expires_at: expiresAt,
      is_revoked: false,
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

// Sign Out User and Revoke Token
export const signOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const token = req.token
  const userId = req.userId

  console.log('Sign Out Request from user:', userId)

  try {
    if (!token || !userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Revoke token instead of deleting it
    const updated = await db('tokens')
      .where({ token, user_id: userId })
      .update({ is_revoked: true, updated_at: db.fn.now() })

    if (!updated) {
      res.status(401).json({ error: 'Invalid token or already signed out' })
      return
    }

    res.status(200).json({ message: 'Sign-out successful' })
  } catch (error) {
    console.error('Error signing out:', error)
    res.status(500).json({ error: 'Failed to sign out' })
  }
}
