## Docker 实战教程

本教程以示例驱动，从零开始掌握 Docker 的核心能力。每个章节都包含可运行的示例项目，建议按顺序学习。

### 前置要求

在开始之前，请确保你的系统已安装以下工具：

- Docker Engine（或 Docker Desktop）
- Docker Compose（Docker Desktop 已内置）
- 基础的 Linux 命令行知识
- Git（用于克隆示例代码）

安装 Docker 请参考官方文档：https://docs.docker.com/get-docker/

### 教程大纲

| 章节 | 目录 | 内容 | 难度 |
|------|------|------|------|
| 1 | `01-docker-basics/` | Docker 基础概念与常用命令 | 入门 |
| 2 | `02-dockerfile/` | Dockerfile 语法详解与镜像构建 | 入门 |
| 3 | `03-multi-stage-build/` | 多阶段构建：减小镜像体积 | 中级 |
| 4 | `04-docker-compose/` | Docker Compose 编排多容器应用 | 中级 |
| 5 | `05-docker-networking/` | Docker 网络模型与自定义网络 | 中级 |
| 6 | `06-docker-volumes/` | 数据持久化：Volume 与 Bind Mount | 中级 |
| 7 | `07-full-project/` | 完整实战项目：全栈应用部署 | 进阶 |

### 学习路线

```
Docker 基础命令 → 编写 Dockerfile → 多阶段构建优化
                                        ↓
数据持久化 ← Docker Compose 编排 ← Docker 网络
      ↓
完整实战项目
```

### 快速开始

每个章节都是独立的，你可以直接 `cd` 到对应目录，阅读该章节的 `readme.md` 并按步骤操作。所有章节的示例都经过验证，可以直接运行。

### 约定

教程中会使用以下标记：

- `$` 前缀表示在宿主机上执行的命令
- `#` 前缀表示注释或说明
- `>` 前缀表示命令的预期输出片段
- 代码块中的文件内容会标注文件名
