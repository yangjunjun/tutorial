# 双语知识图谱 / Bilingual Knowledge Atlas

本目录使用 Markdown 维护知识图谱，并通过全局安装的 Pandoc 生成适合手机阅读的 EPUB 3 电子书。

This directory maintains the knowledge atlas in Markdown and uses a globally installed Pandoc to build a mobile-friendly EPUB 3 book.

## 环境要求 / Requirements

- Pandoc，且 `pandoc` 命令位于 `PATH` 中；
- `unzip`，可选，用于检查 EPUB 压缩包完整性；
- EPUBCheck，可选，用于执行 EPUB 规范验证。

检查 Pandoc：

```bash
pandoc --version
```

## 构建 / Build

在项目根目录运行：

```bash
./knowledge-atlas/build-epub.sh
```

也可以进入本目录后运行：

```bash
cd knowledge-atlas
./build-epub.sh
```

默认输出：

```text
knowledge-atlas/dist/knowledge-atlas.epub
```

脚本会依次检查 Pandoc、构建配置和章节文件，先写入临时文件，验证成功后再替换正式 EPUB，避免失败的构建破坏上一次产物。

The script checks Pandoc, build configuration, and chapter files. It writes to a temporary file and only replaces the published EPUB after validation succeeds.

## 自定义命令 / Overrides

可以通过环境变量选择其他 Pandoc 命令或输出位置：

```bash
PANDOC=/custom/bin/pandoc \
OUTPUT_FILE=dist/custom-name.epub \
./knowledge-atlas/build-epub.sh
```

相对输出路径以 `knowledge-atlas/` 为基准，绝对路径保持不变。

Relative output paths are resolved from `knowledge-atlas/`; absolute paths are used unchanged.

## 工程结构 / Project Structure

```text
knowledge-atlas/
├── README.md               # 构建与维护说明 / build guide
├── knowledge_atlas.md      # 源码导航 / source index
├── *.md                    # 学科正文 / source chapters
├── epub/
│   ├── chapters.txt        # EPUB 章节及顺序 / chapter order
│   ├── metadata.yaml       # 书籍元数据 / book metadata
│   ├── epub.css            # 移动阅读样式 / mobile styles
│   └── cover.svg           # 矢量封面 / vector cover
├── build-epub.sh           # 可重复构建脚本 / reproducible build
└── dist/
    └── knowledge-atlas.epub
```

项目依赖系统中的 Pandoc，不再保存项目内便携版或安装包。

The project uses the system Pandoc and no longer stores a portable binary or installer packages.

## 维护章节 / Maintain Chapters

编辑 `epub/chapters.txt`。每行填写一个 Markdown 文件名，顺序就是电子书的章节顺序；空行和以 `#` 开头的行会被忽略。

Edit `epub/chapters.txt`. Each line is a Markdown filename, and the line order defines the book order. Blank lines and lines beginning with `#` are ignored.

`knowledge_atlas.md` 是浏览源码时使用的总览和链接索引，不直接加入 EPUB。这样可以避免其中的 Markdown 文件链接在 EPUB 中变成失效链接。

`knowledge_atlas.md` is the overview for browsing source files and is not included directly in the EPUB, preventing source-file links from becoming invalid EPUB links.

## 出版配置 / Publishing Configuration

- 修改 `epub/metadata.yaml`：书名、作者、语言、版权和标识符；
- 修改 `epub/epub.css`：字体、字号、间距、表格和代码块样式；
- 替换 `epub/cover.svg`：电子书封面；
- 修改 `epub/chapters.txt`：增删章节或调整顺序。

## 手机阅读 / Mobile Reading

将生成的 EPUB 传输到支持 EPUB 3 的手机阅读器中。发布前建议至少测试：

- 目录和章节跳转；
- 中英文混排与字号缩放；
- 表格、代码块和长链接；
- 浅色与深色主题；
- 手机与平板的不同屏幕宽度。

Transfer the generated EPUB to an EPUB 3 compatible mobile reader. Before publishing, test navigation, bilingual typography, tables, code blocks, themes, and different screen sizes.
