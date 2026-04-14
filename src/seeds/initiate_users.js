const bcrypt = require('bcrypt')

exports.seed = async function (knex) {
  const adminPasswordHash = await bcrypt.hash('test', 10)
  const testPasswordHash = await bcrypt.hash('test', 10)

  await knex('users').del()

  await knex('users').insert([
    {
      name: 'admin_user',
      email: 'admin@example.com',
      phone: '5551000001',
      password: adminPasswordHash,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      name: 'test_user',
      email: 'user@example.com',
      phone: '5551000002',
      password: testPasswordHash,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}
