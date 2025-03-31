import { Router } from 'express'
import {
  getTokens,
  getByUserId,
  getByToken,
  createTokenByUserId,
  deleteTokenByUserId,
} from '../controllers/Token.controller'

const router = Router()

/**
 * @route GET /
 * @desc Retrieve all tokens
 */
router.get('/', getTokens)

/**
 * @route GET /:id
 * @desc Retrieve a token by its value
 */
router.get('/:id', getByToken)

/**
 * @route GET /user/:id
 * @desc Retrieve a token by user ID
 */
router.get('/user/:id', getByUserId)

/**
 * @route POST /
 * @desc Create a new token for a user
 */
router.post('/', createTokenByUserId)

/**
 * @route DELETE /:id
 * @desc Delete a token by user ID
 */
router.delete('/:id', deleteTokenByUserId)

export default router
