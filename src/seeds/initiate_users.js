const { hashPassword } = require('../utils/hash_passwords') // Use require

exports.seed = function (knex) {
  return knex('users')
    .del()
    .then(function () {
      return knex('users').insert([
        {
          name: 'admin_user',
          email: 'admin@example.com',
          password: `${hashPassword('test')}`, // Hashed password
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
        {
          name: 'test_user',
          email: 'user@example.com',
          password: `${hashPassword('test')}`, // Hashed password
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        },
      ])
    })
}
