import { Request, Response } from 'express'
import db from '../db/knexConfig'
import { AuthRequest } from '../middleware/auth.middleware'
import {
  CloudinaryImageInput,
  deleteImagesFromCloudinary,
  uploadImageFilesToCloudinary,
  uploadImagesToCloudinary,
} from '../utils/cloudinary'

const VALID_STATUSES = ['active', 'pending', 'adopted', 'cancelled']
const VALID_GENDERS = ['male', 'female', 'unknown']
const VALID_SIZES = ['small', 'medium', 'large']

const ADOPTION_SELECT_COLUMNS = {
  list: [
    'a.id',
    'a.user_id',
    'a.species_id',
    'a.breed_id',
    'a.title',
    'a.pet_name',
    'a.description',
    'a.address',
    'a.city',
    'a.state',
    'a.zip_code',
    'a.age',
    'a.size',
    'a.gender',
    'a.images',
    'a.status',
    'a.created_at',
    'a.updated_at',
    's.name as species_name',
    'b.name as breed_name',
    'u.name as owner_name',
    'u.phone as owner_phone',
  ],
  byId: ['a.deleted_at'],
}

type AdoptionImageInput = {
  url: string
  order: number
}

type AdoptionImageStored = {
  url: string
}

type AdoptionWithUserRow = {
  user_id: number
  owner_name: string | null
  owner_phone: string | null
  images: unknown
} & Record<string, unknown>

const parseImages = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

const parseImageUrls = (value: unknown): string[] => {
  const parsed = parseImages(value)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((image) => (image as AdoptionImageStored)?.url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
}

const normalizeAdoption = <T extends AdoptionWithUserRow>(adoption: T) => {
  const { owner_name, owner_phone, ...rest } = adoption

  return {
    ...rest,
    images: parseImages(adoption.images),
    user: {
      id: adoption.user_id,
      name: owner_name,
      phone: owner_phone,
    },
  }
}

const validateImages = (images: unknown): string | null => {
  if (!Array.isArray(images)) return 'images must be an array'
  if (images.length < 1 || images.length > 6) return 'images must contain between 1 and 6 elements'

  const usedOrders = new Set<number>()
  for (const image of images as AdoptionImageInput[]) {
    if (!image || typeof image.url !== 'string' || !image.url.trim()) {
      return 'each image must include a valid url'
    }

    if (!Number.isInteger(image.order) || image.order < 1 || image.order > 6) {
      return 'each image order must be an integer between 1 and 6'
    }

    if (usedOrders.has(image.order)) {
      return 'image order values must be unique'
    }
    usedOrders.add(image.order)
  }

  return null
}

const getUploadErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.includes('Cloudinary is not configured')) {
    return 'Image upload service is not configured'
  }

  return fallbackMessage
}

const getRequestFiles = (req: AuthRequest): Express.Multer.File[] => {
  return Array.isArray(req.files) ? req.files : []
}

const buildAdoptionSelectQuery = (...columns: string[]) => {
  return db('adoptions as a')
    .leftJoin('species as s', 'a.species_id', 's.id')
    .leftJoin('breeds as b', 'a.breed_id', 'b.id')
    .leftJoin('users as u', 'a.user_id', 'u.id')
    .select(...columns)
}

const fetchAdoptionById = async (id: number) => {
  return buildAdoptionSelectQuery(...ADOPTION_SELECT_COLUMNS.list, ...ADOPTION_SELECT_COLUMNS.byId)
    .where('a.id', id)
    .first()
}

export const getAdoptions = async (req: Request, res: Response): Promise<void> => {
  const { status, city, species_id } = req.query

  try {
    const query = buildAdoptionSelectQuery(...ADOPTION_SELECT_COLUMNS.list).whereNull('a.deleted_at')

    if (typeof status === 'string' && status.trim()) {
      query.andWhere('a.status', status.trim())
    }

    if (typeof city === 'string' && city.trim()) {
      query.andWhere('a.city', city.trim())
    }

    if (typeof species_id === 'string' && species_id.trim()) {
      query.andWhere('a.species_id', Number(species_id))
    }

    const adoptions = await query.orderBy('a.created_at', 'desc')
    const normalized = adoptions.map(normalizeAdoption)

    res.status(200).json(normalized)
  } catch (error) {
    console.error('Error fetching adoptions:', error)
    res.status(500).json({ error: 'Failed to fetch adoptions' })
  }
}

export const getAdoptionsByUserId = async (req: Request, res: Response): Promise<void> => {
  const userId = Number(req.params.userId)

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid user id' })
      return
    }

    const adoptions = await buildAdoptionSelectQuery(...ADOPTION_SELECT_COLUMNS.list)
      .where('a.user_id', userId)
      .whereNull('a.deleted_at')
      .orderBy('a.created_at', 'desc')

    const normalized = adoptions.map(normalizeAdoption)
    res.status(200).json(normalized)
  } catch (error) {
    console.error('Error fetching adoptions by user id:', error)
    res.status(500).json({ error: 'Failed to fetch user adoptions' })
  }
}

export const getAdoptionById = async (req: Request, res: Response): Promise<void> => {
  const adoptionId = Number(req.params.id)

  try {
    if (!Number.isInteger(adoptionId) || adoptionId <= 0) {
      res.status(400).json({ error: 'Invalid adoption id' })
      return
    }

    const adoption = await fetchAdoptionById(adoptionId)
    if (!adoption || adoption.deleted_at) {
      res.status(404).json({ error: 'Adoption publication not found' })
      return
    }

    res.status(200).json(normalizeAdoption(adoption))
  } catch (error) {
    console.error('Error fetching adoption by id:', error)
    res.status(500).json({ error: 'Failed to fetch adoption publication' })
  }
}

export const createAdoption = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId
  const {
    species_id,
    breed_id,
    title,
    pet_name,
    description,
    address,
    city,
    state,
    zip_code,
    age,
    size,
    gender,
    images,
    status,
  } = req.body

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const requestFiles = getRequestFiles(req)
    const parsedImages = images !== undefined ? parseImages(images) : undefined

    if (
      !species_id ||
      !title ||
      !pet_name ||
      !description ||
      !address ||
      !city ||
      !state ||
      !zip_code ||
      age === undefined ||
      !size ||
      !gender ||
      (requestFiles.length === 0 && !parsedImages)
    ) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    if (!Number.isInteger(Number(age)) || Number(age) < 0) {
      res.status(400).json({ error: 'age must be a non-negative integer' })
      return
    }

    if (!VALID_SIZES.includes(String(size))) {
      res.status(400).json({ error: 'Invalid size value' })
      return
    }

    if (!VALID_GENDERS.includes(String(gender))) {
      res.status(400).json({ error: 'Invalid gender value' })
      return
    }

    if (status && !VALID_STATUSES.includes(String(status))) {
      res.status(400).json({ error: 'Invalid status value' })
      return
    }

    if (requestFiles.length === 0) {
      const imagesError = validateImages(parsedImages)
      if (imagesError) {
        res.status(400).json({ error: imagesError })
        return
      }
    }

    const species = await db('species')
      .where({ id: Number(species_id) })
      .first()
    if (!species) {
      res.status(400).json({ error: 'Invalid species_id' })
      return
    }

    if (breed_id !== null && breed_id !== undefined) {
      const breed = await db('breeds')
        .where({ id: Number(breed_id) })
        .first()
      if (!breed) {
        res.status(400).json({ error: 'Invalid breed_id' })
        return
      }

      if (Number(breed.species_id) !== Number(species_id)) {
        res.status(400).json({ error: 'breed_id does not belong to species_id' })
        return
      }
    }

    const uploadedImages =
      requestFiles.length > 0
        ? await uploadImageFilesToCloudinary(requestFiles, `adopt-me/${userId}/adoptions`)
        : await uploadImagesToCloudinary(parsedImages as AdoptionImageInput[], `adopt-me/${userId}/adoptions`)

    const [created] = await db('adoptions')
      .insert({
        user_id: userId,
        species_id: Number(species_id),
        breed_id: breed_id ? Number(breed_id) : null,
        title: String(title).trim(),
        pet_name: String(pet_name).trim(),
        description: String(description).trim(),
        address: String(address).trim(),
        city: String(city).trim(),
        state: String(state).trim(),
        zip_code: String(zip_code).trim(),
        age: Number(age),
        size: String(size),
        gender: String(gender),
        images: JSON.stringify(uploadedImages),
        status: status ? String(status) : 'active',
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id')

    const createdId = typeof created === 'object' ? created.id : created
    const adoption = await fetchAdoptionById(Number(createdId))

    res.status(201).json(normalizeAdoption(adoption))
  } catch (error) {
    console.error('Error creating adoption publication:', error)
    res.status(500).json({ error: getUploadErrorMessage(error, 'Failed to create adoption publication') })
  }
}

export const updateAdoption = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId
  const adoptionId = Number(req.params.id)
  const {
    species_id,
    breed_id,
    title,
    pet_name,
    description,
    address,
    city,
    state,
    zip_code,
    age,
    size,
    gender,
    images,
    existing_images,
    status,
  } = req.body

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const requestFiles = getRequestFiles(req)
    const parsedImages = images !== undefined ? parseImages(images) : undefined

    if (!Number.isInteger(adoptionId) || adoptionId <= 0) {
      res.status(400).json({ error: 'Invalid adoption id' })
      return
    }

    const existing = await db('adoptions').where({ id: adoptionId }).whereNull('deleted_at').first()
    if (!existing) {
      res.status(404).json({ error: 'Adoption publication not found' })
      return
    }

    if (Number(existing.user_id) !== Number(userId)) {
      res.status(403).json({ error: 'You can only edit your own publications' })
      return
    }

    const previousImageUrls = parseImageUrls(existing.images)

    const updateData: Record<string, unknown> = { updated_at: db.fn.now() }

    const finalSpeciesId = species_id !== undefined ? Number(species_id) : Number(existing.species_id)
    const finalBreedId = breed_id !== undefined ? (breed_id === null ? null : Number(breed_id)) : existing.breed_id

    if (species_id !== undefined) {
      const species = await db('species').where({ id: finalSpeciesId }).first()
      if (!species) {
        res.status(400).json({ error: 'Invalid species_id' })
        return
      }
      updateData.species_id = finalSpeciesId
    }

    if (breed_id !== undefined) {
      if (finalBreedId !== null) {
        const breed = await db('breeds').where({ id: finalBreedId }).first()
        if (!breed) {
          res.status(400).json({ error: 'Invalid breed_id' })
          return
        }
        if (Number(breed.species_id) !== finalSpeciesId) {
          res.status(400).json({ error: 'breed_id does not belong to species_id' })
          return
        }
      }
      updateData.breed_id = finalBreedId
    }

    if (title !== undefined) updateData.title = String(title).trim()
    if (pet_name !== undefined) updateData.pet_name = String(pet_name).trim()
    if (description !== undefined) updateData.description = String(description).trim()
    if (address !== undefined) updateData.address = String(address).trim()
    if (city !== undefined) updateData.city = String(city).trim()
    if (state !== undefined) updateData.state = String(state).trim()
    if (zip_code !== undefined) updateData.zip_code = String(zip_code).trim()

    if (age !== undefined) {
      if (!Number.isInteger(Number(age)) || Number(age) < 0) {
        res.status(400).json({ error: 'age must be a non-negative integer' })
        return
      }
      updateData.age = Number(age)
    }

    if (size !== undefined) {
      if (!VALID_SIZES.includes(String(size))) {
        res.status(400).json({ error: 'Invalid size value' })
        return
      }
      updateData.size = String(size)
    }

    if (gender !== undefined) {
      if (!VALID_GENDERS.includes(String(gender))) {
        res.status(400).json({ error: 'Invalid gender value' })
        return
      }
      updateData.gender = String(gender)
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(String(status))) {
        res.status(400).json({ error: 'Invalid status value' })
        return
      }
      updateData.status = String(status)
    }

    let uploadedImages: CloudinaryImageInput[] = []
    if (requestFiles.length > 0) {
      uploadedImages = await uploadImageFilesToCloudinary(requestFiles, `adopt-me/${userId}/adoptions`)
    } else if (images !== undefined) {
      const imagesError = validateImages(parsedImages)
      if (imagesError) {
        res.status(400).json({ error: imagesError })
        return
      }

      uploadedImages = await uploadImagesToCloudinary(
        parsedImages as AdoptionImageInput[],
        `adopt-me/${userId}/adoptions`,
      )
    }

    const finalImageUrls = [
      ...(existing_images ? existing_images : []).map((img: string, index: number) => ({ url: img, order: index + 1 })),
      ...uploadedImages.map((img, index) => ({ url: img.url, order: (existing_images?.length ?? 0) + index + 1 })),
    ]
    updateData.images = JSON.stringify(finalImageUrls)

    if (updateData.images) {
      const nextImageUrls = parseImageUrls(updateData.images)
      const keptImageSet = new Set(nextImageUrls)
      const removedImageUrls = previousImageUrls.filter((url) => !keptImageSet.has(url))

      if (removedImageUrls.length > 0) {
        await deleteImagesFromCloudinary(removedImageUrls)
      }
    }

    await db('adoptions').where({ id: adoptionId }).update(updateData)
    const adoption = await fetchAdoptionById(adoptionId)

    res.status(200).json(normalizeAdoption(adoption))
  } catch (error) {
    console.error('Error updating adoption publication:', error)
    res.status(500).json({ error: getUploadErrorMessage(error, 'Failed to update adoption publication') })
  }
}

export const updateAdoptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId
  const adoptionId = Number(req.params.id)
  const { status } = req.body

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!Number.isInteger(adoptionId) || adoptionId <= 0) {
      res.status(400).json({ error: 'Invalid adoption id' })
      return
    }

    if (!status || !VALID_STATUSES.includes(String(status))) {
      res.status(400).json({ error: 'Invalid status value' })
      return
    }

    const existing = await db('adoptions').where({ id: adoptionId }).whereNull('deleted_at').first()
    if (!existing) {
      res.status(404).json({ error: 'Adoption publication not found' })
      return
    }

    if (Number(existing.user_id) !== Number(userId)) {
      res.status(403).json({ error: 'You can only update your own publications' })
      return
    }

    await db('adoptions')
      .where({ id: adoptionId })
      .update({
        status: String(status),
        updated_at: db.fn.now(),
      })

    const adoption = await fetchAdoptionById(adoptionId)
    res.status(200).json(normalizeAdoption(adoption))
  } catch (error) {
    console.error('Error updating adoption status:', error)
    res.status(500).json({ error: 'Failed to update adoption status' })
  }
}

export const deleteAdoption = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId
  const adoptionId = Number(req.params.id)

  try {
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!Number.isInteger(adoptionId) || adoptionId <= 0) {
      res.status(400).json({ error: 'Invalid adoption id' })
      return
    }

    const existing = await db('adoptions').where({ id: adoptionId }).whereNull('deleted_at').first()
    if (!existing) {
      res.status(404).json({ error: 'Adoption publication not found' })
      return
    }

    if (Number(existing.user_id) !== Number(userId)) {
      res.status(403).json({ error: 'You can only delete your own publications' })
      return
    }

    await db('adoptions').where({ id: adoptionId }).update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    res.status(200).json({ message: 'Adoption publication deleted successfully' })
  } catch (error) {
    console.error('Error deleting adoption publication:', error)
    res.status(500).json({ error: 'Failed to delete adoption publication' })
  }
}
