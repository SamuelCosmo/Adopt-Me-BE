import { Request, Response } from 'express'
import db from '../db/knexConfig'

export const getBreeds = async (req: Request, res: Response): Promise<void> => {
  const { species_id } = req.query

  try {
    const query = db('breeds').select('id', 'species_id', 'name').orderBy('name', 'asc')

    if (typeof species_id === 'string' && species_id.trim()) {
      query.where('species_id', Number(species_id))
    }

    const breeds = await query
    res.status(200).json(breeds)
  } catch (error) {
    console.error('Error fetching breeds:', error)
    res.status(500).json({ error: 'Failed to fetch breeds' })
  }
}
