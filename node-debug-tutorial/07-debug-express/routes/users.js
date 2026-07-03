/**
 * 用户路由模块
 *
 * 提供用户 CRUD 操作的 REST API 路由。
 * 使用 Express Router 将路由逻辑从主应用中分离。
 *
 * ⚠️ 包含故意植入的 Bug，用于调试练习
 */

const express = require('express');
const router = express.Router();

// ============================================================
// 内存数据存储
// ============================================================

/**
 * 用户数据数组（内存存储）
 * 在实际应用中应使用数据库
 */
let users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', age: 28, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: '李四', email: 'lisi@example.com', age: 32, createdAt: '2024-01-02T00:00:00Z' },
  { id: 3, name: '王五', email: 'wangwu@example.com', age: 25, createdAt: '2024-01-03T00:00:00Z' }
];

/** 自增 ID 计数器 */
let nextId = 4;

// ============================================================
// 路由参数验证中间件
// ============================================================

/**
 * 验证 :id 路由参数
 * 将字符串 ID 转换为数字，并检查用户是否存在
 */
router.param('id', (req, res, next, id) => {
  const parsedId = parseInt(id, 10);

  // 检查 ID 是否为有效数字
  if (isNaN(parsedId) || parsedId <= 0) {
    const error = new Error(`无效的用户 ID: ${id}`);
    error.status = 400;
    return next(error);
  }

  // 将解析后的 ID 存到请求对象上
  req.parsedUserId = parsedId;

  // 查找用户并挂载到请求对象
  req.targetUser = users.find(u => u.id === parsedId);

  next();
});

// ============================================================
// GET /api/users - 获取所有用户
// ============================================================

/**
 * 获取用户列表
 * 支持查询参数：
 *   - name: 按名称筛选
 *   - minAge / maxAge: 按年龄范围筛选
 *   - page / limit: 分页
 */
router.get('/', (req, res) => {
  const { name, minAge, maxAge, page = 1, limit = 10 } = req.query;

  let result = [...users];

  // 按名称筛选
  if (name) {
    result = result.filter(u => u.name.includes(name));
  }

  // 按年龄范围筛选
  if (minAge) {
    result = result.filter(u => u.age >= parseInt(minAge, 10));
  }
  if (maxAge) {
    result = result.filter(u => u.age <= parseInt(maxAge, 10));
  }

  // 分页
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedResult = result.slice(startIndex, startIndex + limitNum);

  res.json({
    data: paginatedResult,
    pagination: {
      total: result.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.length / limitNum)
    }
  });
});

// ============================================================
// GET /api/users/:id - 获取单个用户
// ============================================================

/**
 * 根据 ID 获取单个用户详情
 */
router.get('/:id', (req, res) => {
  if (!req.targetUser) {
    return res.status(404).json({
      error: '用户不存在',
      message: `找不到 ID 为 ${req.parsedUserId} 的用户`
    });
  }

  res.json({ data: req.targetUser });
});

// ============================================================
// POST /api/users - 创建新用户
// ============================================================

/**
 * 创建新用户
 * ⚠️ Bug: 缺少对必填字段的校验
 * 当请求体缺少 name 或 email 时，代码会直接访问 undefined 的属性导致崩溃
 */
router.post('/', (req, res, next) => {
  const { name, email, age } = req.body;

  // ⚠️ Bug: 这里应该校验必填字段，但代码没有做校验
  // 如果 name 为 undefined，调用 name.trim() 会抛出 TypeError
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  // 检查邮箱是否已存在
  const existingUser = users.find(u => u.email === trimmedEmail);
  if (existingUser) {
    return res.status(409).json({
      error: '邮箱已存在',
      message: `邮箱 ${trimmedEmail} 已被注册`
    });
  }

  // 创建新用户
  const newUser = {
    id: nextId++,
    name: trimmedName,
    email: trimmedEmail,
    age: age ? parseInt(age, 10) : null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  console.log(`[用户创建] 新用户 ID=${newUser.id}, 名称=${newUser.name}`);

  res.status(201).json({
    data: newUser,
    message: '用户创建成功'
  });
});

// ============================================================
// PUT /api/users/:id - 更新用户
// ============================================================

/**
 * 更新用户信息
 * ⚠️ Bug: 数据合并逻辑有误，会用请求体的所有字段覆盖，
 * 包括不应该被修改的 id 和 createdAt 字段
 */
router.put('/:id', (req, res) => {
  if (!req.targetUser) {
    return res.status(404).json({
      error: '用户不存在',
      message: `找不到 ID 为 ${req.parsedUserId} 的用户`
    });
  }

  const userIndex = users.findIndex(u => u.id === req.parsedUserId);

  // ⚠️ Bug: 直接用 Object.assign 合并，没有过滤掉不应修改的字段
  // 如果请求体中包含 id 或 createdAt，这些字段也会被覆盖
  const updatedUser = Object.assign(req.targetUser, req.body);
  users[userIndex] = updatedUser;

  console.log(`[用户更新] 用户 ID=${req.parsedUserId} 已更新`);

  res.json({
    data: updatedUser,
    message: '用户更新成功'
  });
});

// ============================================================
// DELETE /api/users/:id - 删除用户
// ============================================================

/**
 * 删除用户
 */
router.delete('/:id', (req, res) => {
  if (!req.targetUser) {
    return res.status(404).json({
      error: '用户不存在',
      message: `找不到 ID 为 ${req.parsedUserId} 的用户`
    });
  }

  const userIndex = users.findIndex(u => u.id === req.parsedUserId);
  const deletedUser = users.splice(userIndex, 1)[0];

  console.log(`[用户删除] 用户 ID=${deletedUser.id}, 名称=${deletedUser.name} 已删除`);

  res.json({
    data: deletedUser,
    message: '用户删除成功'
  });
});

// ============================================================
// GET /api/users/search/advanced - 高级搜索（演示复杂查询调试）
// ============================================================

/**
 * 高级搜索端点
 * 演示复杂查询逻辑的调试
 */
router.get('/search/advanced', (req, res) => {
  const { keyword, sortBy = 'name', sortOrder = 'asc' } = req.query;

  let result = [...users];

  // 关键词搜索（搜索名称和邮箱）
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    result = result.filter(u =>
      u.name.toLowerCase().includes(lowerKeyword) ||
      u.email.toLowerCase().includes(lowerKeyword)
    );
  }

  // 排序
  result.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  res.json({
    data: result,
    query: { keyword, sortBy, sortOrder },
    count: result.length
  });
});

module.exports = router;
