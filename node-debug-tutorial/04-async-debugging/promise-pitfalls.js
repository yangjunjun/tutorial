/**
 * Promise 常见陷阱示例集
 *
 * 每个示例都展示了错误写法及其原因分析。
 * 可以逐个运行查看问题表现。
 *
 * 运行方式：node promise-pitfalls.js
 */

// ============================================================
// 示例 1：忘记 await 导致静默失败
// ============================================================

console.log('\n=== 示例 1：忘记 await ===\n');

async function fetchUserData(userId) {
  // 模拟异步数据获取
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id: userId, name: '张三', role: '开发者' });
    }, 100);
  });
}

async function demonstrate1() {
  // ❌ 错误写法：忘记 await
  // user 变量是一个 Promise 对象，而不是用户数据
  const user = fetchUserData(1);

  // 尝试访问 Promise 的属性 —— 结果是 undefined
  console.log('[错误] 用户名:', user.name);      // undefined
  console.log('[错误] 用户对象:', user);           // Promise { <pending> }

  // 更隐蔽的问题：在条件判断中使用 Promise
  // Promise 对象总是 truthy，所以这个条件永远为真
  if (user) {
    console.log('[错误] user 存在（但它是 Promise 对象！）');
  }

  // ✅ 正确写法
  const correctUser = await fetchUserData(1);
  console.log('[正确] 用户名:', correctUser.name); // 张三
}

// ============================================================
// 示例 2：Promise.all 中一个失败全部失败
// ============================================================

console.log('\n=== 示例 2：Promise.all 一个失败全部失败 ===\n');

async function fetchUser(id) {
  return { id, name: `用户${id}` };
}

async function fetchPosts(userId) {
  return [{ id: 1, title: '第一篇' }, { id: 2, title: '第二篇' }];
}

async function fetchComments(userId) {
  // 模拟这个接口偶尔失败
  throw new Error('评论服务暂时不可用');
}

async function demonstrate2() {
  // ❌ 错误写法：使用 Promise.all，一个失败导致所有结果丢失
  try {
    const [user, posts, comments] = await Promise.all([
      fetchUser(1),
      fetchPosts(1),
      fetchComments(1)   // 这个失败了
    ]);
    console.log('所有数据:', user, posts, comments); // 不会执行到这里
  } catch (error) {
    // 虽然 user 和 posts 的请求成功了，但结果被丢弃了
    console.log('[错误] Promise.all 失败:', error.message);
    console.log('[错误] 用户数据和文章数据也丢失了！');
  }

  // ✅ 正确写法 A：使用 Promise.allSettled（Node.js 12.9+）
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
  ]);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`[正确] 请求 ${index + 1} 成功:`, JSON.stringify(result.value));
    } else {
      console.log(`[正确] 请求 ${index + 1} 失败:`, result.reason.message);
    }
  });

  // ✅ 正确写法 B：单独处理每个请求的错误
  const user2 = await fetchUser(1).catch(() => null);
  const posts2 = await fetchPosts(1).catch(() => []);
  const comments2 = await fetchComments(1).catch(err => {
    console.log('[正确] 评论加载失败，使用空数组:', err.message);
    return [];
  });
  console.log('[正确] 即使评论失败，其他数据仍然可用:', user2.name, posts2.length);
}

// ============================================================
// 示例 3：循环中的 async/await 串行执行问题
// ============================================================

console.log('\n=== 示例 3：循环中串行 vs 并行 ===\n');

async function fetchItem(id) {
  // 模拟每个请求耗时 200ms
  return new Promise(resolve => {
    setTimeout(() => resolve({ id, data: `数据${id}` }), 200);
  });
}

async function demonstrate3() {
  const ids = [1, 2, 3, 4, 5];

  // ❌ 错误写法：串行执行 —— 每个 await 都在等前一个完成
  console.time('串行执行');
  const serialResults = [];
  for (const id of ids) {
    const item = await fetchItem(id);  // 每次循环等待 200ms
    serialResults.push(item);
  }
  console.timeEnd('串行执行'); // 大约 1000ms（5 × 200ms）
  console.log(`[错误] 串行获取了 ${serialResults.length} 个结果`);

  // ✅ 正确写法 A：并行执行
  console.time('并行执行');
  const parallelResults = await Promise.all(ids.map(id => fetchItem(id)));
  console.timeEnd('并行执行'); // 大约 200ms
  console.log(`[正确] 并行获取了 ${parallelResults.length} 个结果`);

  // ✅ 正确写法 B：需要控制并发数时（如最多同时 2 个请求）
  console.time('受控并行');
  const concurrency = 2;
  const controlledResults = [];
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(id => fetchItem(id)));
    controlledResults.push(...batchResults);
  }
  console.timeEnd('受控并行'); // 大约 600ms（3 批 × 200ms）
  console.log(`[正确] 受控并行获取了 ${controlledResults.length} 个结果`);
}

// ============================================================
// 示例 4：.then() 链中的错误处理遗漏
// ============================================================

console.log('\n=== 示例 4：.then() 链的错误处理遗漏 ===\n');

function validateInput(input) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!input) {
        reject(new Error('输入不能为空'));
      } else {
        resolve(input.trim());
      }
    }, 50);
  });
}

function transformData(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(data.toUpperCase());
    }, 50);
  });
}

function saveToDatabase(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟保存失败
      reject(new Error('数据库连接超时'));
    }, 50);
  });
}

async function demonstrate4() {
  // ❌ 错误写法：.then() 链只在最后有一个 .catch()
  // 问题：如果中间的 .then() 回调抛出错误，可能不会被最后的 .catch() 捕获
  // 特别是当回调中有异步操作但忘记 return Promise 时
  try {
    await validateInput('  hello world  ')
      .then(data => {
        // 这里调用了 transformData 但没有 return！
        // 导致下一个 .then() 收到的是 undefined
        transformData(data); // 缺少 return！
      })
      .then(transformedData => {
        console.log('[错误] transformedData 是:', transformedData); // undefined
        return saveToDatabase(transformedData);
      })
      .catch(error => {
        console.log('[错误] 捕获到错误:', error.message);
      });
  } catch (e) {
    console.log('外层捕获:', e.message);
  }

  // ✅ 正确写法：使用 async/await，错误处理更清晰
  try {
    const validated = await validateInput('  hello world  ');
    const transformed = await transformData(validated);
    console.log('[正确] 转换结果:', transformed);
    await saveToDatabase(transformed);
  } catch (error) {
    console.log('[正确] 捕获到错误:', error.message);
  }
}

// ============================================================
// 示例 5：Promise 构造函数中的反模式
// ============================================================

console.log('\n=== 示例 5：Promise 构造函数反模式 ===\n');

async function demonstrate5() {
  // ❌ 反模式 A：在 Promise 构造函数中使用 async 函数
  // 如果 async 函数抛出错误，Promise 不会自动 catch
  const brokenPromise = new Promise(async (resolve, reject) => {
    // 这里面的错误不会被 Promise 的 .catch() 捕获
    try {
      const data = await fetchItem(1);
      resolve(data);
    } catch (err) {
      reject(err);
    }
    // 如果忘记 try/catch，错误就变成了 unhandledRejection
  });

  // ❌ 反模式 B：Promise 构造函数的 executor 中抛出同步错误
  // 虽然 Promise 会捕获它，但这是不推荐的做法
  const syncErrorPromise = new Promise((resolve, reject) => {
    throw new Error('executor 中的同步错误');
    // resolve('永远不会执行'); // 这行永远不会执行
  });

  try {
    await syncErrorPromise;
  } catch (error) {
    console.log('[示例] 同步错误被 Promise 捕获:', error.message);
  }

  // ❌ 反模式 C：嵌套 Promise（Promise 套 Promise）
  const nestedPromise = new Promise((resolve) => {
    // resolve 里传入另一个 Promise —— 虽然技术上可以工作
    // 但代码可读性差，应该使用 async/await
    resolve(fetchItem(1));
  });

  const nestedResult = await nestedPromise;
  console.log('[示例] 嵌套 Promise 结果:', nestedResult);

  // ✅ 正确写法：直接返回 async 函数的结果
  const correctResult = await fetchItem(1);
  console.log('[正确] 直接 await:', correctResult);
}

// ============================================================
// 运行所有示例
// ============================================================

async function runAllExamples() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║      Promise 常见陷阱示例集          ║');
  console.log('╚══════════════════════════════════════╝');

  await demonstrate1();
  console.log('\n───────────────────────────────');
  await demonstrate2();
  console.log('\n───────────────────────────────');
  await demonstrate3();
  console.log('\n───────────────────────────────');
  await demonstrate4();
  console.log('\n───────────────────────────────');
  await demonstrate5();

  console.log('\n═══════════════════════════════════════');
  console.log('所有示例运行完毕。');
  console.log('回顾每个示例，找出其中的问题并思考修复方案。');
}

// 监听未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[!!!] 未处理的 Promise 拒绝:', reason);
  console.error('这说明代码中有遗漏的错误处理。');
});

runAllExamples();
