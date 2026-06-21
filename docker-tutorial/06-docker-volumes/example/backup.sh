#!/bin/sh
# ==============================================================================
# PostgreSQL 数据库备份脚本
# 用法：
#   手动执行：docker compose run --rm backup
#   配合 cron：0 2 * * * cd /path/to/project && docker compose run --rm backup
# ==============================================================================

set -e

# ---- 变量定义 ----
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# ---- 前置检查 ----
echo "=========================================="
echo " PostgreSQL 数据库备份"
echo " 时间：$(date)"
echo "=========================================="

# 等待数据库就绪
echo "[1/4] 检查数据库连接..."
RETRIES=30
until pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ "$RETRIES" -le 0 ]; then
        echo "错误：无法连接到数据库 ${POSTGRES_HOST}:${POSTGRES_PORT}"
        exit 1
    fi
    echo "  等待数据库就绪... 剩余 ${RETRIES} 次重试"
    sleep 2
done
echo "  数据库连接正常"

# ---- 执行备份 ----
echo "[2/4] 开始备份数据库：${POSTGRES_DB}"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dumpall \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    --clean \
    | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "  备份完成：${BACKUP_FILE} (${BACKUP_SIZE})"

# ---- 清理过期备份 ----
echo "[3/4] 清理 ${RETENTION_DAYS} 天前的旧备份..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "db_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -print | wc -l)
find "${BACKUP_DIR}" -name "db_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "  已清理 ${DELETED_COUNT} 个旧备份文件"

# ---- 列出当前备份 ----
echo "[4/4] 当前备份列表："
echo "------------------------------------------"
ls -lh "${BACKUP_DIR}"/db_backup_*.sql.gz 2>/dev/null || echo "  （无备份文件）"
echo "------------------------------------------"

echo ""
echo "备份任务完成！"
echo "=========================================="
