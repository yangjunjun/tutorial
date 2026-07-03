/**
 * 并发文件下载器模拟器
 *
 * 模拟多个文件的并发下载，包含并发控制、进度追踪等功能。
 * 故意包含若干 bug 用于练习异步调试技巧。
 *
 * 运行方式：
 *   node app.js
 *   node --unhandled-rejections=strict app.js
 *   NODE_DEBUG=downloader:* node app.js
 */

const { debuglog } = require('util');

// 创建条件调试日志，仅在 NODE_DEBUG=downloader:* 时输出
const debug = debuglog('downloader:core');
const progressDebug = debuglog('downloader:progress');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  maxConcurrency: 3,    // 最大并发下载数
  speedVariance: 500,   // 下载速度波动范围（毫秒）
  failureRate: 0.2      // 模拟下载失败的概率
};

// ============================================================
// 模拟文件列表
// ============================================================

const FILES = [
  { name: 'report.pdf',       size: 2048, estimatedTime: 1000 },
  { name: 'photo.jpg',        size: 5120, estimatedTime: 2000 },
  { name: 'data.csv',         size: 1024, estimatedTime: 500 },
  { name: 'backup.zip',       size: 10240, estimatedTime: 4000 },
  { name: 'config.json',      size: 256, estimatedTime: 200 },
  { name: 'video.mp4',        size: 20480, estimatedTime: 6000 },
  { name: 'readme.txt',       size: 128, estimatedTime: 100 },
  { name: 'database.sql',     size: 8192, estimatedTime: 3000 }
];

// ============================================================
// 下载进度追踪器
// ============================================================

class ProgressTracker {
  constructor(totalFiles) {
    this.totalFiles = totalFiles;
    this.completedCount = 0;
    this.failedCount = 0;
    this.downloadedBytes = 0;
    this.startTime = Date.now();
  }

  /**
   * 记录一个文件下载完成
   * BUG 1：竞态条件 —— 多个异步操作同时读写这些计数器
   * 当两个下载几乎同时完成时，可能读到相同的 completedCount 值
   * 导致最终计数不准确
   */
  onFileComplete(file) {
    // 先读取当前值
    const current = this.completedCount;

    // 模拟一些处理耗时（放大了竞态条件的窗口）
    const temp = current;

    // 写入新值（如果另一个下载也读到了相同的 current，就会丢失一次计数）
    this.completedCount = temp + 1;
    this.downloadedBytes += file.size;

    progressDebug(
      '完成: %s, 当前进度: %d/%d',
      file.name, this.completedCount, this.totalFiles
    );

    this.printProgress(file.name, true);
  }

  /**
   * 记录一个文件下载失败
   */
  onFileFailed(file, error) {
    this.failedCount++;
    console.log(`  [失败] ${file.name} - ${error.message}`);
  }

  /**
   * 打印进度条
   */
  printProgress(currentFile, success) {
    const total = this.completedCount + this.failedCount;
    const percent = Math.round((total / this.totalFiles) * 100);
    const barLength = 30;
    const filled = Math.round((percent / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    console.log(`  [${bar}] ${percent}% (${total}/${this.totalFiles}) - ${currentFile}`);
  }

  /**
   * 打印最终统计
   */
  printSummary() {
    const elapsed = Date.now() - this.startTime;
    const totalBytes = this.downloadedBytes;
    const speed = (totalBytes / (elapsed / 1000) / 1024).toFixed(1);

    console.log('');
    console.log('下载完成统计');
    console.log('═'.repeat(40));
    console.log(`  总文件数:     ${this.totalFiles}`);
    console.log(`  成功:         ${this.completedCount}`);
    console.log(`  失败:         ${this.failedCount}`);
    console.log(`  下载总量:     ${(totalBytes / 1024).toFixed(1)} KB`);
    console.log(`  耗时:         ${(elapsed / 1000).toFixed(1)} 秒`);
    console.log(`  平均速度:     ${speed} KB/s`);

    // BUG 2：completedCount + failedCount 可能不等于 totalFiles
    // 这是因为竞态条件导致计数不准确
    if (this.completedCount + this.failedCount !== this.totalFiles) {
      console.log(`  [!] 警告：计数不匹配！完成(${this.completedCount}) + 失败(${this.failedCount}) = ${this.completedCount + this.failedCount}，但总数是 ${this.totalFiles}`);
    }
  }
}

// ============================================================
// 下载器
// ============================================================

/**
 * 模拟下载单个文件
 * @param {Object} file - 文件信息 { name, size, estimatedTime }
 * @returns {Promise<Object>} 下载结果
 */
function downloadFile(file) {
  debug('开始下载: %s (大小: %d KB)', file.name, file.size);

  return new Promise((resolve, reject) => {
    // 添加随机速度波动，使下载时间不完全确定
    const variance = (Math.random() - 0.5) * CONFIG.speedVariance;
    const downloadTime = Math.max(100, file.estimatedTime + variance);

    setTimeout(() => {
      // 模拟随机下载失败
      if (Math.random() < CONFIG.failureRate) {
        // BUG 3：其中一种错误情况没有创建 Error 对象
        // 这会导致后续的 error.message 访问出错
        if (file.name === 'video.mp4') {
          reject('网络连接超时');  // 应该 reject(new Error('网络连接超时'))
        } else {
          reject(new Error(`下载 ${file.name} 失败: 服务器错误`));
        }
        return;
      }

      debug('下载完成: %s, 耗时: %dms', file.name, downloadTime);
      resolve({
        file: file,
        downloadTime: downloadTime,
        success: true
      });
    }, downloadTime);
  });
}

/**
 * 带并发控制的批量下载
 * @param {Array} files - 文件列表
 * @param {number} concurrency - 最大并发数
 * @param {ProgressTracker} tracker - 进度追踪器
 */
async function downloadAll(files, concurrency, tracker) {
  console.log(`\n开始下载 ${files.length} 个文件（最大并发: ${concurrency}）\n`);

  // 将文件分成批次
  const batches = [];
  for (let i = 0; i < files.length; i += concurrency) {
    batches.push(files.slice(i, i + concurrency));
  }

  debug('共 %d 个批次', batches.length);

  // BUG 4：使用 for...of 串行处理批次（每个批次之间是串行的）
  // 但批次内部是并行的 —— 这导致并发控制不精确
  // 更好的实现应该是维护一个固定大小的"下载池"
  for (const batch of batches) {
    const promises = batch.map(file => {
      return downloadFile(file)
        .then(result => {
          tracker.onFileComplete(result.file);
          return result;
        })
        .catch(error => {
          // BUG 5：当 error 是字符串而非 Error 对象时
          // error.message 会是 undefined
          tracker.onFileFailed(file, error);
        });
    });

    // BUG 6：缺少 await！这个 Promise.all 没有被等待
    // 导致所有批次几乎是同时启动的，并发控制形同虚设
    Promise.all(promises);
  }

  // 因为上面的 Promise.all 没有被 await，这里会立即执行
  // tracker.printSummary() 在所有下载完成之前就运行了
  // 修复：在 Promise.all 前加 await，或者收集所有 promise 最后统一 await
  tracker.printSummary();
}

// ============================================================
// 重试机制
// ============================================================

/**
 * 带重试的下载
 * @param {Object} file - 文件信息
 * @param {number} maxRetries - 最大重试次数
 */
async function downloadWithRetry(file, maxRetries) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debug('尝试下载 %s (第 %d 次)', file.name, attempt);
      const result = await downloadFile(file);
      return result;
    } catch (error) {
      lastError = error;
      console.log(`  [重试] ${file.name} 第 ${attempt} 次尝试失败: ${error.message || error}`);

      // 等待一段时间后重试（指数退避）
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${file.name} 在 ${maxRetries} 次重试后仍然失败: ${lastError.message || lastError}`);
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║       并发文件下载器模拟器           ║');
  console.log('╚══════════════════════════════════════╝');

  const tracker = new ProgressTracker(FILES.length);

  try {
    await downloadAll(FILES, CONFIG.maxConcurrency, tracker);
  } catch (error) {
    console.error('下载过程中发生未捕获的错误:', error);
  }

  // BUG 7：未处理的 Promise 拒绝
  // 这个 Promise 会被 reject 但没有人 catch 它
  // 在 --unhandled-rejections=strict 模式下会导致进程崩溃
  checkDiskSpace().then(space => {
    console.log(`剩余磁盘空间: ${space} MB`);
  });
  // 缺少 .catch() 处理！
}

/**
 * 模拟磁盘空间检查 —— 总是失败
 */
function checkDiskSpace() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('无法检查磁盘空间: 权限不足'));
    }, 500);
  });
}

// 监听未处理的 Promise 拒绝（演示 BUG 7 的效果）
// 在生产代码中应该修复 Promise 链的错误处理，而不是依赖全局监听器
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[!!!] 检测到未处理的 Promise 拒绝！');
  console.error('  错误信息:', reason.message || reason);
  console.error('  这说明代码中有 Promise 链缺少 .catch() 处理。');
  console.error('  提示：查看 main() 函数中的 checkDiskSpace() 调用。\n');
  console.error('  使用 --unhandled-rejections=strict 运行时，此错误会导致进程崩溃。');
});

// 启动下载器
main();
