import { Request, Response } from 'express'
import db from '../db/knexConfig'
import crypto from 'crypto'

// Get all tokens
export const getTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const tokens = await db('tokens').select('id', 'user_id', 'token', 'expires_at')
    res.json(tokens)
  } catch (error) {
    console.error('Error fetching tokens:', error)
    res.status(500).json({ error: 'Failed to fetch tokens' })
  }
}

// Get token by user ID
export const getByUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params

  try {
    const tokens = await db('tokens').where({ user_id: userId })
    if (!tokens) {
      res.status(404).json({ error: 'Token not found' })
      return
    }
    res.json(tokens)
  } catch (error) {
    console.error('Error fetching token by user ID:', error)
    res.status(500).json({ error: 'Failed to fetch token' })
  }
}

// Get token by token value
export const getByToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params

  try {
    const tokenData = await db('tokens').where({ token }).first()
    if (!tokenData) {
      res.status(404).json({ error: 'Token not found' })
      return
    }
    res.json(tokenData)
  } catch (error) {
    console.error('Error fetching token by token value:', error)
    res.status(500).json({ error: 'Failed to fetch token' })
  }
}

// Create token for a user (access_token)
export const createTokenByUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params
  const expiresIn = 60 * 60 * 24 * 30 * 6 // 6 months

  try {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    await db('tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    })

    res.status(201).json({ token, expires_at: expiresAt })
  } catch (error) {
    console.error('Error creating token:', error)
    res.status(500).json({ error: 'Failed to create token' })
  }
}

// Delete token by user ID (access_token)
export const deleteTokenByUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params

  try {
    const deletedRows = await db('tokens').where({ user_id: userId }).del()
    if (!deletedRows) {
      res.status(404).json({ error: 'Token not found' })
      return
    }
    res.json({ message: 'Token deleted successfully' })
  } catch (error) {
    console.error('Error deleting token:', error)
    res.status(500).json({ error: 'Failed to delete token' })
  }
}
