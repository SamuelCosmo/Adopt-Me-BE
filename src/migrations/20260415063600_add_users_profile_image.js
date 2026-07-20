/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const profileImage = await knex.schema.hasColumn('users', 'profile_image')

  if (!profileImage) {
    await knex.schema.alterTable('users', (table) => {
      table.string('profile_image').nullable()
    })
    return
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  
};
