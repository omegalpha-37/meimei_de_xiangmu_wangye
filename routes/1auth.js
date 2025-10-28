const express = require('express');
const router = express.Router();
const supabase = require('../routes/supabaseClient');

// 认证中间件：验证用户是否登录
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

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      success: true,
      message: '注册成功，请检查邮箱验证', 
      user: user 
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { user, session, error } = await supabase.auth.signIn({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 设置session cookie
    res.cookie('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });

    res.json({ 
      success: true,
      message: '登录成功', 
      user: user 
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登出
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 清除cookie
    res.clearCookie('sb-access-token');
    res.json({ message: '已退出登录' });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户
router.get('/user', async (req, res) => {
  try {
    const token = req.cookies['sb-access-token'];
    
    if (!token) {
      return res.json({ user: null });
    }

    const { user, error } = await supabase.auth.getUser(token);

    if (error) {
      res.clearCookie('sb-access-token');
      return res.json({ user: null });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 导出路由和中间件（供其他文件使用中间件）
module.exports = { router, requireAuth };