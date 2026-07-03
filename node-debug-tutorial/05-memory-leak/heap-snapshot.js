'use strict';

/**
 * 堆快照对比工具
 *
 * 本脚本：
 * 1. 创建一个已知的内存泄漏
 * 2. 在泄漏前获取堆快照
 * 3. 触发泄漏
 * 4. 在泄漏后获取堆快照
 * 5. 将两个快照保存为 .heapsnapshot 文件
 * 6. 打印在 Chrome DevTools 中加载和对比的说明
 *
 * 用法：node heap-snapshot.js
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');

// ============================================================
// 堆快照工具函数
// ============================================================

/**
 * 获取当前堆快照并保存到文件
 * @param {string} filename - 保存的文件名
 * @returns {Promise<void>}
 */
function saveHeapSnapshot(filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.resolve(__dirname, filename);
    console.log(`正在获取堆快照: ${filename} ...`);

    try {
      // v8.getHeapSnapshot() 返回一个可读流
      const snapshotStream = v8.getHeapSnapshot();
      const fileStream = fs.createWriteStream(filepath);

      snapshotStream.pipe(fileStream);

      fileStream.on('finish', () => {
        const stats = fs.statSync(filepath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  快照已保存: ${filepath} (${sizeMB} MB)`);
        resolve();
      });

      fileStream.on('error', reject);
      snapshotStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 打印内存使用信息
 * @param {string} label - 标签
 */
function printMemory(label) {
  const mem = process.memoryUsage();
  console.log(`\n[${label}] 内存使用:`);
  console.log(`  RSS:       ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used:  ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External:   ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
}

// ============================================================
// 制造一个已知的内存泄漏
// ============================================================

/**
 * 模拟一个内存泄漏：创建大量对象并保留引用
 * @returns {Array} 保留引用的数组（泄漏源）
 */
function createLeak() {
  const leakedObjects = [];

  console.log('\n正在制造内存泄漏...');

  for (let i = 0; i < 50000; i++) {
    // 创建一个带有特定类名的对象，方便在快照中识别
    const obj = {
      type: 'LeakedUserRecord',
      id: i,
      name: `用户_${i}`,
      email: `user${i}@example.com`,
      // 模拟较大的数据负载
      address: {
        street: `第 ${i} 条街道`,
        city: `城市_${i % 100}`,
        zipCode: `${10000 + i}`,
        description: '一段较长的地址描述信息'.repeat(10),
      },
      // 模拟订单历史
      orders: Array.from({ length: 10 }, (_, j) => ({
        orderId: `${i}-${j}`,
        product: `产品_${i * 10 + j}`,
        price: Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
      })),
      // 模拟元数据
      metadata: {
        createdAt: new Date().toISOString(),
        tags: [`tag_${i % 50}`, `category_${i % 20}`],
        notes: `关于用户 ${i} 的备注信息，包含一些重复内容`.repeat(5),
      },
    };

    leakedObjects.push(obj);
  }

  console.log(`  已创建 ${leakedObjects.length} 个 LeakedUserRecord 对象`);
  return leakedObjects;
}

// ============================================================
// 主程序
// ============================================================

async function main() {
  console.log('============================================');
  console.log('   堆快照对比工具');
  console.log('============================================\n');

  // 1. 打印初始内存状态
  printMemory('初始状态');

  // 2. 获取泄漏前的堆快照
  console.log('\n--- 步骤 1：获取泄漏前的堆快照 ---');
  await saveHeapSnapshot('snapshot-before.heapsnapshot');
  printMemory('快照前');

  // 3. 触发内存泄漏
  console.log('\n--- 步骤 2：触发内存泄漏 ---');
  const leakedData = createLeak();
  printMemory('泄漏后');

  // 4. 获取泄漏后的堆快照
  console.log('\n--- 步骤 3：获取泄漏后的堆快照 ---');
  await saveHeapSnapshot('snapshot-after.heapsnapshot');
  printMemory('快照后');

  // 5. 打印对比说明
  console.log('\n============================================');
  console.log('   在 Chrome DevTools 中对比堆快照');
  console.log('============================================\n');

  console.log('请按以下步骤操作：\n');

  console.log('方法 1：使用 Chrome DevTools（推荐）');
  console.log('─────────────────────────────────────');
  console.log('1. 打开 Google Chrome 浏览器');
  console.log('2. 打开 DevTools（F12 或 Ctrl+Shift+I）');
  console.log('3. 切换到 Memory 面板');
  console.log('4. 点击 "Load" 按钮');
  console.log(`5. 加载文件: ${path.resolve(__dirname, 'snapshot-before.heapsnapshot')}`);
  console.log('6. 再次点击 "Load" 按钮');
  console.log(`7. 加载文件: ${path.resolve(__dirname, 'snapshot-after.heapsnapshot')}`);
  console.log('8. 选中第二个快照（snapshot-after）');
  console.log('9. 在上方下拉框中选择 "Comparison"');
  console.log('10. 在下方的对象列表中找到 "LeakedUserRecord" 类型');
  console.log('11. 展开查看新增的对象数量和大小\n');

  console.log('方法 2：使用 node --inspect');
  console.log('─────────────────────────────────────');
  console.log('1. 运行: node --inspect your-app.js');
  console.log('2. 在 Chrome 中打开 chrome://inspect');
  console.log('3. 点击 "inspect" 打开 DevTools');
  console.log('4. 在 Memory 面板中实时获取和对比快照\n');

  console.log('方法 3：使用命令行标志');
  console.log('─────────────────────────────────────');
  console.log('  node --heap-prof app.js          # 进程退出时生成 .heapprofile');
  console.log('  node --heapsnapshot-signal=SIGUSR2 app.js  # 信号触发快照\n');

  console.log('提示：在对比视图中，重点关注以下列：');
  console.log('  - # New：新增对象数量');
  console.log('  - Size Delta：内存大小变化');
  console.log('  - 搜索 "LeakedUserRecord" 可以快速定位泄漏对象\n');

  // 保持引用，防止 GC 回收
  console.log(`（保持 ${leakedData.length} 个对象的引用以防止 GC 回收）`);
}

// 运行主程序
main().catch((err) => {
  console.error('发生错误:', err);
  process.exit(1);
});
