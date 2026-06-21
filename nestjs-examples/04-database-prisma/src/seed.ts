/**
 * 种子数据脚本
 *
 * 用于填充初始数据（分类和商品）。
 * 运行方式: pnpm seed（或 npx ts-node src/seed.ts）
 *
 * 种子脚本的作用：
 * 1. 初始化基础数据（分类、配置等）
 * 2. 开发环境填充测试数据
 * 3. 数据库迁移后的数据初始化
 *
 * 注意：
 * - 脚本会先清空现有数据（防止重复运行出错）
 * - 先删除 Product（有外键约束），再删除 Category
 * - 生产环境不要使用这种清空方式！
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充种子数据...\n');

  // =====================================================
  // 1. 清空现有数据
  // =====================================================
  console.log('清空现有数据...');
  await prisma.product.deleteMany();  // 先删除商品（有外键引用分类）
  await prisma.category.deleteMany(); // 再删除分类
  console.log('清空完成 ✓\n');

  // =====================================================
  // 2. 创建分类
  // =====================================================
  console.log('创建分类...');

  const electronics = await prisma.category.create({
    data: { name: '电子产品' },
  });

  const books = await prisma.category.create({
    data: { name: '图书' },
  });

  const clothing = await prisma.category.create({
    data: { name: '服装' },
  });

  const food = await prisma.category.create({
    data: { name: '食品' },
  });

  console.log(`创建了 ${4} 个分类 ✓\n`);

  // =====================================================
  // 3. 创建商品
  // =====================================================
  console.log('创建商品...');

  const products = await Promise.all([
    // 电子产品
    prisma.product.create({
      data: {
        name: 'MacBook Pro 16"',
        description: 'Apple M3 Max 芯片, 36GB 内存, 1TB SSD',
        price: 27999,
        stock: 50,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max',
        description: '256GB, 钛金属设计',
        price: 9999,
        stock: 200,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'AirPods Pro 2',
        description: '主动降噪, USB-C 充电',
        price: 1899,
        stock: 500,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'iPad Air',
        description: 'M2 芯片, 11 英寸, 256GB',
        price: 5499,
        stock: 100,
        categoryId: electronics.id,
      },
    }),

    // 图书
    prisma.product.create({
      data: {
        name: 'NestJS 实战指南',
        description: '从零到一构建企业级 Node.js 应用',
        price: 89,
        stock: 300,
        categoryId: books.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'TypeScript 编程',
        description: '深入理解 TypeScript 类型系统',
        price: 79,
        stock: 250,
        categoryId: books.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'RxJS 深入浅出',
        description: '响应式编程实战',
        price: 69,
        stock: 150,
        categoryId: books.id,
      },
    }),

    // 服装
    prisma.product.create({
      data: {
        name: '程序员连帽衫',
        description: '100% 纯棉, "Hello World" 印花',
        price: 199,
        stock: 500,
        categoryId: clothing.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Debug 马克杯',
        description: '"It works on my machine" 限量版',
        price: 49,
        stock: 1000,
        categoryId: clothing.id,
      },
    }),

    // 食品
    prisma.product.create({
      data: {
        name: '程序员能量饮料',
        description: '咖啡味, 高咖啡因, 250ml x 6',
        price: 59,
        stock: 800,
        categoryId: food.id,
      },
    }),
  ]);

  console.log(`创建了 ${products.length} 个商品 ✓\n`);

  // =====================================================
  // 4. 输出统计
  // =====================================================
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log('种子数据填充完成！');
  console.log(`  分类总数: ${categoryCount}`);
  console.log(`  商品总数: ${productCount}`);
  console.log('\n可以使用以下命令查看数据:');
  console.log('  npx prisma studio    → 打开可视化数据库管理');
  console.log('  pnpm start:dev       → 启动 API 服务');
}

// 执行种子脚本
main()
  .catch((e) => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    // 断开数据库连接
    await prisma.$disconnect();
  });
