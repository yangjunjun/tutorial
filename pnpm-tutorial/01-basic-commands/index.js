// 引用 lodash 模块（在 package.json 中明确声明了该依赖）
const _ = require('lodash');

console.log('🎉 恭喜你，01-basic-commands 项目运行成功！');

// 示例 1: 使用 lodash 做一个数组的分块
const array = ['a', 'b', 'c', 'd'];
const chunked = _.chunk(array, 2);
console.log('🔹 lodash.chunk 演示：', chunked); // 预期输出: [ ['a', 'b'], ['c', 'd'] ]

// 示例 2: 使用 lodash 随机获取一个数组元素
const randomElement = _.sample(array);
console.log('🔹 lodash.sample 演示：随机获取的元素是 ->', randomElement);

console.log('\n💡 思考：试着在代码里加上 const axios = require("axios")，然后不运行 pnpm add axios 直接运行 node index.js，看看会发生什么？');
