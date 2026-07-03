// ============================================================
// 数据处理模块 - 提供排序、过滤、聚合功能
// 被 app.js 中的 HTTP 服务器调用
//
// 本模块包含若干微妙的 bug，适合用 Chrome DevTools 调试发现。
// ============================================================

// ============================================================
// 排序函数
// ============================================================

/**
 * 对用户数组按指定字段排序
 *
 * @param {Array} users - 用户对象数组
 * @param {string} sortBy - 排序字段（'score', 'age', 'name'）
 * @param {string} order - 排序方向（'asc' 升序, 'desc' 降序）
 * @returns {Array} 排序后的新数组
 */
function sortUsers(users, sortBy, order) {
  // 创建副本避免修改原数组
  var sorted = users.slice();

  sorted.sort(function(a, b) {
    var valA = a[sortBy];
    var valB = b[sortBy];

    // 字符串比较
    if (typeof valA === 'string' && typeof valB === 'string') {
      // Bug 1: 字符串排序使用了 localeCompare 但忘记考虑 order 参数
      // 当 order 为 'desc' 时结果不正确
      return valA.localeCompare(valB, 'zh-CN');
    }

    // 数字比较
    // Bug 2: 降序时减反了，应该是 valB - valA
    if (order === 'desc') {
      return valA - valB;  // 这实际上是升序！
    } else {
      return valA - valB;  // 升序和降序逻辑完全一样
    }
  });

  return sorted;
}

// ============================================================
// 过滤函数
// ============================================================

/**
 * 根据过滤条件筛选用户
 *
 * @param {Array} users - 用户对象数组
 * @param {Object} filters - 过滤条件 { name, minAge, maxAge, department }
 * @returns {Array} 符合条件的用户数组
 */
function filterUsers(users, filters) {
  var results = users.filter(function(user) {
    // 按姓名模糊匹配
    if (filters.name) {
      // 检查用户名是否包含搜索关键词
      if (user.name.indexOf(filters.name) === -1) {
        return false;
      }
    }

    // 按最小年龄过滤
    if (filters.minAge !== undefined) {
      // Bug 3: 使用了 > 而不是 >=
      // 搜索 minAge=28 时，年龄恰好为 28 的用户被排除了
      if (user.age > filters.minAge) {
        // 这里条件是对的（大于 minAge 才通过）
        // 但实际上应该是 >=
      } else {
        return false;
      }
    }

    // 按最大年龄过滤
    if (filters.maxAge !== undefined) {
      // Bug 4: 这里用了 < 而不是 <=
      if (user.age < filters.maxAge) {
        // 同上，应该是 <=
      } else {
        return false;
      }
    }

    // 按部门过滤
    if (filters.department) {
      if (user.department !== filters.department) {
        return false;
      }
    }

    return true;
  });

  return results;
}

// ============================================================
// 聚合函数
// ============================================================

/**
 * 按部门分组用户
 *
 * @param {Array} users - 用户对象数组
 * @returns {Object} { 部门名: [用户数组] }
 */
function groupByDepartment(users) {
  var groups = {};

  users.forEach(function(user) {
    var dept = user.department;

    if (!groups[dept]) {
      groups[dept] = [];
    }

    groups[dept].push({
      id: user.id,
      name: user.name,
      score: user.score,
    });
  });

  return groups;
}

/**
 * 计算所有用户的平均分
 *
 * @param {Array} users - 用户对象数组
 * @returns {number} 平均分（保留一位小数）
 */
function calculateAverageScore(users) {
  if (users.length === 0) return 0;

  var totalScore = 0;
  for (var i = 0; i < users.length; i++) {
    totalScore += users[i].score;
  }

  // Bug 5: 浮点数精度问题
  // JavaScript 中 (784.1 / 8) 可能得到 98.01250000000001 这样的结果
  // 应该用 Math.round 或 toFixed 处理
  var avg = totalScore / users.length;

  // 返回原始浮点数，不做舍入处理
  // 这导致前端展示时可能出现 85.49999999999999 这样的数字
  return avg;
}

/**
 * 计算分数分布（优秀/良好/及格/不及格）
 *
 * @param {Array} users - 用户对象数组
 * @returns {Object} 分布统计
 */
function getScoreDistribution(users) {
  var distribution = {
    '优秀': 0,   // >= 90
    '良好': 0,   // >= 80 且 < 90
    '及格': 0,   // >= 60 且 < 80
    '不及格': 0, // < 60
  };

  users.forEach(function(user) {
    // Bug 6: 比较条件使用了字符串而非数字
    // 如果 score 意外变成字符串（比如从查询参数获取），比较会出错
    if (user.score >= 90) {
      distribution['优秀']++;
    } else if (user.score >= 80) {
      distribution['良好']++;
    } else if (user.score >= 60) {
      distribution['及格']++;
    } else {
      distribution['不及格']++;
    }
  });

  return distribution;
}

/**
 * 找出分数最高和最低的用户
 *
 * @param {Array} users - 用户对象数组
 * @returns {Object} { highest: user, lowest: user }
 */
function findTopAndBottom(users) {
  if (users.length === 0) {
    return { highest: null, lowest: null };
  }

  var highest = users[0];
  var lowest = users[0];

  // Bug 7: 循环从 0 开始（浪费一次比较），但这不是 bug
  // 真正的 bug 是比较逻辑写反了
  for (var i = 0; i < users.length; i++) {
    if (users[i].score > highest.score) {
      highest = users[i];
    }
    // Bug: 这里用了 > 而不是 <
    if (users[i].score > lowest.score) {
      lowest = users[i];
    }
  }

  return {
    highest: { name: highest.name, score: highest.score },
    lowest: { name: lowest.name, score: lowest.score },
  };
}

// ============================================================
// 模块导出
// ============================================================

module.exports = {
  sortUsers: sortUsers,
  filterUsers: filterUsers,
  groupByDepartment: groupByDepartment,
  calculateAverageScore: calculateAverageScore,
  getScoreDistribution: getScoreDistribution,
  findTopAndBottom: findTopAndBottom,
};
