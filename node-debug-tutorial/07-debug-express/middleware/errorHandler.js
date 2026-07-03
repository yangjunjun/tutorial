/**
 * 全局错误处理中间件
 *
 * 捕获应用中所有未处理的错误，返回统一格式的错误响应。
 *
 * ⚠️ 包含故意植入的 Bug，用于调试练习：
 * Bug: 在某些情况下会发送两次响应（ERR_HTTP_HEADERS_SENT）
 */

/**
 * 错误处理中间件
 * Express 通过参数数量（4个）识别错误处理中间件
 *
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  // 获取请求上下文（如果可用）
  const requestId = req.requestId || 'unknown';

  // 确定错误状态码
  const statusCode = err.status || err.statusCode || 500;

  // 构建错误响应体
  const errorResponse = {
    error: {
      message: err.message || '服务器内部错误',
      status: statusCode,
      requestId: requestId,
      timestamp: new Date().toISOString()
    }
  };

  // 在开发环境下包含错误堆栈
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  // 记录错误日志
  console.error(`[错误] 请求 ${requestId}: ${err.message}`);
  console.error(`[错误] 状态码: ${statusCode}`);
  console.error(`[错误] 路径: ${req.method} ${req.originalUrl}`);
  if (err.stack) {
    console.error(`[错误] 堆栈:\n${err.stack}`);
  }

  // ⚠️ Bug: 对于验证错误，先发送了一次 400 响应
  if (err.type === 'entity.parse.failed' || err.message.includes('JSON')) {
    // JSON 解析错误，返回 400
    res.status(400).json({
      error: {
        message: '请求体 JSON 格式错误',
        status: 400,
        requestId: requestId
      }
    });
    // 缺少 return！会继续执行下面的代码，导致发送第二次响应
  }

  // ⚠️ Bug: 状态码错误
  // 这里应该使用之前计算的 statusCode，但错误地硬编码为 200
  // 导致所有错误都返回 200 状态码（除了上面的 JSON 解析错误）
  res.status(200).json(errorResponse);
}

/**
 * 异步路由包装器
 * 自动捕获异步路由中的错误并传递给错误处理中间件
 *
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} 包装后的路由处理函数
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
