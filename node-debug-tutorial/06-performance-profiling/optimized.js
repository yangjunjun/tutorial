'use strict';

/**
 * 数据处理管道 - 优化版本
 *
 * 本文件展示 app.js 中 4 种性能问题的修复方案：
 * 1. 使用 Array.prototype.sort() 代替冒泡排序
 * 2. 使用异步文件 I/O 配合 Promise.all 代替同步阻塞
 * 3. 使用 Array.join() 代替 += 字符串拼接
 * 4. 使用非回溯正则表达式代替灾难性模式
 *
 * 用法：node optimized.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================
// 辅助函数（与 app.js 相同）
// ============================================================

/**
 * 测量函数执行时间
 * @param {string} label - 标签
 * @param {Function} fn - 要测量的函数（同步或异步均可）
 * @returns {Promise<*>} 函数返回值
 */
async function measureTime(label, fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  console.log(`  [${label}] 耗时: ${durationMs.toFixed(2)} ms`);
  return result;
}

/**
 * 生成随机数据
 * @param {number} count - 数据量
 * @returns {Array}
 */
function generateRandomData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      name: `项目_${i}`,
      value: Math.floor(Math.random() * 100000),
      category: `分类_${i % 20}`,
      tags: [`标签_${i % 50}`, `标签_${(i * 3) % 50}`],
    });
  }
  return data;
}

// ============================================================
// 优化 1：使用 Array.prototype.sort()
// ============================================================

/**
 * 使用内置排序 —— 基于 TimSort，O(n log n) 复杂度
 * V8 引擎的内置排序算法高度优化
 * @param {Array} arr - 待排序数组
 * @returns {Array} 排序后的数组
 */
function efficientSort(arr) {
  // 使用内置的 sort 方法，底层是高度优化的 TimSort
  return arr.slice().sort((a, b) => a.value - b.value);
}

/**
 * 优化后的排序阶段
 */
async function stage1_sorting_optimized() {
  console.log('\n--- 阶段 1：数据排序（优化：使用 Array.prototype.sort）---');

  const data = generateRandomData(15000);
  console.log(`  数据量: ${data.length} 条`);

  // 使用内置排序（非常快！）
  const sorted = await measureTime('Array.prototype.sort()', () => {
    return efficientSort(data);
  });

  console.log(`  排序完成，最小值: ${sorted[0].value}, 最大值: ${sorted[sorted.length - 1].value}`);

  console.log('\n  ✓ 优化说明：');
  console.log('    - 内置 sort() 使用 TimSort 算法，O(n log n) 复杂度');
  console.log('    - 冒泡排序是 O(n²)，15000 条数据差距可达 1000 倍以上');
  console.log('    - V8 对 sort() 有深度优化，包括内联缓存和 JIT 编译');

  return sorted;
}

// ============================================================
// 优化 2：使用异步 I/O + Promise.all
// ============================================================

/**
 * 优化后的文件 I/O 阶段
 * 使用异步文件操作 + Promise.all 实现并行处理
 */
async function stage2_asyncIO_optimized() {
  console.log('\n--- 阶段 2：文件 I/O（优化：异步并行）---');

  const tmpDir = path.join(os.tmpdir(), 'perf-demo-opt-' + process.pid);

  // 异步创建临时目录
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const fileCount = 50;
  console.log(`  创建并异步读取 ${fileCount} 个临时文件...`);

  const results = await measureTime('异步文件 I/O + Promise.all', async () => {
    // 第一步：并行写入所有文件
    const writePromises = [];
    for (let i = 0; i < fileCount; i++) {
      const filePath = path.join(tmpDir, `data_${i}.json`);
      const data = JSON.stringify({
        id: i,
        timestamp: Date.now(),
        payload: '数据内容'.repeat(100),
      });
      writePromises.push(fs.promises.writeFile(filePath, data, 'utf-8'));
    }
    await Promise.all(writePromises);

    // 第二步：并行读取所有文件
    const readPromises = [];
    for (let i = 0; i < fileCount; i++) {
      const filePath = path.join(tmpDir, `data_${i}.json`);
      readPromises.push(
        fs.promises.readFile(filePath, 'utf-8').then(
          (content) => JSON.parse(content)
        )
      );
    }
    return Promise.all(readPromises);
  });

  // 异步清理临时文件
  const cleanupPromises = [];
  for (let i = 0; i < fileCount; i++) {
    const filePath = path.join(tmpDir, `data_${i}.json`);
    cleanupPromises.push(fs.promises.unlink(filePath).catch(() => {}));
  }
  await Promise.all(cleanupPromises);
  await fs.promises.rmdir(tmpDir).catch(() => {});

  console.log(`  读取完成，共处理 ${results.length} 个文件`);

  console.log('\n  ✓ 优化说明：');
  console.log('    - 异步 I/O 不阻塞事件循环，多个文件操作可并行执行');
  console.log('    - Promise.all 等待所有操作完成，实现扇出（fan-out）模式');
  console.log('    - 同步版本是串行执行，总时间 = 单次时间 × 文件数');
  console.log('    - 异步并行版本总时间 ≈ 最慢的那次 I/O 操作时间');

  return results;
}

// ============================================================
// 优化 3：使用 Array.join() 或模板字符串数组
// ============================================================

/**
 * 优化后的字符串拼接阶段
 * 使用数组收集片段，最后一次性 join
 */
async function stage3_stringConcat_optimized() {
  console.log('\n--- 阶段 3：字符串拼接（优化：Array.join）---');

  const iterations = 200000;
  console.log(`  迭代次数: ${iterations}`);

  // 优化方式：使用数组收集，最后 join
  const result = await measureTime('Array.push + Array.join', () => {
    const parts = new Array(iterations); // 预分配数组大小

    for (let i = 0; i < iterations; i++) {
      // 每个元素是独立的短字符串，不会触发大字符串复制
      parts[i] = `<div class="item" id="item-${i}">` +
        `<span class="title">项目 ${i}</span>` +
        `<span class="value">${Math.random().toFixed(4)}</span>` +
        `<span class="desc">${'描述文本'.repeat(5)}</span>` +
        `</div>`;
    }

    // 一次性拼接所有片段
    return parts.join('\n');
  });

  console.log(`  生成 HTML 长度: ${result.length} 字符`);

  console.log('\n  ✓ 优化说明：');
  console.log('    - += 拼接：每次都要创建新字符串并复制旧内容，总复杂度 O(n²)');
  console.log('    - Array.join()：收集所有片段后一次性拼接，复杂度 O(n)');
  console.log('    - 预分配数组大小 (new Array(n)) 可避免数组动态扩容的开销');
  console.log('    - 现代 V8 对 += 有一定优化，但 Array.join 仍更可靠');

  return result;
}

// ============================================================
// 优化 4：使用非回溯正则表达式
// ============================================================

/**
 * 优化后的正则匹配阶段
 * 使用避免回溯的正则模式
 */
async function stage4_regex_optimized() {
  console.log('\n--- 阶段 4：正则表达式（优化：避免回溯）---');

  // 原始有问题的正则：/^(a+)+$/
  // 优化方案 1：消除嵌套量词
  const goodRegex1 = /^a+$/;

  // 原始：/^(\d+|\d+\.?\d+)+$/
  // 优化方案 2：使用原子组模拟（JS 不支持原子组，用更精确的模式替代）
  const goodRegex2 = /^\d+(\.\d+)?$/;

  // 原始：/^.*a.*b.*c.*d.*e$/
  // 优化方案 3：使用具体的字符类代替 .*
  const goodRegex3 = /^[^a]*a[^b]*b[^c]*c[^d]*d[^e]*e[^]*$/;

  const dangerousInput = 'a'.repeat(28) + 'b';
  const input2 = '1'.repeat(25) + 'a';
  const input3 = 'x'.repeat(30);

  console.log(`  优化后的正则：`);
  console.log(`    /^(a+)+$/     → /^a+$/`);
  console.log(`    /^(\\d+|\\d+\\.?\\d+)+$/ → /^\\d+(\\.\\d+)?$/`);
  console.log(`    /^.*a.*b.*c.*d.*e$/ → /^[^a]*a[^b]*b.../（具体字符类）\n`);

  // 测试优化后的正则
  await measureTime('优化正则 1（消除嵌套量词）', () => {
    goodRegex1.test(dangerousInput);
  });

  await measureTime('优化正则 2（精确数字模式）', () => {
    goodRegex2.test(input2);
  });

  await measureTime('优化正则 3（具体字符类）', () => {
    goodRegex3.test(input3);
  });

  console.log('\n  ✓ 优化说明：');
  console.log('    - 避免嵌套量词：(a+)+ → a+，消除歧义');
  console.log('    - 使用精确模式：\\d+(\\.\\d+)? 比 (\\d+|\\d+\\.?\\d+) 无歧义');
  console.log('    - 避免贪婪 .*：使用 [^a]* 等限定字符类，避免回溯');
  console.log('    - 工具推荐：使用 safe-regex 包检测潜在的回溯风险');
  console.log('    - 在线工具：https://regex101.com/ 可分析正则复杂度');

  return true;
}

// ============================================================
// 主程序入口
// ============================================================

async function main() {
  console.log('============================================');
  console.log('   数据处理管道 - 优化版本');
  console.log('============================================');
  console.log(`进程 PID: ${process.pid}\n`);

  const totalStart = process.hrtime.bigint();

  // 阶段 1：排序（优化）
  await stage1_sorting_optimized();

  // 阶段 2：文件 I/O（优化）
  await stage2_asyncIO_optimized();

  // 阶段 3：字符串拼接（优化）
  await stage3_stringConcat_optimized();

  // 阶段 4：正则（优化）
  await stage4_regex_optimized();

  // 总耗时
  const totalEnd = process.hrtime.bigint();
  const totalMs = Number(totalEnd - totalStart) / 1e6;

  console.log('\n============================================');
  console.log(`总耗时: ${totalMs.toFixed(2)} ms`);
  console.log('============================================');

  console.log('\n优化总结：');
  console.log('┌─────────────┬──────────────────┬─────────────────────┐');
  console.log('│ 问题类型     │ 原始方案          │ 优化方案             │');
  console.log('├─────────────┼──────────────────┼─────────────────────┤');
  console.log('│ 排序         │ 冒泡排序 O(n²)    │ Array.sort() O(nlogn)│');
  console.log('│ 文件 I/O     │ 同步串行          │ 异步并行 Promise.all │');
  console.log('│ 字符串拼接   │ += 循环拼接       │ Array.push + join    │');
  console.log('│ 正则表达式   │ 嵌套量词/.*      │ 精确无歧义模式       │');
  console.log('└─────────────┴──────────────────┴─────────────────────┘');

  console.log('\n对比方法：');
  console.log('  node app.js        # 运行有性能问题的版本');
  console.log('  node optimized.js  # 运行优化版本');
  console.log('  对比两者的总耗时差异');
}

// 运行主程序
main().catch((err) => {
  console.error('发生错误:', err);
  process.exit(1);
});
