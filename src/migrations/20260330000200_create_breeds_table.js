exports.up = function (knex) {
  return knex.schema.createTable('breeds', (table) => {
    table.increments('id').primary()
    table.integer('species_id').unsigned().notNullable().references('id').inTable('species').onDelete('CASCADE')
    table.string('name').notNullable()
    table.timestamps(true, true)

    table.unique(['species_id', 'name'])
    table.index(['species_id'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('breeds')
}
