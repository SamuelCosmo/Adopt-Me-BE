export async function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.string('email').unique().notNullable()
    table.string('password').notNullable() 
    table.timestamps(true, true) 
    table.timestamp('deleted_at').nullable()
  })
}

export async function down(knex) {
  return knex.schema.dropTable('users')
}
