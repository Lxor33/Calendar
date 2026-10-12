function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  return next();
}

module.exports = requireAuth;
