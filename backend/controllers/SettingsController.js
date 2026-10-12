const User = require('../models/User');
const { normalizeLanguage } = require('../utils/validators');

async function getSettings(req, res) {
  const user = await User.findById(req.session.userId);
  res.json({
    success: true,
    settings: {
      language: user ? user.language : 'ru'
    }
  });
}

async function updateLanguage(req, res) {
  const language = normalizeLanguage(req.body.language);
  if (!language) {
    return res.status(400).json({ success: false, message: '语言参数无效' });
  }

  const user = await User.updateLanguage(req.session.userId, language);
  return res.json({ success: true, user });
}

module.exports = {
  getSettings,
  updateLanguage
};
