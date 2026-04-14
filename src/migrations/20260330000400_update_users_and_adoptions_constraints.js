exports.up = async function (knex) {
  const hasPhone = await knex.schema.hasColumn('users', 'phone')
  if (!hasPhone) {
    await knex.schema.alterTable('users', (table) => {
      table.string('phone').nullable().after('password')
    })
  }

  const [checkConstraintRows] = await knex.raw(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'adoptions'
        AND CONSTRAINT_NAME = 'chk_adoptions_images_max_6'
        AND CONSTRAINT_TYPE = 'CHECK'
    `
  )

  if (!Array.isArray(checkConstraintRows) || checkConstraintRows.length === 0) {
    await knex.raw(
      "ALTER TABLE adoptions ADD CONSTRAINT chk_adoptions_images_max_6 CHECK (JSON_LENGTH(images) <= 6)"
    )
  }
}

exports.down = async function (knex) {
  const [checkConstraintRows] = await knex.raw(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'adoptions'
        AND CONSTRAINT_NAME = 'chk_adoptions_images_max_6'
        AND CONSTRAINT_TYPE = 'CHECK'
    `
  )

  if (Array.isArray(checkConstraintRows) && checkConstraintRows.length > 0) {
    await knex.raw('ALTER TABLE adoptions DROP CHECK chk_adoptions_images_max_6')
  }

  const hasPhone = await knex.schema.hasColumn('users', 'phone')
  if (hasPhone) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('phone')
    })
  }
}
