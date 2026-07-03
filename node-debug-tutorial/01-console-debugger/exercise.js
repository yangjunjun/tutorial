// ============================================================
// 调试练习 - 找出以下三个函数中的 bug
// 运行方式: node exercise.js
//
// 每个函数都有明确的预期行为说明，但代码中隐藏了 bug。
// 请使用 console.log、console.table、console.trace、
// console.assert、debugger; 等工具来定位并修复它们。
//
// 提示：先用 node exercise.js 运行观察输出，
// 然后用 node inspect exercise.js 进行逐步调试。
// ============================================================

// ============================================================
// 练习 1：计算数组平均值
// ============================================================

/**
 * 计算数组中所有数字的平均值
 *
 * 预期行为：
 *   calculateAverage([10, 20, 30]) 应该返回 20
 *   calculateAverage([1, 2, 3, 4, 5]) 应该返回 3
 *   calculateAverage([100]) 应该返回 100
 *   calculateAverage([]) 应该返回 0
 */
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;

  let sum = 0;
  // 遍历数组求和
  for (let i = 0; i <= numbers.length; i++) {  // 提示：检查循环边界
    sum += numbers[i];
  }

  const average = sum / numbers.length;
  return average;
}

// 测试练习 1
console.log('=== 练习 1：计算平均值 ===\n');

console.log('测试 1.1: calculateAverage([10, 20, 30])');
console.log('期望: 20');
try {
  const result1 = calculateAverage([10, 20, 30]);
  console.log('实际:', result1);
  console.log('状态:', result1 === 20 ? '通过' : '失败');
} catch (e) {
  console.log('错误:', e.message);
}

console.log('\n测试 1.2: calculateAverage([1, 2, 3, 4, 5])');
console.log('期望: 3');
try {
  const result2 = calculateAverage([1, 2, 3, 4, 5]);
  console.log('实际:', result2);
  console.log('状态:', result2 === 3 ? '通过' : '失败');
} catch (e) {
  console.log('错误:', e.message);
}

console.log('\n测试 1.3: calculateAverage([100])');
console.log('期望: 100');
try {
  const result3 = calculateAverage([100]);
  console.log('实际:', result3);
  console.log('状态:', result3 === 100 ? '通过' : '失败');
} catch (e) {
  console.log('错误:', e.message);
}

console.log('\n测试 1.4: calculateAverage([])');
console.log('期望: 0');
try {
  const result4 = calculateAverage([]);
  console.log('实际:', result4);
  console.log('状态:', result4 === 0 ? '通过' : '失败');
} catch (e) {
  console.log('错误:', e.message);
}


// ============================================================
// 练习 2：过滤数组（不应修改原数组）
// ============================================================

/**
 * 过滤出数组中大于阈值的元素
 *
 * 预期行为：
 *   - 返回一个新数组，包含所有大于 threshold 的元素
 *   - 不修改原始数组（纯函数）
 *   - filterAboveThreshold([1, 5, 3, 8, 2], 4) 应该返回 [5, 8]
 *   - 原始数组 [1, 5, 3, 8, 2] 应保持不变
 */
function filterAboveThreshold(arr, threshold) {
  // 提示：检查这个函数是否真的没有修改原数组
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > threshold) {
      result.push(arr[i]);
    } else {
      // 删除不满足条件的元素
      arr.splice(i, 1);  // 提示：splice 会修改原数组！
      i--;  // 调整索引以应对数组变化
    }
  }
  return result;
}

// 测试练习 2
console.log('\n=== 练习 2：过滤数组 ===\n');

const originalArray = [1, 5, 3, 8, 2, 7, 4, 9, 6];
console.log('原始数组:', JSON.stringify(originalArray));
console.log('期望: 原始数组保持不变 [1, 5, 3, 8, 2, 7, 4, 9, 6]');
console.log('期望: 过滤结果 [5, 8, 7, 9, 6]\n');

const copyForDisplay = [...originalArray]; // 保存副本用于展示
const filtered = filterAboveThreshold(originalArray, 4);

console.log('过滤结果:', JSON.stringify(filtered));
console.log('原始数组（调用后）:', JSON.stringify(originalArray));
console.log('原始数组是否被修改:', JSON.stringify(originalArray) !== JSON.stringify(copyForDisplay) ? '是（这是 bug！）' : '否');

console.log('\n测试 2.2: 连续调用');
const testArr2 = [10, 1, 20, 2, 30];
console.log('原始数组:', JSON.stringify(testArr2));
const first = filterAboveThreshold(testArr2, 5);
console.log('第一次过滤 (>5):', JSON.stringify(first));
console.log('原始数组（第一次后）:', JSON.stringify(testArr2));
const second = filterAboveThreshold(testArr2, 15);
console.log('第二次过滤 (>15):', JSON.stringify(second));
console.log('原始数组（第二次后）:', JSON.stringify(testArr2));


// ============================================================
// 练习 3：日期格式化
// ============================================================

/**
 * 将 Date 对象格式化为 "YYYY-MM-DD HH:mm:ss" 格式
 *
 * 预期行为：
 *   - 输入: new Date(2024, 0, 15, 9, 5, 30)  （注意：月份从 0 开始）
 *   - 输出: "2024-01-15 09:05:30"
 *   - 月份和日期、时分秒都应补齐前导零
 *   - 月份显示应该是 1-12（人类可读），而非 0-11
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();       // 提示：getMonth() 返回 0-11
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // 补齐前导零的辅助函数
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // 提示：month 这里直接用 getMonth() 的值，需要 +1 才是人类可读的月份
  return year + '-' + pad(month) + '-' + pad(day) + ' ' +
         pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

// 测试练习 3
console.log('\n=== 练习 3：日期格式化 ===\n');

// 测试用例 1: 2024年1月15日 09:05:30
const date1 = new Date(2024, 0, 15, 9, 5, 30);
console.log('测试 3.1: new Date(2024, 0, 15, 9, 5, 30)');
console.log('期望: "2024-01-15 09:05:30"');
const result1 = formatDate(date1);
console.log('实际: "' + result1 + '"');
console.log('状态:', result1 === '2024-01-15 09:05:30' ? '通过' : '失败');

// 测试用例 2: 2023年12月31日 23:59:59
const date2 = new Date(2023, 11, 31, 23, 59, 59);
console.log('\n测试 3.2: new Date(2023, 11, 31, 23, 59, 59)');
console.log('期望: "2023-12-31 23:59:59"');
const result2 = formatDate(date2);
console.log('实际: "' + result2 + '"');
console.log('状态:', result2 === '2023-12-31 23:59:59' ? '通过' : '失败');

// 测试用例 3: 2024年3月1日 00:00:00
const date3 = new Date(2024, 2, 1, 0, 0, 0);
console.log('\n测试 3.3: new Date(2024, 2, 1, 0, 0, 0)');
console.log('期望: "2024-03-01 00:00:00"');
const result3 = formatDate(date3);
console.log('实际: "' + result3 + '"');
console.log('状态:', result3 === '2024-03-01 00:00:00' ? '通过' : '失败');

// ============================================================
// 总结
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('调试建议');
console.log('='.repeat(60));
console.log(`
1. 练习 1（平均值）：
   - 用 console.log 在循环中打印 i 和 numbers[i]
   - 观察当 i === numbers.length 时会发生什么
   - 用 node inspect exercise.js 在循环处设置断点

2. 练习 2（数组过滤）：
   - 用 console.table 在每次循环前后打印 arr
   - 检查 splice() 方法是否修改了传入的数组
   - 思考：如何在不修改原数组的情况下实现过滤？

3. 练习 3（日期格式化）：
   - 用 console.log 打印 getMonth() 的返回值
   - 注意 JavaScript Date 的月份是从 0 开始计数的
   - 用 console.assert(month >= 1 && month <= 12) 验证月份范围
`);
