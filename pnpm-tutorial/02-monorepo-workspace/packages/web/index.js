// 1. 引入本地工作区（workspace）里的共享包！
// 虽然 @tutorial/shared 并没有发布到 npm 官网上，但 pnpm 帮我们自动链接到了本地 packages/shared
const { add, formatDate } = require('@tutorial/shared');

// 2. 引入外部第三方依赖
const axios = require('axios');

console.log('🌐 @tutorial/web 应用启动了！\n');

// 3. 测试调用本地共享包
console.log('--- 测试本地共享包 @tutorial/shared ---');
const sum = add(123, 456);
console.log('👉 调用 add(123, 456) 结果为:', sum);

const today = formatDate(new Date());
console.log('👉 调用 formatDate 格式化当前日期为:', today);
console.log('---------------------------------------\n');

// 4. 测试调用外部依赖 axios
console.log('--- 测试外部第三方包 axios ---');
console.log('👉 准备发起 HTTP mock 请求...');
axios.get('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => {
    console.log('✅ 请求成功！返回数据：', response.data);
  })
  .catch(error => {
    console.error('❌ 请求失败：', error.message);
  });
