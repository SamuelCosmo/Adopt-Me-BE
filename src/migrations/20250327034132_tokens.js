exports.up = function (knex) {
  return knex.schema.createTable('tokens', (table) => {
    table.increments('id').primary()
    table.string('token').notNullable().unique() // JWT or other token
    table.string('type').notNullable() // e.g., 'refresh_token', 'access_token', 'password_reset'
    table.boolean('is_revoked').defaultTo(false)
    table.timestamp('expires_at').notNullable()

    // Foreign key to users table
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE') // Delete tokens if user is deleted
    table.timestamps(true, true) // created_at, updated_at
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('tokens')
}
