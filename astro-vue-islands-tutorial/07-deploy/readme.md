# 第七章：部署上线

## 本章目标

学会将 Astro 站点部署到多个主流平台，包括 Vercel、Netlify、Cloudflare Pages 和 GitHub Pages。同时了解 SSR 与静态部署的区别、环境变量管理和 CI/CD 自动化部署。

## 部署前检查清单

在部署之前，请确保完成以下检查：

- [ ] `npm run build` 构建成功，无错误
- [ ] `npm run preview` 预览所有页面正常渲染
- [ ] 浏览器控制台无 JavaScript 错误
- [ ] 所有链接和导航正常工作
- [ ] 图片正确加载（路径无 404）
- [ ] RSS feed (`/rss.xml`) 正确生成
- [ ] Sitemap (`/sitemap-index.xml`) 包含所有页面
- [ ] 暗黑模式切换正常
- [ ] 搜索功能正常
- [ ] 移动端响应式布局正常

## 平台 1：Vercel

Vercel 是 Astro 最推荐的部署平台之一，零配置即可部署。

### 快速部署

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. Vercel 自动检测 Astro 项目并配置构建命令

### 使用 Vercel Adapter（SSR 模式）

如果需要 SSR 功能（如 API 路由、动态渲染），安装 Vercel 适配器：

```bash
npx astro add vercel
```

`astro.config.mjs` 会自动更新：

```javascript
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server', // 或 'hybrid' 混合模式
  adapter: vercel(),
});
```

### Vercel 特有功能

- **Preview Deployments**：每个 PR 自动生成预览 URL
- **Edge Functions**：在边缘节点运行 SSR
- **Analytics**：内置网站分析
- **Image Optimization**：自动优化图片

### 环境变量

在 Vercel 控制台的 **Settings → Environment Variables** 中配置：

```
PUBLIC_SITE_URL=https://your-domain.com
API_KEY=your-secret-key
```

## 平台 2：Netlify

Netlify 同样支持 Astro 的零配置部署。

### 配置文件 `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

# SPA 回退（可选）
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

### 使用 Netlify Adapter（SSR 模式）

```bash
npx astro add netlify
```

```javascript
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
});
```

### Netlify 特有功能

- **Forms**：内置表单处理，无需后端
- **Edge Functions**：Deno 运行时
- **Identity**：内置用户认证
- **Split Testing**：A/B 测试

## 平台 3：Cloudflare Pages

Cloudflare Pages 提供全球 CDN 分发，速度极快。

### 配置文件 `wrangler.toml`

```toml
name = "my-astro-blog"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"
```

### 使用 Cloudflare Adapter（SSR 模式）

```bash
npx astro add cloudflare
```

```javascript
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
```

### 通过 Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 构建并部署
npm run build
wrangler pages deploy dist
```

### Cloudflare 特有功能

- **Workers**：边缘计算
- **KV Storage**：键值存储
- **R2 Storage**：对象存储
- **D1 Database**：SQL 数据库

## 平台 4：GitHub Pages

GitHub Pages 适合纯静态站点，完全免费。

### GitHub Actions 工作流

在 `.github/workflows/deploy.yml` 中配置：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Astro 配置

GitHub Pages 需要配置 base 路径（如果仓库名不是 `username.github.io`）：

```javascript
export default defineConfig({
  site: 'https://username.github.io',
  base: '/repo-name', // 仓库名
  output: 'static',   // GitHub Pages 只支持静态
});
```

## SSR vs 静态部署对比

| 特性 | 静态部署 (SSG) | 服务端部署 (SSR) |
|------|---------------|-----------------|
| 构建速度 | 构建时生成所有页面 | 按需生成 |
| 运行时成本 | CDN 直接返回 HTML | 需要服务器/函数 |
| 适用场景 | 博客、文档、营销页 | 用户系统、动态内容 |
| 更新方式 | 重新构建部署 | 实时生效 |
| 免费额度 | 大多数平台免费 | 有函数调用限制 |
| 推荐 Adapter | 无需 | vercel / netlify / cloudflare |

## 环境变量管理

### 在 Astro 中使用环境变量

```typescript
// 仅服务端可用（不暴露给客户端）
const apiKey = import.meta.env.API_KEY;

// 客户端也可用（以 PUBLIC_ 开头）
const siteUrl = import.meta.env.PUBLIC_SITE_URL;
```

### 各平台配置方式

| 平台 | 配置位置 |
|------|---------|
| Vercel | Settings → Environment Variables |
| Netlify | Site settings → Environment variables |
| Cloudflare | Settings → Environment variables |
| GitHub Pages | Repository → Settings → Secrets |

### .env 本地文件

```bash
# .env — 本地开发用（不要提交到 Git）
PUBLIC_SITE_URL=http://localhost:4321
API_KEY=dev-key

# .env.production — 生产环境
PUBLIC_SITE_URL=https://your-domain.com
```

## 自定义域名

### 通用步骤

1. 在平台控制台中添加自定义域名
2. 获取平台提供的 DNS 记录（CNAME 或 A 记录）
3. 在域名注册商处配置 DNS
4. 等待 DNS 传播（通常 5 分钟到 24 小时）
5. HTTPS 证书自动颁发

### DNS 配置示例

```
# CNAME 方式（推荐用于子域名）
blog.example.com  CNAME  cname.vercel-dns.com

# A 记录方式（用于根域名）
example.com  A  76.76.21.21  (Vercel)
example.com  A  75.2.60.5    (Netlify)
```

## CI/CD 最佳实践

### 推荐的 GitHub Actions 流程

```yaml
# 完整的 CI/CD 流程
name: CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  # 1. 代码检查
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx astro check

  # 2. 构建检查
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build

  # 3. Lighthouse 性能检查（可选）
  lighthouse:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - run: npx lighthouse-ci autorun
```

## 练习

1. **基础练习**：选择一个平台部署你的博客
2. **进阶练习**：配置自定义域名和 HTTPS
3. **高级练习**：设置 GitHub Actions 自动部署 + Lighthouse CI
4. **挑战练习**：尝试 hybrid 模式（部分页面 SSG，部分页面 SSR）

## 常见问题

### Q: 部署后图片不显示？
A: 检查图片路径是否正确。使用绝对路径 `/images/photo.jpg` 而不是相对路径。

### Q: 页面样式没有加载？
A: 检查 `astro.config.mjs` 中的 `base` 配置是否正确，特别是 GitHub Pages 部署。

### Q: 客户端路由不工作？
A: 静态部署不支持客户端路由回退。需要在平台配置中添加 SPA 回退规则。

### Q: 如何查看构建日志？
A: 各平台的 Dashboard 中都有详细的构建日志，搜索 "Build Logs" 或 "Deployments"。
