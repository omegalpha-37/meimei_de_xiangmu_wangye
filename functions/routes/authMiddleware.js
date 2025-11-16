const supabase = require('../routes/supabaseClient'); // 复用已配置的supabase客户端（包含环境变量）

// 认证中间件：验证用户是否登录
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies['sb-access-token'];
    
    if (!token) {
      return res.status(401).json({ error: '请先登录' });
    }

    // 使用supabase客户端验证token（客户端已加载环境变量）
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.clearCookie('sb-access-token');
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }

    req.user = user; // 将用户信息挂载到请求对象
    next();
  } catch (error) {
    res.status(500).json({ error: '认证错误' });
  }
};

module.exports = requireAuth ;