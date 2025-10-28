const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

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

module.exports = router;