const PET_NAMES = [
  'Luna',
  'Milo',
  'Nala',
  'Toby',
  'Kira',
  'Simba',
  'Coco',
  'Max',
]

const CITIES = [
  { city: 'Monterrey', state: 'Nuevo Leon', zip_code: '64000' },
  { city: 'Guadalajara', state: 'Jalisco', zip_code: '44100' },
  { city: 'Merida', state: 'Yucatan', zip_code: '97000' },
  { city: 'Puebla', state: 'Puebla', zip_code: '72000' },
]

exports.seed = async function (knex) {
  await knex('adoptions').del()

  const users = await knex('users').select('id', 'name')
  const species = await knex('species').select('id', 'name')
  const breeds = await knex('breeds').select('id', 'species_id', 'name')

  if (users.length === 0 || species.length === 0) {
    return
  }

  const breedsBySpecies = breeds.reduce((acc, breed) => {
    if (!acc[breed.species_id]) {
      acc[breed.species_id] = []
    }
    acc[breed.species_id].push(breed)
    return acc
  }, {})

  const sizes = ['small', 'medium', 'large']
  const genders = ['male', 'female']
  const adoptionsRows = []

  users.forEach((user, userIndex) => {
    for (let petIndex = 0; petIndex < 2; petIndex += 1) {
      const offset = userIndex * 2 + petIndex
      const speciesRow = species[offset % species.length]
      const speciesBreeds = breedsBySpecies[speciesRow.id] || []
      const breedRow = speciesBreeds.length > 0 ? speciesBreeds[offset % speciesBreeds.length] : null
      const location = CITIES[offset % CITIES.length]
      const petName = PET_NAMES[offset % PET_NAMES.length]
      const age = (offset % 12) + 1

      adoptionsRows.push({
        user_id: user.id,
        species_id: speciesRow.id,
        breed_id: breedRow ? breedRow.id : null,
        title: `Looking for a home: ${petName}`,
        pet_name: petName,
        description: `${petName} is a friendly ${speciesRow.name.toLowerCase()} looking for a loving family.`,
        age,
        size: sizes[offset % sizes.length],
        gender: genders[offset % genders.length],
        status: 'active',
        address: `${120 + offset} Adoption Avenue`,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code,
        images: JSON.stringify([
          {
            url: `https://placehold.co/800x600?text=${encodeURIComponent(petName)}`,
            order: 1,
          },
        ]),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
    }
  })

  if (adoptionsRows.length > 0) {
    await knex('adoptions').insert(adoptionsRows)
  }
}
