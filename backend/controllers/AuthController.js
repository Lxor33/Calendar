const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getOrCreateScheduleId } = require('../models/Schedule');

async function register(req, res) {
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '');

  if (!login || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }
  if (login.length > 50) {
    return res.status(400).json({ success: false, message: '用户名不能超过 50 个字符' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码至少 6 位' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.createUser(login, passwordHash);
    await getOrCreateScheduleId(user.id);
    req.session.userId = user.id;
    req.session.login = user.login;
    return res.status(201).json({ success: true, user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: '该用户名已存在' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function login(req, res) {
  const loginValue = String(req.body.login || '').trim();
  const password = String(req.body.password || '');

  if (!loginValue || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  try {
    const user = await User.findByLogin(loginValue);
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    req.session.userId = user.id;
    req.session.login = user.login;
    await getOrCreateScheduleId(user.id);
    return res.json({
      success: true,
      user: { id: user.id, login: user.login, language: user.language }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('schedule.sid');
    res.json({ success: true });
  });
}

async function me(req, res) {
  const user = await User.findById(req.session.userId);
  res.json({ success: true, user });
}

async function changePassword(req, res) {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: '请填写当前密码，新密码至少 6 位' });
  }

  const passwordHash = await User.getPasswordHash(req.session.userId);
  const ok = passwordHash ? await bcrypt.compare(currentPassword, passwordHash) : false;
  if (!ok) {
    return res.status(401).json({ success: false, message: '当前密码错误' });
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(req.session.userId, nextHash);
  return res.json({ success: true });
}

module.exports = {
  register,
  login,
  logout,
  me,
  changePassword
};
