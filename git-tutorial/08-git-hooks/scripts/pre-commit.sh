#!/bin/bash
# pre-commit hook 示例 / Sample pre-commit hook
# 在提交前运行代码检查 / Run code checks before committing
#
# 安装方式 / Installation:
# cp scripts/pre-commit.sh .git/hooks/pre-commit
# chmod +x .git/hooks/pre-commit

echo "🔍 正在检查代码... / Running code checks..."

# 检查是否有暂存的文件 / Check for staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|html|css)$')

if [ -z "$STAGED_FILES" ]; then
    echo "✅ 没有需要检查的前端文件 / No frontend files to check"
    exit 0
fi

echo "📁 暂存的文件 / Staged files:"
echo "$STAGED_FILES"

# 检查 JavaScript 文件的基本语法 / Basic syntax check for JS files
JS_FILES=$(echo "$STAGED_FILES" | grep '\.js$')
if [ -n "$JS_FILES" ]; then
    echo ""
    echo "📝 检查 JavaScript 语法... / Checking JavaScript syntax..."
    for file in $JS_FILES; do
        # 使用 node 检查语法 / Use node to check syntax
        node --check "$file" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "❌ 语法错误 / Syntax error in: $file"
            exit 1
        fi
    done
    echo "✅ JavaScript 语法检查通过 / JavaScript syntax check passed"
fi

# 检查 HTML 文件是否包含基本结构 / Check HTML files have basic structure
HTML_FILES=$(echo "$STAGED_FILES" | grep '\.html$')
if [ -n "$HTML_FILES" ]; then
    echo ""
    echo "📝 检查 HTML 结构... / Checking HTML structure..."
    for file in $HTML_FILES; do
        if ! grep -q '<!DOCTYPE html>' "$file"; then
            echo "❌ 缺少 DOCTYPE 声明 / Missing DOCTYPE in: $file"
            exit 1
        fi
        if ! grep -q '<meta charset=' "$file"; then
            echo "❌ 缺少 charset 声明 / Missing charset in: $file"
            exit 1
        fi
    done
    echo "✅ HTML 结构检查通过 / HTML structure check passed"
fi

# 检查文件大小不超过 100KB / Check file sizes don't exceed 100KB
echo ""
echo "📏 检查文件大小... / Checking file sizes..."
for file in $STAGED_FILES; do
    FILE_SIZE=$(wc -c < "$file" 2>/dev/null || echo 0)
    if [ "$FILE_SIZE" -gt 102400 ]; then
        echo "⚠️  文件过大 / File too large: $file (${FILE_SIZE} bytes > 102400 bytes)"
        echo "请考虑压缩或拆分该文件 / Consider compressing or splitting this file"
        # 这里只是警告，不阻止提交 / This is just a warning, won't block commit
    fi
done

echo ""
echo "✅ 所有检查通过！/ All checks passed!"
exit 0
