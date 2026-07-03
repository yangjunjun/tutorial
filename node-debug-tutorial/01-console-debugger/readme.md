# Console 调试工具完全指南

> Node.js 调试的第一课：用好你的 `console` 和 `debugger`。

---

## 目录

1. [基础输出方法](#1-基础输出方法)
2. [console.table() 表格打印](#2-consoletable-表格打印)
3. [console.time() 计时器](#3-consoletime-计时器)
4. [console.trace() 调用栈追踪](#4-consoletrace-调用栈追踪)
5. [console.group() 分组输出](#5-consolegroup-分组输出)
6. [console.assert() 断言](#6-consoleassert-断言)
7. [console.dir() 查看对象详情](#7-consoledir-查看对象详情)
8. [debugger 语句与 node inspect](#8-debugger-语句与-node-inspect)
9. [练习：调试购物车计算函数](#9-练习调试购物车计算函数)
10. [运行方式](#运行方式)

---

## 1. 基础输出方法

Node.js 提供了四种基础的 console 输出方法，它们的区别在于**输出级别**和**语义含义**：

| 方法 | 用途 | 输出目标 | 终端颜色 |
|------|------|----------|----------|
| `console.log()` | 普通信息输出 | stdout | 默认 |
| `console.info()` | 提示信息（语义上比 log 更"正式"） | stdout | 默认（部分终端显示蓝色图标） |
| `console.warn()` | 警告信息 | stderr | 黄色 |
| `console.error()` | 错误信息 | stderr | 红色 |

**关键区别**：`console.warn` 和 `console.error` 输出到 `stderr`，这意味着它们会被重定向到错误日志中，而 `console.log` 输出到 `stdout`。

```js
console.log('这是一条普通日志');
console.info('这是一条提示信息');
console.warn('这是一条警告信息');
console.error('这是一条错误信息');
```

> **小贴士**：在生产环境中，应该用 `console.error` 来输出错误，这样可以通过 `2>` 重定向错误流到单独的日志文件。

---

## 2. console.table() 表格打印

`console.table()` 可以将数组或对象以**表格形式**打印出来，非常适合查看结构化数据：

```js
// 打印数组
const users = [
  { name: '张三', age: 25, role: 'admin' },
  { name: '李四', age: 30, role: 'user' },
  { name: '王五', age: 28, role: 'user' },
];
console.table(users);

// 只打印指定列
console.table(users, ['name', 'age']);

// 打印对象
const config = {
  database: { host: 'localhost', port: 5432 },
  redis: { host: 'localhost', port: 6379 },
};
console.table(config);
```

---

## 3. console.time() 计时器

`console.time()` 和 `console.timeEnd()` 配合使用，可以测量代码执行时间：

```js
console.time('排序耗时');
// ... 执行一些耗时操作 ...
const arr = Array.from({ length: 100000 }, () => Math.random());
arr.sort((a, b) => a - b);
console.timeEnd('排序耗时');
// 输出: 排序耗时: 25.3ms
```

- 标签名（字符串参数）必须一致才能配对
- 可以同时运行多个计时器
- `console.timeLog()` 可以在不结束计时器的情况下打印当前耗时

---

## 4. console.trace() 调用栈追踪

`console.trace()` 会打印出**从调用点开始的完整函数调用栈**，非常适合排查"这个函数是从哪里被调用的"：

```js
function c() {
  console.trace('追踪调用栈');
}
function b() {
  c();
}
function a() {
  b();
}
a();
```

输出会显示类似：
```
Trace: 追踪调用栈
    at c (app.js:2:11)
    at b (app.js:5:3)
    at a (app.js:8:3)
    at Object.<anonymous> (app.js:10:1)
```

---

## 5. console.group() 分组输出

`console.group()` 和 `console.groupEnd()` 可以将日志分组显示，支持嵌套：

```js
console.group('用户信息');
console.log('姓名: 张三');
console.log('年龄: 25');
console.group('联系方式');
console.log('邮箱: zhangsan@example.com');
console.log('电话: 13800138000');
console.groupEnd(); // 结束"联系方式"分组
console.groupEnd(); // 结束"用户信息"分组
```

`console.groupCollapsed()` 和 `group()` 功能相同，但在 Chrome DevTools 中默认是折叠的。

---

## 6. console.assert() 断言

`console.assert(条件, 消息)` — 当条件为 `false` 时输出错误消息，为 `true` 时什么都不做：

```js
const age = 15;
console.assert(age >= 18, '用户必须年满18岁，当前年龄:', age);
// 输出: Assertion failed: 用户必须年满18岁，当前年龄: 15

console.assert(age > 0, '年龄必须为正数');
// 什么都不输出（条件为 true）
```

> **注意**：`console.assert()` 不会抛出异常，程序会继续执行。如果需要中断程序，请使用 `throw new Error()`。

---

## 7. console.dir() 查看对象详情

`console.dir()` 以可交互的树状结构打印对象，特别适合查看深层嵌套的对象：

```js
const obj = {
  level1: {
    level2: {
      level3: {
        value: '深层数据'
      }
    }
  }
};

// 默认只显示 2 层
console.dir(obj);

// 通过 options 控制显示深度和颜色
console.dir(obj, { depth: null, colors: true });
// depth: null 表示无限展开
// colors: true 表示启用语法高亮
```

---

## 8. debugger 语句与 node inspect

`debugger;` 是一个特殊的 JavaScript 语句，当代码执行到它时：

- 如果正在使用调试器（如 `node inspect`），程序会**暂停**在该行
- 如果没有调试器，这行代码会被**忽略**

### 使用方法

```bash
# 启动调试模式
node inspect debugger-demo.js

# 常用命令：
# c / cont     - 继续执行到下一个断点
# n / next     - 执行下一行（不进入函数）
# s / step     - 步入函数内部
# o / out      - 步出当前函数
# repl         - 进入 REPL 模式，可以执行任意表达式
# watch('x')   - 监控变量 x 的值变化
# setBreakpoint(line) / sb(line) - 在指定行设置断点
```

> **详细用法请参见 `debugger-demo.js` 文件**，配合 `node inspect debugger-demo.js` 运行。

---

## 9. 练习：调试购物车计算函数

在 `exercise.js` 中有三个带 bug 的小函数，请你使用本章学到的调试技巧找出它们：

1. **计算平均值** — 存在 off-by-one 错误
2. **数组过滤** — 意外修改了原始数组
3. **日期格式化** — 格式化结果不正确

### 调试步骤建议

1. 先用 `console.log` 打印输入和输出，观察异常
2. 用 `console.table` 查看数组数据变化
3. 用 `console.trace` 追踪函数调用链
4. 用 `console.assert` 添加断言检查
5. 最后尝试用 `debugger;` + `node inspect` 逐步调试

---

## 运行方式

```bash
# 进入项目目录
cd 01-console-debugger

# 运行主演示文件（展示所有 console 方法）
node app.js

# 运行 debugger 演示（进入调试模式）
node inspect debugger-demo.js

# 运行练习文件（观察 bug 输出）
node exercise.js
```

### 预期输出

**app.js** 运行后会依次演示所有 console 方法的效果，每个部分用分隔线隔开。你会看到：
- 不同级别的日志输出（普通、信息、警告、错误）
- 表格形式的数据展示
- 计时器的毫秒精度输出
- 函数调用栈追踪
- 分组嵌套的日志
- 断言失败时的错误提示
- 对象的深层结构展示
- 最后是一个有 bug 的购物车函数，输出错误的结果

**debugger-demo.js** 需要在 `node inspect` 模式下运行，程序会在 `debugger;` 语句处暂停，你可以逐步执行并观察变量变化。

**exercise.js** 运行后会显示每个函数的错误输出，帮助你定位 bug。
