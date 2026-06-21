/**
 * 种子数据脚本 - 填充商品、用户和订单测试数据
 *
 * 运行方式: pnpm seed 或 npx ts-node src/seed.ts
 */
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...\n');

  // ========== 清理旧数据 ==========
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ 旧数据已清理\n');

  // ========== 创建用户 ==========
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'zhangsan',
        email: 'zhangsan@example.com',
      },
    }),
    prisma.user.create({
      data: {
        username: 'lisi',
        email: 'lisi@example.com',
      },
    }),
    prisma.user.create({
      data: {
        username: 'wangwu',
        email: 'wangwu@example.com',
      },
    }),
  ]);
  console.log(`✅ 创建了 ${users.length} 个用户`);

  // ========== 创建商品 ==========
  const categories = ['electronics', 'clothing', 'food', 'books', 'sports'];

  const productsData = [
    { name: 'iPhone 15 Pro', price: 8999, stock: 100, category: 'electronics', description: 'Apple 最新旗舰手机', viewCount: 1500, salesCount: 89 },
    { name: 'MacBook Pro 14', price: 14999, stock: 50, category: 'electronics', description: '专业级笔记本电脑', viewCount: 2000, salesCount: 45 },
    { name: 'AirPods Pro 2', price: 1899, stock: 200, category: 'electronics', description: '主动降噪无线耳机', viewCount: 3000, salesCount: 156 },
    { name: 'iPad Air', price: 4799, stock: 80, category: 'electronics', description: '轻薄平板电脑', viewCount: 1200, salesCount: 67 },
    { name: 'Apple Watch Ultra', price: 6499, stock: 30, category: 'electronics', description: '极限运动智能手表', viewCount: 800, salesCount: 23 },
    { name: '运动T恤', price: 199, stock: 500, category: 'clothing', description: '透气速干运动T恤', viewCount: 600, salesCount: 230 },
    { name: '牛仔裤经典款', price: 399, stock: 300, category: 'clothing', description: '经典直筒牛仔裤', viewCount: 450, salesCount: 180 },
    { name: '羽绒服', price: 899, stock: 150, category: 'clothing', description: '白鹅绒保暖羽绒服', viewCount: 900, salesCount: 95 },
    { name: '进口咖啡豆', price: 128, stock: 1000, category: 'food', description: '埃塞俄比亚单品咖啡豆', viewCount: 350, salesCount: 420 },
    { name: '有机绿茶', price: 68, stock: 800, category: 'food', description: '明前龙井有机绿茶', viewCount: 280, salesCount: 350 },
    { name: '坚果礼盒', price: 168, stock: 600, category: 'food', description: '混合坚果礼盒装', viewCount: 500, salesCount: 280 },
    { name: 'JavaScript 高级编程', price: 99, stock: 200, category: 'books', description: 'JS 进阶必读', viewCount: 1800, salesCount: 560 },
    { name: '设计模式', price: 79, stock: 150, category: 'books', description: 'GoF 经典设计模式', viewCount: 1200, salesCount: 340 },
    { name: '算法导论', price: 128, stock: 100, category: 'books', description: '计算机科学经典教材', viewCount: 2500, salesCount: 180 },
    { name: '瑜伽垫', price: 149, stock: 400, category: 'sports', description: 'TPE环保瑜伽垫', viewCount: 700, salesCount: 210 },
    { name: '跑步鞋', price: 599, stock: 250, category: 'sports', description: '专业马拉松跑步鞋', viewCount: 1100, salesCount: 145 },
    { name: '健身哑铃套装', price: 299, stock: 180, category: 'sports', description: '可调节重量哑铃', viewCount: 650, salesCount: 120 },
    { name: '机械键盘', price: 599, stock: 120, category: 'electronics', description: 'Cherry轴机械键盘', viewCount: 950, salesCount: 88 },
    { name: '显示器27寸4K', price: 2999, stock: 60, category: 'electronics', description: 'IPS面板4K显示器', viewCount: 1300, salesCount: 42 },
    { name: '无线充电器', price: 199, stock: 350, category: 'electronics', description: 'Qi无线快充充电板', viewCount: 400, salesCount: 190 },
  ];

  // 使用 createMany 批量创建（高效！）
  const productResult = await prisma.product.createMany({
    data: productsData,
  });
  console.log(`✅ 创建了 ${productResult.count} 个商品`);

  // ========== 创建一些示例订单 ==========
  const ordersData = [
    { orderNo: 'ORD20240101001', totalAmount: 10898, status: 'COMPLETED', userId: users[0].id },
    { orderNo: 'ORD20240101002', totalAmount: 1899, status: 'PAID', userId: users[0].id },
    { orderNo: 'ORD20240102001', totalAmount: 4799, status: 'SHIPPED', userId: users[1].id },
    { orderNo: 'ORD20240102002', totalAmount: 598, status: 'PENDING', userId: users[1].id },
    { orderNo: 'ORD20240103001', totalAmount: 14999, status: 'COMPLETED', userId: users[2].id },
    { orderNo: 'ORD20240103002', totalAmount: 367, status: 'PAID', userId: users[2].id },
    { orderNo: 'ORD20240104001', totalAmount: 2598, status: 'PENDING', userId: users[0].id },
    { orderNo: 'ORD20240104002', totalAmount: 899, status: 'CANCELLED', userId: users[1].id },
  ];

  const ordersResult = await prisma.order.createMany({
    data: ordersData,
  });
  console.log(`✅ 创建了 ${ordersResult.count} 个订单`);

  console.log('\n🎉 种子数据填充完成！');
  console.log('\n测试数据概览:');
  console.log(`  用户: ${users.length} 个`);
  console.log(`  商品: ${productsData.length} 个 (覆盖 ${categories.length} 个分类)`);
  console.log(`  订单: ${ordersData.length} 个 (各种状态)`);
  console.log('\n提示：启动服务后可以使用以下命令测试:');
  console.log('  GET /products       - 商品列表（带缓存）');
  console.log('  GET /products/hot   - 热门商品');
  console.log('  GET /products/search?query=Apple - 搜索');
  console.log('  POST /queue/email/1 - 发送欢迎邮件');
  console.log('  GET /optimization/n-plus-one     - N+1演示');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
