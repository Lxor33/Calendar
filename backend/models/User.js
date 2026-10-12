const { pool } = require('../config/db');

async function findByLogin(login) {
  const result = await pool.query(
    'SELECT id, login, password_hash, language FROM users WHERE login = $1',
    [login]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, login, language, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createUser(login, passwordHash) {
  const result = await pool.query(
    'INSERT INTO users (login, password_hash) VALUES ($1, $2) RETURNING id, login, language',
    [login, passwordHash]
  );
  return result.rows[0];
}

async function getPasswordHash(id) {
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  return result.rows[0] ? result.rows[0].password_hash : null;
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

async function updateLanguage(id, language) {
  const result = await pool.query(
    'UPDATE users SET language = $1 WHERE id = $2 RETURNING id, login, language',
    [language, id]
  );
  return result.rows[0];
}

module.exports = {
  findByLogin,
  findById,
  createUser,
  getPasswordHash,
  updatePassword,
  updateLanguage
};
