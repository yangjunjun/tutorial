#!/bin/bash
# =============================================================================
# 自动化部署脚本（模拟 CI/CD 流程）
# =============================================================================
# 用法：
#   ./scripts/deploy.sh [环境]
#   ./scripts/deploy.sh production
#   ./scripts/deploy.sh dev
#
# 前提条件：
#   - 已安装 Docker 和 Docker Compose V2
#   - 已配置 .env 环境变量文件
#   - 有代码仓库的访问权限
# =============================================================================

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 配置变量
# ──────────────────────────────────────────────────────────────────────────────
DEPLOY_ENV="${1:-production}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.yml"
LOG_FILE="${PROJECT_DIR}/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
HEALTH_CHECK_URL="http://localhost/api/health"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5
BACKUP_BEFORE_DEPLOY=true

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# ──────────────────────────────────────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────────────────────────────────────
log() {
    local level="$1"
    shift
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] $*" | tee -a "$LOG_FILE"
}

log_info()    { log "${BLUE}INFO${NC}" "$@"; }
log_success() { log "${GREEN}SUCCESS${NC}" "$@"; }
log_warn()    { log "${YELLOW}WARN${NC}" "$@"; }
log_error()   { log "${RED}ERROR${NC}" "$@"; }

# 错误处理
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "部署失败（退出码：${exit_code}）"
        log_error "详细日志请查看：${LOG_FILE}"
        log_error "如需回滚，请执行：docker compose down && docker compose --profile production up -d"
    fi
}
trap cleanup EXIT

# ──────────────────────────────────────────────────────────────────────────────
# 部署步骤
# ──────────────────────────────────────────────────────────────────────────────

# 步骤 1：环境检查
preflight_check() {
    log_info "========== 步骤 1/7：环境检查 =========="

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "未安装 Docker，请先安装 Docker Engine"
        exit 1
    fi
    log_info "Docker 版本：$(docker --version)"

    # 检查 Docker Compose V2
    if ! docker compose version &> /dev/null; then
        log_error "未安装 Docker Compose V2，请升级 Docker"
        exit 1
    fi
    log_info "Docker Compose 版本：$(docker compose version --short)"

    # 检查 .env 文件
    if [ ! -f "${PROJECT_DIR}/.env" ]; then
        log_error ".env 文件不存在，请从 .env.example 复制并编辑"
        exit 1
    fi
    log_info "环境变量文件已就绪"

    # 检查磁盘空间
    local available_space
    available_space=$(df -BG "${PROJECT_DIR}" | awk 'NR==2 {print $4}' | tr -d 'G')
    if [ "$available_space" -lt 5 ]; then
        log_warn "磁盘可用空间仅 ${available_space}GB，建议至少 5GB"
    else
        log_info "磁盘可用空间：${available_space}GB"
    fi

    log_success "环境检查通过"
}

# 步骤 2：部署前备份
pre_deploy_backup() {
    log_info "========== 步骤 2/7：部署前备份 =========="

    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        if [ -f "${PROJECT_DIR}/scripts/backup.sh" ]; then
            bash "${PROJECT_DIR}/scripts/backup.sh"
            log_success "数据库备份完成"
        else
            log_warn "备份脚本不存在，跳过备份"
        fi
    else
        log_warn "已跳过部署前备份"
    fi
}

# 步骤 3：拉取最新代码
pull_latest_code() {
    log_info "========== 步骤 3/7：拉取最新代码 =========="

    cd "${PROJECT_DIR}"

    # 检查是否为 Git 仓库
    if [ -d ".git" ]; then
        local current_branch
        current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        log_info "当前分支：${current_branch}"

        log_info "拉取最新代码..."
        git pull origin "${current_branch}" 2>&1 | tee -a "$LOG_FILE"
        log_info "最新提交：$(git log -1 --format='%h %s')"
    else
        log_warn "非 Git 仓库，跳过代码拉取"
    fi

    log_success "代码已更新"
}

# 步骤 4：构建镜像
build_images() {
    log_info "========== 步骤 4/7：构建 Docker 镜像 =========="

    cd "${PROJECT_DIR}"

    # 启用 BuildKit 加速构建
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    local compose_args=""
    if [ "$DEPLOY_ENV" = "production" ]; then
        compose_args="--profile production"
    elif [ "$DEPLOY_ENV" = "dev" ]; then
        COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
    fi

    log_info "构建镜像（环境：${DEPLOY_ENV}）..."
    docker compose -f ${COMPOSE_FILE} ${compose_args} build --no-cache 2>&1 | tee -a "$LOG_FILE"

    log_success "镜像构建完成"

    # 显示镜像信息
    log_info "构建的镜像列表："
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" \
        | grep "fullstack" | tee -a "$LOG_FILE"
}

# 步骤 5：更新容器
update_containers() {
    log_info "========== 步骤 5/7：更新容器 =========="

    cd "${PROJECT_DIR}"

    local compose_args=""
    if [ "$DEPLOY_ENV" = "production" ]; then
        compose_args="--profile production"
    fi

    # 滚动更新（逐个替换容器，减少停机时间）
    log_info "执行滚动更新..."
    docker compose -f ${COMPOSE_FILE} ${compose_args} up -d \
        --no-deps \
        --force-recreate \
        --remove-orphans \
        2>&1 | tee -a "$LOG_FILE"

    # 清理不再使用的容器和镜像
    docker container prune -f 2>&1 | tee -a "$LOG_FILE"
    docker image prune -f 2>&1 | tee -a "$LOG_FILE"

    log_success "容器更新完成"
}

# 步骤 6：数据库迁移
run_migrations() {
    log_info "========== 步骤 6/7：数据库迁移 =========="

    cd "${PROJECT_DIR}"

    local compose_args=""
    if [ "$DEPLOY_ENV" = "production" ]; then
        compose_args="--profile production"
    fi

    # 等待数据库就绪
    log_info "等待数据库就绪..."
    local retries=10
    while [ $retries -gt 0 ]; do
        if docker compose -f ${COMPOSE_FILE} ${compose_args} exec -T db \
            pg_isready -U "${DB_USER:-appuser}" -d "${DB_NAME:-fullstack_db}" &>/dev/null; then
            break
        fi
        retries=$((retries - 1))
        sleep 3
    done

    if [ $retries -eq 0 ]; then
        log_error "数据库未就绪，迁移失败"
        exit 1
    fi

    # 执行迁移（如果有迁移脚本）
    log_info "执行数据库迁移..."
    if docker compose -f ${COMPOSE_FILE} ${compose_args} exec -T backend \
        npm run migrate 2>&1 | tee -a "$LOG_FILE"; then
        log_success "数据库迁移完成"
    else
        log_warn "迁移命令执行失败或无迁移脚本"
    fi
}

# 步骤 7：健康检查验证
verify_health() {
    log_info "========== 步骤 7/7：健康检查验证 =========="

    log_info "等待服务启动（最多 ${HEALTH_CHECK_RETRIES} 次检查）..."

    local retries=$HEALTH_CHECK_RETRIES
    while [ $retries -gt 0 ]; do
        local response
        response=$(curl -fsS "${HEALTH_CHECK_URL}" 2>/dev/null) || true

        if echo "$response" | grep -q '"status":"healthy"'; then
            log_success "健康检查通过！"
            log_info "健康检查响应：${response}"
            return 0
        fi

        retries=$((retries - 1))
        log_info "等待服务就绪... 剩余 ${retries} 次尝试"
        sleep "$HEALTH_CHECK_INTERVAL"
    done

    log_error "健康检查失败！服务未能在预期时间内启动"
    log_error "请检查容器日志：docker compose logs backend"
    exit 1
}

# ──────────────────────────────────────────────────────────────────────────────
# 主流程
# ──────────────────────────────────────────────────────────────────────────────
main() {
    # 创建日志目录
    mkdir -p "${PROJECT_DIR}/logs"

    log_info "============================================"
    log_info "  全栈应用自动化部署"
    log_info "  环境：${DEPLOY_ENV}"
    log_info "  时间：$(date '+%Y-%m-%d %H:%M:%S')"
    log_info "============================================"

    preflight_check
    pre_deploy_backup
    pull_latest_code
    build_images
    update_containers
    run_migrations
    verify_health

    log_success "============================================"
    log_success "  部署完成！"
    log_success "  访问地址：http://localhost"
    log_success "  健康检查：${HEALTH_CHECK_URL}"
    log_success "  部署日志：${LOG_FILE}"
    log_success "============================================"
}

main "$@"
