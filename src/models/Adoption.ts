export type AdoptionStatus = 'active' | 'pending' | 'adopted' | 'cancelled'
export type PetGender = 'male' | 'female' | 'unknown'
export type PetSize = 'small' | 'medium' | 'large'

export interface AdoptionImage {
  url: string
  order: 1 | 2 | 3 | 4 | 5 | 6
}

export interface AdoptionProps {
  id: number
  user_id: number
  species_id: number
  breed_id: number | null
  title: string
  pet_name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  age: number
  size: PetSize
  gender: PetGender
  images: AdoptionImage[]
  status: AdoptionStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}
