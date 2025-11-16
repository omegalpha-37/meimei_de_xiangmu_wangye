// routes/comments.js
const express = require('express');
const router = express.Router();
const requireAuth = require('./authMiddleware');

// 导入 Supabase 客户端
const supabase = require('./supabaseClient');

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
//supabase目前仅允许管理员查看所有评论，待添加管理员权限验证（不需要也可以）
router.get('/allcomments', async (req, res) => {
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

// 发布评论（登录版）
router.post('/postcomments', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;
        const user = req.user;
        
        // 验证必填字段
        if (!content) {
            return res.status(400).json({
                success: false,
                message: '评论内容为必填项'
            });
        }

        if (!content || content.trim().length > 500) { // 示例：限制500字
            return res.status(400).json({
            success: false,
            message: '评论内容不能为空且长度不能超过500字'
            });
        }
        
        // 使用 Supabase 插入数据
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    content: content.trim(),
                    user_id: user.id,
                    //先注释掉
                    //user_email: user.email,
                    status: 'active',
                    //supabase中有时间戳功能，先注释掉
                    //created_at: new Date().toISOString()
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
            message: '评论发布成功',
            data: data[0] // 返回新创建的评论
        });
    } catch (error) {
        console.error('发布评论失败:', error);
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

//待添加：评论修改和评论删除（supabase策略已存在）

module.exports = router;