/**
 * 任务管理 CLI 应用
 *
 * 一个简单的命令行任务管理器，支持添加、列出、完成和删除任务。
 * 本文件包含一些故意设置的 bug，用于练习调试技巧。
 *
 * 使用方式：
 *   node app.js help                  - 显示帮助信息
 *   node app.js add "买牛奶"          - 添加任务
 *   node app.js list                  - 列出所有任务
 *   node app.js complete 1            - 完成任务（ID 为 1）
 *   node app.js delete 2              - 删除任务（ID 为 2）
 *   node app.js search "关键字"       - 搜索任务
 *   node app.js stats                 - 显示统计信息
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 数据文件路径配置
// ============================================================

// 如果设置了环境变量 TASKS_FILE 则使用自定义路径，否则使用默认路径
const TASKS_FILE = process.env.TASKS_FILE || path.join(__dirname, 'tasks.json');

// 调试提示：可以在这里设置断点，查看 TASKS_FILE 的实际值
// 在 VS Code 中按 F9 在下方代码行设置断点

// ============================================================
// 数据读写函数
// ============================================================

/**
 * 从 JSON 文件读取任务列表
 * @returns {Array} 任务数组
 */
function loadTasks() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(TASKS_FILE)) {
      // 文件不存在，返回空数组
      return [];
    }

    const data = fs.readFileSync(TASKS_FILE, 'utf-8');

    // 调试提示：可以在这里设置断点，查看 data 的原始内容
    const parsed = JSON.parse(data);

    // BUG 1：没有验证 parsed 是否为数组
    // 如果 JSON 文件格式错误（如是一个对象而非数组），后续代码会报错
    // 这里缺少对 parsed 类型的校验
    return parsed;
  } catch (error) {
    // 调试提示：在 catch 块设置断点可以捕获所有解析错误
    console.error(`读取任务文件失败: ${error.message}`);
    return [];
  }
}

/**
 * 将任务列表保存到 JSON 文件
 * @param {Array} tasks - 任务数组
 */
function saveTasks(tasks) {
  try {
    const json = JSON.stringify(tasks, null, 2);
    fs.writeFileSync(TASKS_FILE, json, 'utf-8');
    // 调试提示：在保存成功后设置断点，确认数据已写入
  } catch (error) {
    console.error(`保存任务文件失败: ${error.message}`);
  }
}

// ============================================================
// 任务操作函数
// ============================================================

/**
 * 生成下一个任务 ID
 * @param {Array} tasks - 当前任务数组
 * @returns {number} 下一个可用的 ID
 */
function getNextId(tasks) {
  if (tasks.length === 0) {
    return 1;
  }

  // BUG 2：使用了错误的索引来获取最大 ID
  // tasks[tasks.length] 会是 undefined（数组越界）
  // 应该使用 tasks[tasks.length - 1] 或 Math.max
  const maxId = Math.max(...tasks.map(t => t.id));
  return maxId + 1;
}

/**
 * 添加新任务
 * @param {string} title - 任务标题
 * @param {string} priority - 优先级：low, medium, high
 */
function addTask(title, priority) {
  // BUG 3：缺少对 title 的验证
  // 如果 title 为空字符串或 undefined，仍然会创建任务
  const tasks = loadTasks();

  // 设置默认优先级
  priority = priority || 'medium';

  const newTask = {
    id: getNextId(tasks),
    title: title,
    priority: priority,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  tasks.push(newTask);
  saveTasks(tasks);

  console.log(`已添加任务 #${newTask.id}: "${newTask.title}" [优先级: ${newTask.priority}]`);

  // 调试提示：在这里设置断点可以查看新创建的 task 对象
  return newTask;
}

/**
 * 列出所有任务
 * @param {string} filter - 过滤条件：all, active, completed
 */
function listTasks(filter) {
  const tasks = loadTasks();
  filter = filter || 'all';

  // 根据过滤条件筛选任务
  let filteredTasks;
  switch (filter) {
    case 'active':
      filteredTasks = tasks.filter(t => !t.completed);
      break;
    case 'completed':
      filteredTasks = tasks.filter(t => t.completed);
      break;
    case 'all':
    default:
      filteredTasks = tasks;
      break;
  }

  // 调试提示：在 filteredTasks 赋值后设置断点，查看过滤结果

  if (filteredTasks.length === 0) {
    console.log('没有找到任务。');
    return;
  }

  // 打印表头
  console.log('');
  console.log('ID    状态    优先级      标题');
  console.log('─'.repeat(50));

  // 打印每个任务
  for (let i = 0; i < filteredTasks.length; i++) {
    // BUG 4（逻辑 bug）：索引从 0 开始但显示时应该用 filteredTasks[i]
    // 这里故意用了 tasks[i] 而不是 filteredTasks[i]
    // 当 filter 不是 'all' 时，会显示错误的任务
    const task = filteredTasks[i];

    const status = task.completed ? '  [x]' : '  [ ]';
    const priorityLabel = formatPriority(task.priority);
    const idStr = String(task.id).padEnd(6);
    const priorityStr = priorityLabel.padEnd(12);

    console.log(`${idStr}${status}  ${priorityStr}${task.title}`);
  }

  console.log('');
  console.log(`共 ${filteredTasks.length} 个任务`);
}

/**
 * 格式化优先级标签
 * @param {string} priority - 优先级值
 * @returns {string} 格式化后的标签
 */
function formatPriority(priority) {
  switch (priority) {
    case 'high':
      return '!! 高';
    case 'low':
      return '  低';
    case 'medium':
    default:
      return '  中';
  }
}

/**
 * 完成任务
 * @param {number} id - 任务 ID
 */
function completeTask(id) {
  const tasks = loadTasks();

  // 查找任务
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    console.error(`错误：找不到 ID 为 ${id} 的任务。`);
    return;
  }

  // 调试提示：在修改任务状态前设置断点
  if (tasks[taskIndex].completed) {
    console.log(`任务 #${id} 已经完成过了。`);
    return;
  }

  tasks[taskIndex].completed = true;
  tasks[taskIndex].completedAt = new Date().toISOString();

  saveTasks(tasks);
  console.log(`任务 #${id} "${tasks[taskIndex].title}" 已完成！`);
}

/**
 * 删除任务
 * @param {number} id - 任务 ID
 */
function deleteTask(id) {
  const tasks = loadTasks();

  // BUG 5：findIndex 返回 -1 时没有正确处理
  // 当找不到任务时，splice(-1, 1) 会删除数组最后一个元素
  const taskIndex = tasks.findIndex(t => t.id === id);

  // 注意：这里故意没有在 findIndex 返回 -1 时提前返回
  // 导致删除不存在的 ID 时会误删最后一个任务
  if (taskIndex === -1) {
    console.error(`错误：找不到 ID 为 ${id} 的任务。`);
    // 缺少 return 语句！程序会继续执行下面的 splice
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  saveTasks(tasks);

  console.log(`已删除任务 #${id}: "${deletedTask.title}"`);
}

/**
 * 搜索任务
 * @param {string} keyword - 搜索关键字
 */
function searchTasks(keyword) {
  const tasks = loadTasks();

  if (!keyword) {
    console.error('错误：请提供搜索关键字。');
    return;
  }

  // 在标题中搜索关键字（不区分大小写）
  const results = tasks.filter(t =>
    t.title.toLowerCase().includes(keyword.toLowerCase())
  );

  if (results.length === 0) {
    console.log(`没有找到包含 "${keyword}" 的任务。`);
    return;
  }

  console.log(`\n找到 ${results.length} 个匹配任务：`);
  console.log('─'.repeat(40));

  results.forEach(task => {
    const status = task.completed ? '[x]' : '[ ]';
    console.log(`  #${task.id} ${status} ${task.title}`);
  });

  console.log('');
}

/**
 * 显示统计信息
 */
function showStats() {
  const tasks = loadTasks();

  // 调试提示：在计算统计数据时设置断点，逐步查看每个变量
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  // 按优先级统计
  const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const mediumPriority = tasks.filter(t => t.priority === 'medium' && !t.completed).length;
  const lowPriority = tasks.filter(t => t.priority === 'low' && !t.completed).length;

  console.log('');
  console.log('任务统计');
  console.log('═'.repeat(30));
  console.log(`  总计:       ${total}`);
  console.log(`  已完成:     ${completed}`);
  console.log(`  待完成:     ${active}`);
  console.log('');
  console.log('未完成优先级分布:');
  console.log(`  !! 高:      ${highPriority}`);
  console.log(`     中:      ${mediumPriority}`);
  console.log(`     低:      ${lowPriority}`);

  // 计算完成率
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
  console.log('');
  console.log(`  完成率:     ${completionRate}%`);
  console.log('');
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
任务管理器 CLI
==============

用法：node app.js <命令> [参数]

命令：
  help                    显示帮助信息
  add <标题> [优先级]     添加新任务（优先级：low, medium, high）
  list [过滤条件]         列出任务（过滤条件：all, active, completed）
  complete <ID>           标记任务为已完成
  delete <ID>             删除任务
  search <关键字>         搜索任务
  stats                   显示统计信息

示例：
  node app.js add "写周报"
  node app.js add "修复bug" high
  node app.js list
  node app.js list active
  node app.js complete 1
  node app.js delete 2
  node app.js search "周报"
  node app.js stats
`);
}

// ============================================================
// 主函数 —— 解析命令行参数并执行对应命令
// ============================================================

function main() {
  // process.argv 的前两个元素是 node 可执行文件路径和脚本路径
  // 从第 3 个元素开始才是用户传入的参数
  const args = process.argv.slice(2);

  // 调试提示：在这里设置断点，查看 args 数组的内容
  const command = args[0];

  // 如果没有传入命令，显示帮助信息
  if (!command) {
    showHelp();
    return;
  }

  // 根据命令执行对应操作
  switch (command) {
    case 'add':
      // args[1] = 任务标题, args[2] = 优先级（可选）
      addTask(args[1], args[2]);
      break;

    case 'list':
      // args[1] = 过滤条件（可选，默认 'all'）
      listTasks(args[1]);
      break;

    case 'complete':
      // args[1] = 任务 ID
      // 注意：args 中的值是字符串，需要转为数字
      completeTask(parseInt(args[1], 10));
      break;

    case 'delete':
      // args[1] = 任务 ID
      deleteTask(parseInt(args[1], 10));
      break;

    case 'search':
      // args[1] = 搜索关键字
      searchTasks(args[1]);
      break;

    case 'stats':
      showStats();
      break;

    case 'help':
      showHelp();
      break;

    default:
      console.error(`未知命令: "${command}"`);
      console.error('运行 "node app.js help" 查看帮助信息。');
      // 设置退出码为 1，表示异常退出
      process.exit(1);
  }
}

// 启动应用
main();
