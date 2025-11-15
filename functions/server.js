// server.js - 位于项目根目录
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const serverless = require('serverless-http');

require('dotenv').config();

const app = express();

// CORS 中间件
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://aaaoooaaaooo.netlify.app',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务
app.use(express.static(path.join(process.cwd(), 'public'), { index: 'index1.html' }))
/*app.use(express.static(path.join(__dirname, '../public'), {
    index:'index1.html'
}))//, {index: false}));*/

// 路由挂载
app.use('/api/auth', require(path.join(process.cwd(), 'routes/auth')));
app.use('/api/authMiddleware', require(path.join(process.cwd(), 'routes/authMiddleware')));
app.use('/api/comments', require(path.join(process.cwd(), 'routes/comments')));
/*app.use('/api/auth', require('../routes/auth'));
app.use('/api/authMiddleware', require('../routes/authMiddleware'));
app.use('/api/comments', require('../routes/comments'));*/

// 提供前端页面
app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, '../public', 'index1.html'));
    res.sendFile(path.join(process.cwd(), 'public', 'index1.html'));
});

// 捕获所有其他路由
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API 端点不存在' });
    }
    //res.sendFile(path.join(__dirname, '../public', 'index1.html'));
    res.sendFile(path.join(process.cwd(), 'public', 'index1.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 导出给 serverless-http
module.exports.handler = serverless(app);

// 本地开发时监听端口
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}