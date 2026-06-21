/**
 * 种子数据脚本 - 初始化测试数据
 *
 * 学习点：
 * 1. 独立脚本使用 ts-node 运行，不依赖 NestJS 容器
 * 2. Prisma Client 可以在脚本中直接使用
 * 3. 使用 upsert 确保幂等性（重复运行不会创建重复数据）
 *
 * 运行方式: pnpm seed 或 npx ts-node src/seed.ts
 */
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...\n');

  // ========== 清理旧数据（按依赖关系倒序删除） ==========
  await prisma.shippingAddress.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ 旧数据已清理\n');

  // ========== 创建用户 ==========
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'zhangsan',
        password: '123456',  // 实际项目中应该使用 bcrypt 加密
        email: 'zhangsan@example.com',
        balance: 10000,      // 初始余额 10000 元
      },
    }),
    prisma.user.create({
      data: {
        username: 'lisi',
        password: '123456',
        email: 'lisi@example.com',
        balance: 5000,
      },
    }),
    prisma.user.create({
      data: {
        username: 'wangwu',
        password: '123456',
        email: 'wangwu@example.com',
        balance: 20000,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户:`);
  users.forEach((u) => console.log(`   - ${u.username} (余额: ¥${u.balance})`));

  // ========== 创建商品 ==========
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'MacBook Pro 14寸',
        price: 14999,
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro',
        price: 8999,
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'AirPods Pro 2',
        price: 1899,
        stock: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'iPad Air',
        price: 4799,
        stock: 80,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Apple Watch Ultra 2',
        price: 6499,
        stock: 30,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Magic Keyboard',
        price: 999,
        stock: 150,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Studio Display',
        price: 11499,
        stock: 20,
      },
    }),
    prisma.product.create({
      data: {
        name: 'HomePod mini',
        price: 749,
        stock: 300,
      },
    }),
  ]);

  console.log(`\n✅ 创建了 ${products.length} 个商品:`);
  products.forEach((p) =>
    console.log(`   - ${p.name} (¥${p.price}, 库存: ${p.stock})`),
  );

  console.log('\n🎉 种子数据填充完成！');
  console.log('\n提示：启动服务后可以使用以下命令测试:');
  console.log('  POST /orders - 创建订单');
  console.log('  GET /orders  - 查看订单列表');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
