import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db/knexConfig'

export interface AuthRequest extends Request {
  userId?: number
  token?: string
}

export const verifyAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: number
      email: string
    }

    const tokenData = await db('tokens').where({ token, user_id: decoded.userId }).first()

    if (!tokenData) {
      res.status(401).json({ error: 'Token not found in database' })
      return
    }

    if (tokenData.is_revoked) {
      res.status(401).json({ error: 'Token has been revoked' })
      return
    }

    const expiresAt = new Date(tokenData.expires_at)
    if (expiresAt < new Date()) {
      res.status(401).json({ error: 'Token has expired' })
      return
    }

    const user = await db('users').where({ id: decoded.userId }).whereNull('deleted_at').first()
    if (!user) {
      res.status(401).json({ error: 'User not found or has been deleted' })
      return
    }

    req.userId = decoded.userId
    req.token = token

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' })
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
    } else {
      console.error('Auth middleware error:', error)
      res.status(500).json({ error: 'Authentication failed' })
    }
  }
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: number
      email: string
    }

    const tokenData = await db('tokens').where({ token, user_id: decoded.userId }).first()
    if (tokenData && !tokenData.is_revoked) {
      const expiresAt = new Date(tokenData.expires_at)
      if (expiresAt >= new Date()) {
        req.userId = decoded.userId
        req.token = token
      }
    }

    next()
  } catch (error) {
    next()
  }
}
