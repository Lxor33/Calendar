require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { pool, ensureSchema } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN,
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(session({
  name: 'schedule.sid',
  secret: process.env.SESSION_SECRET || 'schedule_dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/settings', settingsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, message: error.message || '服务器错误' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Schedule backend is running at http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  });
