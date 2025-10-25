// routes/comments.js
const express = require('express');
const router = express.Router();

// 导入 Supabase 客户端
const supabase = require('../config/supabaseClient');

// 获取最新评论（限制数量）
router.get('/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        // 使用 Supabase 查询数据
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('status', 'active') // 只获取活跃状态的评论
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase 查询错误:', error);
            return res.status(500).json({
                success: false,
                message: '获取评论失败'
            });
        }

        res.json({
            success: true,
            data: data || [] // 如果没有数据返回空数组
        });
    } catch (error) {
        console.error('获取最新评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取所有评论
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase 查询错误:', error);
            return res.status(500).json({
                success: false,
                message: '获取评论失败'
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 提交新评论
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // 验证必填字段
        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: '姓名和留言内容为必填项'
            });
        }
        
        // 使用 Supabase 插入数据
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    name: name.trim(),
                    email: email ? email.trim() : '',
                    message: message.trim(),
                    status: 'active'
                }
            ])
            .select();

        if (error) {
            console.error('Supabase 插入错误:', error);
            return res.status(500).json({
                success: false,
                message: '评论保存失败: ' + error.message
            });
        }

        res.json({
            success: true,
            message: '评论提交成功',
            data: data[0] // 返回新创建的评论
        });
    } catch (error) {
        console.error('提交评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取评论数量
router.get('/count', async (req, res) => {
    try {
        // 获取总评论数
        const { count: totalCount, error: totalError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true });

        // 获取活跃评论数
        const { count: activeCount, error: activeError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (totalError || activeError) {
            console.error('Supabase 计数错误:', totalError || activeError);
            return res.status(500).json({
                success: false,
                message: '获取评论数量失败'
            });
        }

        res.json({
            success: true,
            data: {
                total: totalCount || 0,
                active: activeCount || 0
            }
        });
    } catch (error) {
        console.error('获取评论数量失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;