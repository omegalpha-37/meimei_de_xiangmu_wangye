// routes/comments.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 评论数据文件路径 - 现在放在项目根目录的 data 文件夹
const COMMENTS_FILE = path.join(__dirname, '../data/comments.json');

// 确保数据目录存在
const dataDir = path.dirname(COMMENTS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化评论数据文件（如果不存在）
if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2));
}

// 辅助函数：读取评论数据
function readComments() {
    try {
        const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取评论数据失败:', error);
        return [];
    }
}

// 辅助函数：写入评论数据
function writeComments(comments) {
    try {
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
        return true;
    } catch (error) {
        console.error('写入评论数据失败:', error);
        return false;
    }
}

// 获取最新评论（限制数量）
router.get('/latest', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // 默认返回5条
        let comments = readComments();
        
        // 按时间倒序排列，获取最新的评论
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 限制返回数量
        const latestComments = comments.slice(0, limit);
        
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
        const comments = readComments();
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
        
        const comments = readComments();
        
        // 创建新评论
        const newComment = {
            id: Date.now().toString(), // 简单的时间戳作为ID
            name: name.trim(),
            email: email ? email.trim() : '',
            message: message.trim(),
            timestamp: new Date().toISOString(),
            status: 'active' // 评论状态：active, pending, rejected
        };
        
        // 添加到评论列表
        comments.unshift(newComment); // 新评论放在前面
        
        // 保存到文件
        if (writeComments(comments)) {
            res.json({
                success: true,
                message: '评论提交成功',
                data: newComment
            });
        } else {
            res.status(500).json({
                success: false,
                message: '评论保存失败'
            });
        }
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
        const comments = readComments();
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