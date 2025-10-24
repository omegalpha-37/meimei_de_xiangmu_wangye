const express = require('express');
const router = express.Router();

// 使用内存存储（因为 Vercel 文件系统是只读的）
let comments = [];

// 获取最新评论
router.get('/latest', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        // 按时间倒序排列，获取最新的评论
        const sortedComments = [...comments].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        const latestComments = sortedComments.slice(0, limit);
        
        res.json({
            success: true,
            data: latestComments
        });
    } catch (error) {
        console.error('获取最新评论失败:', error);
        res.status(500).json({
            success: false,
            message: '获取评论失败'
        });
    }
});

// 获取所有评论
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({
            success: false,
            message: '获取评论失败'
        });
    }
});

// 提交新评论
router.post('/', (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // 验证必填字段
        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: '姓名和留言内容为必填项'
            });
        }
        
        // 创建新评论
        const newComment = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email ? email.trim() : '',
            message: message.trim(),
            timestamp: new Date().toISOString(),
            status: 'active'
        };
        
        // 添加到内存数组
        comments.unshift(newComment);
        
        // 限制评论数量，避免内存溢出
        if (comments.length > 100) {
            comments = comments.slice(0, 50);
        }
        
        res.json({
            success: true,
            message: '评论提交成功',
            data: newComment
        });
        
    } catch (error) {
        console.error('提交评论失败:', error);
        res.status(500).json({
            success: false,
            message: '提交评论失败'
        });
    }
});

// 获取评论数量
router.get('/count', (req, res) => {
    try {
        const activeComments = comments.filter(comment => comment.status === 'active');
        
        res.json({
            success: true,
            data: {
                total: comments.length,
                active: activeComments.length
            }
        });
    } catch (error) {
        console.error('获取评论数量失败:', error);
        res.status(500).json({
            success: false,
            message: '获取评论数量失败'
        });
    }
});

module.exports = router;