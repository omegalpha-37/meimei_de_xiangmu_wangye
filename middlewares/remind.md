##### 目前没有保护任何接口

用于保护需要登录才能访问的接口，形式如下：

```javascript
// 引入中间件
const { requireAuth } = require('../middlewares/authMiddleware');
// 假设这是用户资料路由
router.put('/profile', requireAuth, async (req, res) => { 
  // 只有通过验证的用户才能进入这里
  const userId = req.user.id; // 直接使用中间件传递的用户信息
  // 处理资料修改逻辑...
});
```

