const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'schedule_app',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '')
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      login VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      language VARCHAR(20) DEFAULT 'ru',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL DEFAULT 'Моё расписание',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      schedule_id INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      task_date DATE NOT NULL,
      task_time TIME,
      is_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      remind_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'ru';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_time TIME;
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS label VARCHAR(50);
  `);
}

module.exports = {
  pool,
  ensureSchema
};
