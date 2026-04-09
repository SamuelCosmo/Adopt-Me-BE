exports.up = async function (knex) {
  const hasDeletedAt = await knex.schema.hasColumn('users', 'deleted_at')

  if (!hasDeletedAt) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('deleted_at').nullable()
    })
    return
  }

  await knex.schema.alterTable('users', (table) => {
    table.timestamp('deleted_at').nullable().alter()
  })
}

exports.down = async function () {
  // Intentionally left as a no-op to avoid forcing non-null values
  // on soft-delete timestamp data.
}
