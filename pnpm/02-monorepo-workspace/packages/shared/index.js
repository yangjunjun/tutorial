// 模拟一些底层的通用函数，供其他应用调用
function add(a, b) {
  return a + b + " (来自 shared 包的魔改)";
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 导出模块
module.exports = {
  add,
  formatDate
};
