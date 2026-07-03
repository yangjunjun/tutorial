// ============================================================
// Node.js HTTP 服务器 - 用于 Chrome DevTools 调试练习
// 运行方式: node --inspect app.js
// 访问: http://localhost:3000
//
// 本文件包含若干故意设置的 bug，请配合 Chrome DevTools 调试发现。
// ============================================================

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const processor = require('./data-processor');

// ----- 模拟用户数据 -----

const users = [
  { id: 1, name: '张三', age: 28, score: 85.5,  department: '技术部', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 32, score: 92.3,  department: '产品部', email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 25, score: 78.9,  department: '技术部', email: 'wangwu@example.com' },
  { id: 4, name: '赵六', age: 35, score: 95.1,  department: '管理层', email: 'zhaoliu@example.com' },
  { id: 5, name: '孙七', age: 27, score: 88.7,  department: '技术部', email: 'sunqi@example.com' },
  { id: 6, name: '周八', age: 30, score: 71.2,  department: '设计部', email: 'zhouba@example.com' },
  { id: 7, name: '吴九', age: 29, score: 90.0,  department: '产品部', email: 'wujiu@example.com' },
  { id: 8, name: '郑十', age: 26, score: 82.4,  department: '技术部', email: 'zhengshi@example.com' },
];

// ----- 辅助函数 -----

/**
 * 发送 JSON 响应
 */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * 发送错误响应
 */
function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message, code: statusCode });
}

/**
 * 解析 POST 请求体
 */
function parseBody(req) {
  return new Promise(function(resolve, reject) {
    let body = '';
    req.on('data', function(chunk) {
      body += chunk.toString();
    });
    req.on('end', function() {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        // Bug 1: 这里应该是 reject，但故意用 resolve 返回错误信息
        // 导致后续代码无法区分成功和失败的解析
        resolve({ _parseError: true, message: e.message, raw: body });
      }
    });
    req.on('error', reject);
  });
}

// ----- 路由处理函数 -----

/**
 * GET / - 首页
 */
function handleHome(req, res) {
  sendJSON(res, 200, {
    message: '欢迎使用 Node.js 调试教程 HTTP 服务器',
    version: '1.0.0',
    endpoints: [
      'GET  /                    - 首页（本页面）',
      'GET  /api/users           - 获取用户列表',
      'GET  /api/users/sorted    - 获取按分数排序的用户',
      'GET  /api/stats           - 获取统计信息',
      'GET  /api/search          - 搜索用户（参数: name, minAge, maxAge, department）',
      'POST /api/echo            - 回显 POST 请求体',
    ],
  });
}

/**
 * GET /api/users - 获取用户列表
 */
function handleGetUsers(req, res) {
  // 直接返回用户列表
  sendJSON(res, 200, {
    total: users.length,
    data: users,
  });
}

/**
 * GET /api/users/sorted - 获取排序后的用户
 */
function handleGetSortedUsers(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const sortBy = parsedUrl.query.sortBy || 'score';
  const order = parsedUrl.query.order || 'desc';

  // 使用 data-processor 模块的排序函数（内部有 bug）
  const sorted = processor.sortUsers(users, sortBy, order);

  sendJSON(res, 200, {
    sortBy: sortBy,
    order: order,
    total: sorted.length,
    data: sorted,
  });
}

/**
 * GET /api/stats - 获取统计信息
 */
function handleGetStats(req, res) {
  const departments = processor.groupByDepartment(users);
  const avgScore = processor.calculateAverageScore(users);

  sendJSON(res, 200, {
    totalUsers: users.length,
    averageScore: avgScore,
    departments: departments,
    // Bug 2: 这里用了 == 而不是 ===，在某些情况下可能导致误判
    hasHighPerformers: avgScore == '85.0',  // 字符串和数字的 == 比较
  });
}

/**
 * GET /api/search - 搜索用户
 */
function handleSearch(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const params = parsedUrl.query;

  // 构建过滤条件
  const filters = {};
  if (params.name) filters.name = params.name;
  if (params.minAge) filters.minAge = parseInt(params.minAge, 10);
  if (params.maxAge) filters.maxAge = parseInt(params.maxAge, 10);
  if (params.department) filters.department = params.department;

  // 使用 data-processor 模块的过滤函数
  const results = processor.filterUsers(users, filters);

  sendJSON(res, 200, {
    filters: filters,
    total: results.length,
    data: results,
  });
}

/**
 * POST /api/echo - 回显请求体
 */
function handleEcho(req, res) {
  parseBody(req).then(function(data) {
    // Bug 3: 没有检查 _parseError 标记
    // 当 JSON 解析失败时，这里仍然当作成功数据处理
    sendJSON(res, 200, {
      received: data,
      timestamp: new Date().toISOString(),
      method: 'POST',
    });
  });
}

// ----- 路由分发 -----

/**
 * 根据请求路径分发到对应的处理函数
 */
function routeRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log('[' + new Date().toISOString() + '] ' + method + ' ' + pathname);

  // Bug 4: 路由匹配逻辑有误
  // 当 pathname 是 /api/users 时，会先匹配到 /api/users/sorted（因为 startsWith）
  if (pathname.startsWith('/api/users')) {
    if (pathname === '/api/users/sorted') {
      handleGetSortedUsers(req, res);
    } else {
      handleGetUsers(req, res);
    }
  } else if (pathname === '/api/stats') {
    handleGetStats(req, res);
  } else if (pathname === '/api/search') {
    handleSearch(req, res);
  } else if (pathname === '/api/echo' && method === 'POST') {
    handleEcho(req, res);
  } else if (pathname === '/') {
    handleHome(req, res);
  } else {
    // Bug 5: 404 页面返回了 200 状态码
    sendJSON(res, 200, {
      error: '路径不存在: ' + pathname,
      hint: '请访问 / 查看所有可用路由',
    });
  }
}

// ----- 启动服务器 -----

const PORT = 3000;

const server = http.createServer(function(req, res) {
  try {
    routeRequest(req, res);
  } catch (err) {
    console.error('服务器内部错误:', err.message);
    console.error(err.stack);
    sendError(res, 500, '服务器内部错误: ' + err.message);
  }
});

server.listen(PORT, function() {
  console.log('服务器已启动: http://localhost:' + PORT);
  console.log('可用路由:');
  console.log('  GET  /                 - 首页');
  console.log('  GET  /api/users        - 用户列表');
  console.log('  GET  /api/users/sorted - 排序用户');
  console.log('  GET  /api/stats        - 统计信息');
  console.log('  GET  /api/search       - 搜索用户');
  console.log('  POST /api/echo         - 回显请求');
  console.log('');
  console.log('提示: 使用 node --inspect app.js 启动后，');
  console.log('      打开 chrome://inspect 连接 DevTools 进行调试。');
});

// 优雅退出
process.on('SIGINT', function() {
  console.log('\n正在关闭服务器...');
  server.close(function() {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
