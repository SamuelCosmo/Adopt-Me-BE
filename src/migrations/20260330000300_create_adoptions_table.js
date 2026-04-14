exports.up = function (knex) {
  return knex.schema.createTable('adoptions', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.integer('species_id').unsigned().notNullable().references('id').inTable('species').onDelete('RESTRICT')
    table.integer('breed_id').unsigned().nullable().references('id').inTable('breeds').onDelete('SET NULL')

    table.string('title').notNullable()
    table.string('pet_name').notNullable()
    table.text('description').notNullable()
    table.integer('age').unsigned().notNullable()
    table.enu('size', ['small', 'medium', 'large']).notNullable()
    table.enu('gender', ['male', 'female', 'unknown']).notNullable().defaultTo('unknown')
    table.enu('status', ['active', 'pending', 'adopted', 'cancelled']).notNullable().defaultTo('active')

    table.string('address').notNullable()
    table.string('city').notNullable()
    table.string('state').notNullable()
    table.string('zip_code').notNullable()

    table.json('images').notNullable()
    table.timestamps(true, true)
    table.timestamp('deleted_at').nullable()

    table.index(['user_id'])
    table.index(['status'])
    table.index(['city'])
    table.index(['species_id'])
    table.index(['breed_id'])
  })
    .then(() => knex.raw('ALTER TABLE adoptions ADD CONSTRAINT chk_adoptions_images_max_6 CHECK (JSON_LENGTH(images) <= 6)'))
}

exports.down = function (knex) {
  return knex.schema.dropTable('adoptions')
}
