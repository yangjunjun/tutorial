'use strict';

/**
 * 数据处理管道 - 有性能问题的版本
 *
 * 本文件包含 4 种常见的性能问题：
 * 1. CPU 密集：使用冒泡排序代替内置排序
 * 2. 同步 I/O：循环中同步文件读写阻塞事件循环
 * 3. 低效字符串拼接：循环中使用 += 拼接大量字符串
 * 4. 正则回溯：使用有灾难性回溯风险的正则表达式
 *
 * 用法：node app.js
 *
 * 提示：可以配合 --prof 或 --cpu-prof 进行性能分析
 *   node --prof app.js
 *   node --cpu-prof app.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================
// 辅助函数
// ============================================================

/**
 * 测量函数执行时间
 * @param {string} label - 标签
 * @param {Function} fn - 要测量的函数
 * @returns {*} 函数返回值
 */
function measureTime(label, fn) {
  const start = process.hrtime.bigint();
  const result = fn();
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
// 问题 1：CPU 密集 - 冒泡排序（应使用 Array.prototype.sort）
// ============================================================

/**
 * 冒泡排序 —— O(n²) 复杂度
 * 这是一个 CPU 密集操作，会长时间阻塞事件循环
 * @param {Array} arr - 待排序数组
 * @returns {Array} 排序后的数组
 */
function bubbleSort(arr) {
  const n = arr.length;
  const result = arr.slice(); // 复制一份

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (result[j].value > result[j + 1].value) {
        // 交换元素
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
      }
    }
  }

  return result;
}

/**
 * 演示 CPU 密集型排序问题
 */
function stage1_sorting() {
  console.log('\n--- 阶段 1：数据排序（冒泡排序 vs 内置排序）---');

  // 生成 15000 条随机数据
  const data = generateRandomData(15000);
  console.log(`  数据量: ${data.length} 条`);

  // 使用冒泡排序（非常慢！）
  const sorted = measureTime('冒泡排序', () => {
    return bubbleSort(data);
  });

  console.log(`  排序完成，最小值: ${sorted[0].value}, 最大值: ${sorted[sorted.length - 1].value}`);
  return sorted;
}

// ============================================================
// 问题 2：同步 I/O - 循环中同步读写文件
// ============================================================

/**
 * 演示同步 I/O 阻塞问题
 * 创建临时文件并同步读取，模拟逐文件处理
 */
function stage2_syncIO() {
  console.log('\n--- 阶段 2：文件 I/O（同步阻塞）---');

  const tmpDir = path.join(os.tmpdir(), 'perf-demo-' + process.pid);

  // 创建临时目录
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const fileCount = 50;
  console.log(`  创建并同步读取 ${fileCount} 个临时文件...`);

  const results = measureTime('同步文件 I/O', () => {
    const contents = [];

    for (let i = 0; i < fileCount; i++) {
      const filePath = path.join(tmpDir, `data_${i}.json`);

      // 同步写入文件
      const data = JSON.stringify({
        id: i,
        timestamp: Date.now(),
        payload: '数据内容'.repeat(100), // 约 800 字节
      });
      fs.writeFileSync(filePath, data, 'utf-8');

      // 同步读取文件
      const content = fs.readFileSync(filePath, 'utf-8');
      contents.push(JSON.parse(content));
    }

    return contents;
  });

  // 清理临时文件
  for (let i = 0; i < fileCount; i++) {
    const filePath = path.join(tmpDir, `data_${i}.json`);
    try { fs.unlinkSync(filePath); } catch (_e) { /* 忽略 */ }
  }
  try { fs.rmdirSync(tmpDir); } catch (_e) { /* 忽略 */ }

  console.log(`  读取完成，共处理 ${results.length} 个文件`);
  return results;
}

// ============================================================
// 问题 3：低效字符串拼接
// ============================================================

/**
 * 演示循环中使用 += 拼接字符串的性能问题
 * 在大量迭代中，字符串的不可变性导致反复创建新字符串对象
 */
function stage3_stringConcat() {
  console.log('\n--- 阶段 3：字符串拼接（低效 += 操作）---');

  const iterations = 200000;
  console.log(`  迭代次数: ${iterations}`);

  // 低效方式：使用 += 拼接
  const result1 = measureTime('字符串 += 拼接', () => {
    let html = '';
    for (let i = 0; i < iterations; i++) {
      // 每次迭代都创建新字符串并拼接
      // 字符串越长，复制开销越大（O(n²) 总复杂度）
      html += `<div class="item" id="item-${i}">`;
      html += `  <span class="title">项目 ${i}</span>`;
      html += `  <span class="value">${Math.random().toFixed(4)}</span>`;
      html += `  <span class="desc">${'描述文本'.repeat(5)}</span>`;
      html += `</div>\n`;
    }
    return html;
  });

  console.log(`  生成 HTML 长度: ${result1.length} 字符`);
  return result1;
}

// ============================================================
// 问题 4：正则表达式灾难性回溯（ReDoS）
// ============================================================

/**
 * 演示正则表达式的灾难性回溯问题
 * 某些正则模式在特定输入上会导致指数级时间复杂度
 */
function stage4_regexBacktracking() {
  console.log('\n--- 阶段 4：正则表达式回溯（ReDoS）---');

  // 有问题的正则表达式：嵌套量词导致回溯
  // 模式 (a+)+ 在匹配失败时会产生 2^n 级别的回溯
  const badRegex = /^(a+)+$/;

  // 构造一个"几乎匹配"的输入（末尾有一个不匹配字符）
  // 输入越长，回溯越严重
  const dangerousInput = 'a'.repeat(28) + 'b';

  console.log(`  正则: ${badRegex}`);
  console.log(`  输入: "a" x ${dangerousInput.length - 1} + "b" (长度: ${dangerousInput.length})`);
  console.log(`  注意：这会导致指数级回溯！\n`);

  // 使用较短的输入避免等待太久
  const shortInput = 'a'.repeat(22) + 'b';

  measureTime('灾难性回溯 (长度 22)', () => {
    badRegex.test(shortInput);
  });

  // 演示更多有问题的正则模式
  console.log('\n  其他常见的 ReDoS 模式：');

  // 模式 2：嵌套分组和交替
  const badRegex2 = /^(\d+|\d+\.?\d+)+$/;
  const input2 = '1'.repeat(25) + 'a';

  measureTime('嵌套交替回溯', () => {
    badRegex2.test(input2);
  });

  // 模式 3：过度使用 .* 的嵌套
  const badRegex3 = /^.*a.*b.*c.*d.*e$/;
  const input3 = 'x'.repeat(30);

  measureTime('嵌套 .* 回溯', () => {
    badRegex3.test(input3);
  });

  return true;
}

// ============================================================
// 主程序入口
// ============================================================

if (require.main === module) {
  console.log('============================================');
  console.log('   数据处理管道 - 性能问题版本');
  console.log('============================================');
  console.log(`进程 PID: ${process.pid}`);
  console.log('提示：可使用 --prof 或 --cpu-prof 进行性能分析\n');

  const totalStart = process.hrtime.bigint();

  // 阶段 1：排序（CPU 密集）
  const sortedData = stage1_sorting();

  // 阶段 2：文件 I/O（同步阻塞）
  const fileData = stage2_syncIO();

  // 阶段 3：字符串拼接（低效）
  const htmlOutput = stage3_stringConcat();

  // 阶段 4：正则回溯（ReDoS）
  stage4_regexBacktracking();

  // 总耗时
  const totalEnd = process.hrtime.bigint();
  const totalMs = Number(totalEnd - totalStart) / 1e6;

  console.log('\n============================================');
  console.log(`总耗时: ${totalMs.toFixed(2)} ms`);
  console.log('============================================');
  console.log('\n性能分析建议：');
  console.log('  1. 使用 node --prof app.js 查看各阶段的 CPU 占比');
  console.log('  2. 使用 node --cpu-prof app.js 生成 .cpuprofile 文件');
  console.log('  3. 在 Chrome DevTools 中加载 .cpuprofile 查看火焰图');
  console.log('  4. 运行 node optimized.js 对比优化后的性能');
}

// 导出函数供 optimized.js 和其他文件使用
module.exports = {
  bubbleSort,
  generateRandomData,
  measureTime,
  stage1_sorting,
  stage2_syncIO,
  stage3_stringConcat,
  stage4_regexBacktracking,
};
