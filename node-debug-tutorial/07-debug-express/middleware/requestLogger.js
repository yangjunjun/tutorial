/**
 * 请求日志中间件
 *
 * 记录每个 HTTP 请求的详细信息，包括：
 * - 请求方法、URL、请求头
 * - 请求体内容
 * - 响应状态码
 * - 请求耗时
 *
 * ⚠️ 包含故意植入的 Bug，用于调试练习：
 * Bug: 所有请求数据（包括请求体）都存储在内存数组中，永不清理
 * 这会导致长时间运行后内存持续增长（内存泄漏）
 */

// ============================================================
// 请求历史存储
// ============================================================

/**
 * 请求历史记录数组
 * ⚠️ 这是一个内存泄漏源！
 * 每个请求的完整信息都被永久保存在这个数组中，
 * 随着请求数量增加，内存使用量会持续增长。
 *
 * 修复方案：
 * - 限制数组最大长度（例如只保留最近 1000 条）
 * - 使用外部存储（Redis、数据库）替代内存存储
 * - 定期清理过期记录
 * - 只存储必要的摘要信息而非完整请求体
 */
const requestHistory = [];

/**
 * 获取请求历史统计信息
 * 用于监控内存泄漏的程度
 */
function getRequestHistoryStats() {
  return {
    totalRequests: requestHistory.length,
    // 粗略估计内存使用（字节）
    estimatedMemoryBytes: JSON.stringify(requestHistory).length,
    oldestEntry: requestHistory.length > 0 ? requestHistory[0].timestamp : null,
    newestEntry: requestHistory.length > 0 ? requestHistory[requestHistory.length - 1].timestamp : null
  };
}

// ============================================================
// 日志中间件
// ============================================================

/**
 * 请求日志中间件
 * 记录请求和响应的详细信息
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.requestId || 'unknown';

  // 记录请求开始
  console.log(`[请求] ${requestId} -> ${req.method} ${req.originalUrl}`);

  // ⚠️ Bug: 捕获完整的请求信息用于历史记录
  // 问题 1: 存储了完整的请求体，对于大请求体（如文件上传）会占用大量内存
  // 问题 2: requestHistory 数组只增不减，导致内存泄漏
  const requestRecord = {
    requestId: requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: { ...req.headers },     // 存储完整的请求头
    query: { ...req.query },          // 存储查询参数
    body: req.body ? { ...req.body } : null, // ⚠️ 存储完整的请求体
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // ⚠️ 内存泄漏：将请求记录推入永远不会清理的数组
  requestHistory.push(requestRecord);

  // 每 100 个请求打印一次统计警告
  if (requestHistory.length % 100 === 0) {
    const stats = getRequestHistoryStats();
    console.warn(
      `[内存警告] 请求历史已积累 ${stats.totalRequests} 条记录，` +
      `估计内存占用: ${(stats.estimatedMemoryBytes / 1024).toFixed(2)} KB`
    );
  }

  // 监听响应完成事件，记录响应信息
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // 将响应信息也存入请求记录
    requestRecord.response = {
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('content-length') || 0
    };

    // 打印请求完成日志
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(
      `[响应] ${requestId} <- ${statusColor} ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${duration}ms`
    );
  });

  next();
}

// ============================================================
// 调试辅助端点（开发环境专用）
// ============================================================

/**
 * 创建一个用于查看请求历史的路由处理器
 * 仅在开发环境下可用，用于调试和监控
 *
 * @returns {Function} Express 路由处理函数
 */
function createHistoryEndpoint() {
  return (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const start = (pageNum - 1) * limitNum;

    res.json({
      stats: getRequestHistoryStats(),
      recentRequests: requestHistory.slice(start, start + limitNum)
    });
  };
}

module.exports = {
  requestLogger,
  requestHistory,
  getRequestHistoryStats,
  createHistoryEndpoint
};
