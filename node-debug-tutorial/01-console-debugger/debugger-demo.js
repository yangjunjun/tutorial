// ============================================================
// debugger 语句演示 - 用 node inspect 调试
// 运行方式: node inspect debugger-demo.js
//
// 常用调试命令：
//   c / cont      继续执行到下一个断点
//   n / next      执行下一行（不进入函数）
//   s / step      步入函数内部
//   o / out       步出当前函数
//   repl          进入 REPL 模式（可执行任意表达式）
//   watch('n')    监控变量 n
//   watchers      查看所有监控变量的当前值
//   setBreakpoint(行号)  在指定行设置断点
//   sb(行号)      setBreakpoint 的缩写
//   clearBreakpoint(行号) 清除断点
//   bt            打印调用栈（backtrace）
//   list(5)       显示当前行前后各5行代码
// ============================================================

// ----- 示例 1：有 bug 的递归斐波那契 -----

/**
 * 递归计算第 n 个斐波那契数
 * 斐波那契数列: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...
 *   F(0) = 0
 *   F(1) = 1
 *   F(n) = F(n-1) + F(n-2)
 *
 * 已知 bug：存在 off-by-one 错误，fibonacci(5) 应该返回 5，
 * 但实际返回值不正确。请使用 debugger 追踪每一步来找到 bug。
 */
function fibonacci(n) {
  // 在这里设置调试器断点，观察 n 的变化
  debugger;

  // Bug 在这里！off-by-one 错误
  // 正确的终止条件应该是 n <= 1（即 n===0 返回 0，n===1 返回 1）
  if (n === 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  // Bug：这里应该是 fibonacci(n-1) + fibonacci(n-2)
  // 但写成了 fibonacci(n-1) + fibonacci(n-3)，导致结果错误
  return fibonacci(n - 1) + fibonacci(n - 3);
}

// ----- 示例 2：数组处理函数 -----

/**
 * 找出数组中的最大值和最小值
 * 预期返回 { max: number, min: number }
 */
function findMinMax(arr) {
  debugger;

  if (arr.length === 0) {
    return { max: null, min: null };
  }

  let max = arr[0];
  let min = arr[0];

  // 在这里设置断点，观察循环中 max 和 min 的变化
  for (let i = 1; i < arr.length; i++) {
    debugger;

    // 故意写反了比较逻辑，请在调试时观察这个 bug
    if (arr[i] < max) {  // 应该是 arr[i] > max
      max = arr[i];
    }
    if (arr[i] > min) {  // 应该是 arr[i] < min
      min = arr[i];
    }
  }

  return { max, min };
}

/**
 * 将字符串反转
 * 预期: "hello" -> "olleh"
 */
function reverseString(str) {
  debugger;

  let result = '';
  // Bug：循环条件错误，应该是 i >= 0
  for (let i = str.length - 1; i > 0; i--) {
    result += str[i];
  }
  return result;
}

// ----- 示例 3：带回调的异步调试 -----

/**
 * 模拟异步数据处理管道
 */
function processData(data, callback) {
  debugger;

  setTimeout(function step1() {
    // 第一步：过滤无效数据
    const filtered = data.filter(function(item) {
      return item > 0;
    });

    setTimeout(function step2() {
      // 第二步：计算总和
      const sum = filtered.reduce(function(acc, val) {
        return acc + val;
      }, 0);

      setTimeout(function step3() {
        // 第三步：计算平均值
        // Bug：用了原始数组长度而不是过滤后的长度
        const avg = sum / data.length;  // 应该是 filtered.length
        debugger;
        callback(avg);
      }, 100);
    }, 100);
  }, 100);
}

// ----- 主程序 -----

console.log('=== debugger 语句调试演示 ===\n');
console.log('请用 node inspect debugger-demo.js 运行本文件\n');

// 测试 1: 斐波那契
console.log('--- 测试斐波那契数列 ---');
console.log('期望: fibonacci(5) = 5');
const fib5 = fibonacci(5);
console.log('实际: fibonacci(5) =', fib5);
console.log('结果', fib5 === 5 ? '正确 ✓' : '错误 ✗');

console.log('\n期望: fibonacci(10) = 55');
const fib10 = fibonacci(10);
console.log('实际: fibonacci(10) =', fib10);
console.log('结果', fib10 === 55 ? '正确 ✓' : '错误 ✗');

// 测试 2: 最大值最小值
console.log('\n--- 测试最大值最小值 ---');
const testArr = [3, 7, 1, 9, 4, 6, 2, 8, 5];
console.log('输入数组:', testArr);
console.log('期望: max=9, min=1');
const minMax = findMinMax(testArr);
console.log('实际:', minMax);

// 测试 3: 字符串反转
console.log('\n--- 测试字符串反转 ---');
const original = 'hello world';
console.log('输入:', original);
console.log('期望:', original.split('').reverse().join(''));
const reversed = reverseString(original);
console.log('实际:', reversed);

// 测试 4: 异步数据处理
console.log('\n--- 测试异步数据处理 ---');
const rawData = [10, -5, 20, -3, 15, -8, 12];
console.log('输入数据:', rawData);
console.log('正数: [10, 20, 15, 12]，期望平均值: 14.25');
processData(rawData, function(avg) {
  console.log('实际平均值:', avg);
  console.log('结果', avg === 14.25 ? '正确 ✓' : '错误 ✗');
});

// ============================================================
// 调试练习指引：
//
// 1. 运行 node inspect debugger-demo.js
// 2. 程序会在第一个 debugger; 语句处暂停
// 3. 输入 watch('n') 监控 n 的值
// 4. 输入 c 继续执行，观察每次递归时 n 的变化
// 5. 输入 bt 查看调用栈深度
// 6. 思考：为什么 fibonacci(5) 的结果不对？
// 7. 输入 repl 进入 REPL，试试 fibonacci(3) 看看返回值
//
// 对于 findMinMax 函数：
// 1. 在循环内的 debugger; 处暂停时
// 2. 用 watch('max') 和 watch('min') 监控变量
// 3. 用 n 逐步执行，观察比较逻辑是否正确
//
// 对于异步函数 processData：
// 1. 观察三个 setTimeout 的嵌套调用
// 2. 在 step3 的 debugger; 处检查 data.length vs filtered.length
// ============================================================
