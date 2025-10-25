// test-env.js
require('dotenv').config();

console.log('=== 环境变量测试 ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '已设置' : '未设置');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置');
console.log('PORT:', process.env.PORT);

// 显示实际值的前几个字符（用于验证格式）
if (process.env.SUPABASE_URL) {
    console.log('SUPABASE_URL 前20字符:', process.env.SUPABASE_URL.substring(0, 20));
}
if (process.env.SUPABASE_ANON_KEY) {
    console.log('SUPABASE_ANON_KEY 前20字符:', process.env.SUPABASE_ANON_KEY.substring(0, 20));
}

console.log('所有环境变量键:', Object.keys(process.env).filter(key => 
    key.includes('SUPABASE') || key.includes('PORT')
));