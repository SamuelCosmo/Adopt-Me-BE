const taxonomy = require('../constants/petTaxonomy.json')

exports.seed = async function (knex) {
  await knex('adoptions').del()
  await knex('breeds').del()
  await knex('species').del()

  const speciesRows = taxonomy.species.map((item) => ({
    name: item.key,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  }))

  await knex('species').insert(speciesRows)

  const dbSpecies = await knex('species').select('id', 'name')
  const speciesIdByKey = dbSpecies.reduce((acc, row) => {
    acc[row.name] = row.id
    return acc
  }, {})

  const breedsRows = []
  for (const [speciesKey, breeds] of Object.entries(taxonomy.breedsBySpecies)) {
    const speciesId = speciesIdByKey[speciesKey]
    if (!speciesId) continue

    for (const breedName of breeds) {
      breedsRows.push({
        species_id: speciesId,
        name: breedName,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
    }
  }

  if (breedsRows.length > 0) {
    await knex('breeds').insert(breedsRows)
  }
}
