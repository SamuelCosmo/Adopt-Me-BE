import { Request, Response } from 'express'
import db from '../db/knexConfig'

export const getSpecies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const species = await db('species').select('id', 'name').orderBy('name', 'asc')
    res.status(200).json(species)
  } catch (error) {
    console.error('Error fetching species:', error)
    res.status(500).json({ error: 'Failed to fetch species' })
  }
}
