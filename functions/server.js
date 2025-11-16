const app = require('../index.js');  // 指向你原来的入口文件

const serverless = require('serverless-http');
const handler = serverless(app);
module.exports.handler = handler;