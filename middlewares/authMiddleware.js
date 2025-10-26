const supabase = require('../config/supabaseClient');

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies['sb-access-token'];
    
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }

    const { user, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.clearCookie('sb-access-token');
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: '认证错误' });
  }
};

module.exports = { requireAuth };