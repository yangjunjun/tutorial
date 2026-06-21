#!/bin/bash
# =============================================================================
# 数据库备份脚本
# =============================================================================
# 用法：
#   ./scripts/backup.sh                    # 默认备份
#   ./scripts/backup.sh --compress         # 压缩备份
#   ./scripts/backup.sh --keep-days 30     # 保留最近 30 天
#
# 建议添加到 crontab 定时执行：
#   0 2 * * * /path/to/scripts/backup.sh --compress --keep-days 7
# =============================================================================

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 配置变量
# ──────────────────────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="fullstack-db-${TIMESTAMP}.sql"
COMPRESS=false
KEEP_DAYS=7

# 数据库配置（从 .env 读取）
if [ -f "${PROJECT_DIR}/.env" ]; then
    source "${PROJECT_DIR}/.env"
fi
DB_NAME="${DB_NAME:-fullstack_db}"
DB_USER="${DB_USER:-appuser}"
CONTAINER_NAME="fullstack-db"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "$(date '+%H:%M:%S') [INFO] $*"; }
log_success() { echo -e "$(date '+%H:%M:%S') [${GREEN}OK${NC}] $*"; }
log_warn()    { echo -e "$(date '+%H:%M:%S') [${YELLOW}WARN${NC}] $*"; }
log_error()   { echo -e "$(date '+%H:%M:%S') [${RED}ERROR${NC}] $*"; }

# ──────────────────────────────────────────────────────────────────────────────
# 参数解析
# ──────────────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --compress)
            COMPRESS=true
            shift
            ;;
        --keep-days)
            KEEP_DAYS="$2"
            shift 2
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --help)
            echo "用法：$0 [选项]"
            echo "  --compress        启用 gzip 压缩"
            echo "  --keep-days N     保留最近 N 天的备份（默认 7）"
            echo "  --backup-dir DIR  自定义备份目录"
            echo "  --db-name NAME    指定数据库名称"
            echo "  --help            显示帮助信息"
            exit 0
            ;;
        *)
            log_error "未知参数：$1"
            exit 1
            ;;
    esac
done

# ──────────────────────────────────────────────────────────────────────────────
# 备份函数
# ──────────────────────────────────────────────────────────────────────────────
create_backup() {
    log_info "开始备份数据库：${DB_NAME}"

    # 创建备份目录
    mkdir -p "${BACKUP_DIR}"

    # 检查数据库容器是否运行
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "数据库容器 ${CONTAINER_NAME} 未运行"
        exit 1
    fi

    local backup_path="${BACKUP_DIR}/${BACKUP_NAME}"

    # 执行 pg_dump 备份
    log_info "执行 pg_dump..."
    docker exec "${CONTAINER_NAME}" \
        pg_dump \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --verbose \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "${backup_path}" 2>/dev/null

    if [ $? -ne 0 ]; then
        log_error "数据库备份失败"
        rm -f "${backup_path}"
        exit 1
    fi

    local file_size
    file_size=$(du -h "${backup_path}" | cut -f1)
    log_success "SQL 备份完成：${backup_path}（${file_size}）"

    # 压缩备份
    if [ "$COMPRESS" = true ]; then
        log_info "压缩备份文件..."
        gzip "${backup_path}"
        backup_path="${backup_path}.gz"
        file_size=$(du -h "${backup_path}" | cut -f1)
        log_success "压缩完成：${backup_path}（${file_size}）"
    fi

    echo "${backup_path}"
}

# ──────────────────────────────────────────────────────────────────────────────
# 清理旧备份
# ──────────────────────────────────────────────────────────────────────────────
cleanup_old_backups() {
    log_info "清理 ${KEEP_DAYS} 天前的旧备份..."

    local count
    count=$(find "${BACKUP_DIR}" -name "fullstack-db-*" -mtime "+${KEEP_DAYS}" -type f 2>/dev/null | wc -l)

    if [ "$count" -gt 0 ]; then
        find "${BACKUP_DIR}" -name "fullstack-db-*" -mtime "+${KEEP_DAYS}" -type f -delete
        log_success "已清理 ${count} 个旧备份文件"
    else
        log_info "没有需要清理的旧备份"
    fi
}

# ──────────────────────────────────────────────────────────────────────────────
# 备份验证
# ──────────────────────────────────────────────────────────────────────────────
verify_backup() {
    local backup_path="$1"

    log_info "验证备份文件完整性..."

    if [ ! -f "${backup_path}" ]; then
        log_error "备份文件不存在：${backup_path}"
        exit 1
    fi

    local file_size
    file_size=$(stat -c%s "${backup_path}" 2>/dev/null || stat -f%z "${backup_path}" 2>/dev/null || echo "0")

    if [ "$file_size" -lt 100 ]; then
        log_error "备份文件过小（${file_size} 字节），可能备份失败"
        exit 1
    fi

    # 检查 SQL 文件是否包含有效内容
    if [[ "${backup_path}" == *.gz ]]; then
        if gzip -t "${backup_path}" 2>/dev/null; then
            log_success "gzip 文件完整性验证通过"
        else
            log_error "gzip 文件损坏"
            exit 1
        fi
    else
        if head -1 "${backup_path}" | grep -q "pg_dump\|CREATE\|INSERT\|--"; then
            log_success "SQL 文件内容验证通过"
        else
            log_warn "SQL 文件内容可能异常，请手动检查"
        fi
    fi

    log_success "备份验证通过"
}

# ──────────────────────────────────────────────────────────────────────────────
# 显示备份统计
# ──────────────────────────────────────────────────────────────────────────────
show_stats() {
    log_info "──────── 备份统计 ────────"
    local total_count
    total_count=$(find "${BACKUP_DIR}" -name "fullstack-db-*" -type f 2>/dev/null | wc -l)
    local total_size
    total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    log_info "备份目录：${BACKUP_DIR}"
    log_info "备份总数：${total_count} 个"
    log_info "占用空间：${total_size}"
}

# ──────────────────────────────────────────────────────────────────────────────
# 主流程
# ──────────────────────────────────────────────────────────────────────────────
main() {
    log_info "============================================"
    log_info "  数据库备份工具"
    log_info "  数据库：${DB_NAME}"
    log_info "  时间：$(date '+%Y-%m-%d %H:%M:%S')"
    log_info "============================================"

    local backup_path
    backup_path=$(create_backup)
    verify_backup "${backup_path}"
    cleanup_old_backups
    show_stats

    log_success "============================================"
    log_success "  备份全部完成！"
    log_success "  备份文件：${backup_path}"
    log_success "============================================"
}

main "$@"
