#!/bin/bash
# commit-msg hook 示例 / Sample commit-msg hook
# 验证提交消息格式是否符合 Conventional Commits 规范
# Validate commit message follows Conventional Commits format
#
# 安装方式 / Installation:
# cp scripts/commit-msg.sh .git/hooks/commit-msg
# chmod +x .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 跳过 merge 提交 / Skip merge commits
if echo "$COMMIT_MSG" | grep -qE '^Merge '; then
    exit 0
fi

# Conventional Commits 正则 / Conventional Commits regex
# 格式 / Format: type(scope): description
# type: feat, fix, docs, style, refactor, test, chore, perf, ci, build
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-zA-Z0-9_-]+\))?: .{1,100}$"

if ! echo "$COMMIT_MSG" | head -1 | grep -qE "$PATTERN"; then
    echo ""
    echo "❌ 提交消息格式不正确 / Invalid commit message format"
    echo ""
    echo "提交消息 / Your message:"
    echo "  $COMMIT_MSG"
    echo ""
    echo "正确格式 / Expected format:"
    echo "  <type>(<scope>): <description>"
    echo ""
    echo "示例 / Examples:"
    echo "  feat(navbar): add gallery link"
    echo "  fix(css): correct hero section padding"
    echo "  docs: update README with setup instructions"
    echo "  refactor(gallery): extract render function"
    echo ""
    echo "可用类型 / Available types:"
    echo "  feat     - 新功能 / New feature"
    echo "  fix      - 修复 bug / Bug fix"
    echo "  docs     - 文档更新 / Documentation"
    echo "  style    - 代码格式 / Code style"
    echo "  refactor - 重构 / Refactoring"
    echo "  test     - 测试 / Testing"
    echo "  chore    - 构建/工具 / Build/tooling"
    echo "  perf     - 性能优化 / Performance"
    echo "  ci       - CI 配置 / CI config"
    echo "  build    - 构建系统 / Build system"
    echo ""
    exit 1
fi

echo "✅ 提交消息格式正确 / Commit message format is valid"
exit 0
