// ============================================================
// Node.js Console 调试方法完全演示
// 运行方式: node app.js
// ============================================================

const SEPARATOR = '\n' + '='.repeat(60) + '\n';

// ============================================================
// 第一部分：基础输出方法
// ============================================================

console.log(SEPARATOR);
console.log('第一部分：基础输出方法');
console.log(SEPARATOR);

console.log('[console.log]   这是普通日志，输出到 stdout');
console.info('[console.info]  这是提示信息，语义上更"正式"，输出到 stdout');
console.warn('[console.warn]  这是警告信息，输出到 stderr');
console.error('[console.error] 这是错误信息，输出到 stderr');

// 演示：格式化输出（printf 风格的占位符）
console.log('\n--- 格式化输出 ---');
console.log('字符串: %s, 数字: %d, 浮点数: %f, JSON: %j', 'hello', 42, 3.14, { a: 1 });
console.log('当前进程 ID: %d, 平台: %s', process.pid, process.platform);

// 演示：CSS 样式（仅在 Chrome DevTools 中有效，终端中会被忽略）
console.log('%c这段文字在 DevTools 中会有颜色', 'color: red; font-weight: bold;');

// ============================================================
// 第二部分：console.table() 表格打印
// ============================================================

console.log(SEPARATOR);
console.log('第二部分：console.table() 表格打印');
console.log(SEPARATOR);

// 打印对象数组
console.log('--- 用户列表 ---');
const users = [
  { id: 1, name: '张三', age: 25, role: '管理员', department: '技术部' },
  { id: 2, name: '李四', age: 30, role: '普通用户', department: '产品部' },
  { id: 3, name: '王五', age: 28, role: '普通用户', department: '设计部' },
  { id: 4, name: '赵六', age: 35, role: '管理员', department: '技术部' },
];
console.table(users);

// 只打印指定列
console.log('--- 只显示姓名和年龄 ---');
console.table(users, ['name', 'age']);

// 打印嵌套对象
console.log('--- 配置对象 ---');
const config = {
  database: { host: 'localhost', port: 5432, name: 'mydb' },
  redis:    { host: 'localhost', port: 6379, name: 'cache' },
  api:      { host: '0.0.0.0', port: 3000, name: 'server' },
};
console.table(config);

// ============================================================
// 第三部分：console.time() / console.timeEnd() 计时
// ============================================================

console.log(SEPARATOR);
console.log('第三部分：console.time() 计时器');
console.log(SEPARATOR);

// 基础计时
console.time('数组排序耗时');
const bigArray = Array.from({ length: 500000 }, () => Math.random());
bigArray.sort((a, b) => a - b);
console.timeEnd('数组排序耗时');

// 多个计时器同时运行
console.log('\n--- 同时运行多个计时器 ---');
console.time('同步循环');
console.time('数组方法');

// 同步循环求和
let sum = 0;
for (let i = 0; i < 10000000; i++) {
  sum += i;
}
console.timeEnd('同步循环');

// 数组方法求和
const arr = Array.from({ length: 10000000 }, (_, i) => i);
const sum2 = arr.reduce((a, b) => a + b, 0);
console.timeEnd('数组方法');

// console.timeLog() - 不结束计时器，只打印当前耗时
console.log('\n--- timeLog() 中途打印 ---');
console.time('长任务');

// 模拟第一阶段
let stage1 = 0;
for (let i = 0; i < 5000000; i++) stage1 += Math.sqrt(i);
console.timeLog('长任务', '第一阶段完成');

// 模拟第二阶段
let stage2 = 0;
for (let i = 0; i < 5000000; i++) stage2 += Math.sin(i);
console.timeLog('长任务', '第二阶段完成');

// 模拟第三阶段
let stage3 = 0;
for (let i = 0; i < 5000000; i++) stage3 += Math.cos(i);
console.timeEnd('长任务');

// ============================================================
// 第四部分：console.trace() 调用栈追踪
// ============================================================

console.log(SEPARATOR);
console.log('第四部分：console.trace() 调用栈追踪');
console.log(SEPARATOR);

function 处理订单(订单) {
  return 验证订单(订单);
}

function 验证订单(订单) {
  return 计算总价(订单);
}

function 计算总价(订单) {
  // 在这里追踪调用栈，看看是从哪里调用的
  console.trace('计算总价被调用，订单:', 订单.id);
  return 订单.items.reduce((total, item) => total + item.price * item.qty, 0);
}

const testOrder = {
  id: 'ORD-001',
  items: [
    { name: 'Node.js 实战', price: 89, qty: 1 },
    { name: 'JavaScript 权威指南', price: 138, qty: 2 },
  ],
};

const total = 处理订单(testOrder);
console.log('订单总价:', total);

// ============================================================
// 第五部分：console.group() 分组输出
// ============================================================

console.log(SEPARATOR);
console.log('第五部分：console.group() 分组输出');
console.log(SEPARATOR);

console.group('请求处理');
console.log('收到请求: GET /api/users');
console.log('请求参数: { page: 1, limit: 10 }');

console.group('数据库查询');
console.log('SQL: SELECT * FROM users LIMIT 10 OFFSET 0');
console.log('查询耗时: 12ms');
console.log('返回行数: 10');
console.groupEnd();

console.group('响应构建');
console.log('状态码: 200');
console.log('响应体大小: 2.4KB');

console.group('响应头');
console.log('Content-Type: application/json');
console.log('X-Request-Id: abc-123');
console.groupEnd();

console.groupEnd();

console.group('缓存层');
console.log('缓存命中: false');
console.log('缓存键: users:page:1:limit:10');
console.groupEnd();

console.groupEnd();

// ============================================================
// 第六部分：console.assert() 断言
// ============================================================

console.log(SEPARATOR);
console.log('第六部分：console.assert() 断言');
console.log(SEPARATOR);

function 除法(a, b) {
  console.assert(b !== 0, '除数不能为零！当前 b =', b);
  return a / b;
}

console.log('10 / 2 =', 除法(10, 2));    // 正常
console.log('10 / 0 =', 除法(10, 0));    // 断言失败！

// 更多断言示例
const user = { name: '张三', age: 25, email: 'zhangsan@example.com' };
console.assert(typeof user.name === 'string', '用户名必须是字符串');
console.assert(user.age >= 0 && user.age <= 150, '年龄不在合理范围内:', user.age);
console.assert(user.email.includes('@'), '邮箱格式不正确:', user.email);
console.assert(user.phone !== undefined, '缺少手机号字段'); // 这个会失败

// ============================================================
// 第七部分：console.dir() 查看对象详情
// ============================================================

console.log(SEPARATOR);
console.log('第七部分：console.dir() 查看对象详情');
console.log(SEPARATOR);

// 深层嵌套对象
const deepObject = {
  server: {
    http: {
      host: '0.0.0.0',
      port: 3000,
      options: {
        timeout: 30000,
        keepAlive: true,
        headers: {
          'X-Powered-By': 'Node.js',
        },
      },
    },
    https: {
      host: '0.0.0.0',
      port: 443,
      cert: '/path/to/cert.pem',
    },
  },
  database: {
    primary: { host: 'db1.example.com', port: 5432 },
    replica: { host: 'db2.example.com', port: 5432 },
  },
};

console.log('--- 默认显示（depth=2）---');
console.dir(deepObject);

console.log('\n--- 完全展开（depth=null, colors=true）---');
console.dir(deepObject, { depth: null, colors: true });

// 查看 process 对象的部分属性
console.log('\n--- process.memoryUsage() ---');
console.dir(process.memoryUsage(), { colors: true });

// ============================================================
// 第八部分：实战演示 - 有 bug 的购物车计算函数
// ============================================================

console.log(SEPARATOR);
console.log('第八部分：有 bug 的购物车计算函数');
console.log(SEPARATOR);

/**
 * 购物车计算函数（包含多个 bug，供练习调试）
 *
 * 预期行为：
 *   - 计算购物车中所有商品的总价
 *   - 应用折扣（百分比）
 *   - 计算运费（满 99 免运费，否则 10 元）
 *   - 返回 { subtotal, discount, shipping, total }
 */
function calculateCart(cart, discountPercent) {
  // Bug 1: reduce 的初始值问题
  const subtotal = cart.reduce(function(acc, item) {
    return acc + item.price * item.quantity;
  });  // 缺少初始值 0

  // Bug 2: 折扣计算方向错误
  const discount = subtotal * (discountPercent / 100);
  const discountedPrice = subtotal + discount; // 应该是减法

  // Bug 3: 运费判断的阈值逻辑有误
  let shipping;
  if (discountedPrice > 99) {  // 应该是 >= 99
    shipping = 0;
  } else {
    shipping = 10;
  }

  const total = discountedPrice + shipping;

  // 用 console 方法打印调试信息
  console.group('购物车结算详情');
  console.log('商品列表:');
  console.table(cart, ['name', 'price', 'quantity']);
  console.log('商品小计:', subtotal);
  console.log('折扣 (' + discountPercent + '%):', discount);
  console.log('折扣后价格:', discountedPrice);
  console.log('运费:', shipping);
  console.log('总计:', total);
  console.assert(total < subtotal, '总价应该小于小计（有折扣的情况下）');
  console.groupEnd();

  return {
    subtotal: subtotal,
    discount: discount,
    shipping: shipping,
    total: total,
  };
}

// 测试数据
const shoppingCart = [
  { name: 'JavaScript 高级程序设计', price: 99.00, quantity: 1 },
  { name: '机械键盘',                price: 399.00, quantity: 1 },
  { name: 'USB-C 转接头',            price: 29.90, quantity: 2 },
];

console.log('测试购物车计算（8折优惠）：');
const result = calculateCart(shoppingCart, 20);

console.log('\n--- 计算结果 ---');
console.dir(result, { colors: true });

// 预期结果应该是：
// subtotal: 99 + 399 + 59.8 = 557.8
// discount: 557.8 * 0.2 = 111.56
// discountedPrice: 557.8 - 111.56 = 446.24
// shipping: 0（满99免运费）
// total: 446.24

console.log('\n--- 预期结果 ---');
console.log('小计: 557.8');
console.log('折扣: 111.56');
console.log('运费: 0');
console.log('总计: 446.24');
console.log('\n请对比实际结果与预期结果，使用调试技巧找出所有 bug！');
console.log('提示：试试在 calculateCart 函数中添加 debugger; 语句，然后用 node inspect app.js 运行');
