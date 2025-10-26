// index.js
const express = require('express');
const path = require('path');
const commentRoutes = require('./routes/comments');

const app = express();
require('dotenv').config();



// 手动 CORS 中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 指向 public 文件夹
app.use(express.static(path.join(__dirname, 'public'),{
	index: false
}));
// 路由
//app.use('/api/comments', commentRoutes);
app.use('/api/comments', require('./routes/comments'));
// 提供前端页面 - 现在指向 public/index1.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});

// 捕获所有其他路由，服务于前端 SPA
app.get('*', (req, res) => {
    // 如果是 API 请求返回 404，否则返回前端页面
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API 端点不存在' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// Vercel 需要导出 app 而不是监听端口
module.exports = app;

// 本地开发时监听端口
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}