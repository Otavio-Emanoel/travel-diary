#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP DO POSTGRESQL (LOW-RESOURCE VPS SAFE)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/travel-diary/postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/travel_diary_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${DB_CONTAINER:-travel_diary_db}"
POSTGRES_USER="${POSTGRES_USER:-travel_user}"
POSTGRES_DB="${POSTGRES_DB:-travel_diary}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Iniciando backup do banco de dados ${POSTGRES_DB}..."

# Executa pg_dump dentro do container e comprime via gzip na saída padrão
docker exec "${CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --clean --if-exists | gzip -9 > "${BACKUP_FILE}"

echo "[$(date)] Backup concluído com sucesso: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Limpeza de backups antigos além da política de retenção
echo "[$(date)] Removendo backups com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -type f -name "travel_diary_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date)] Rotina de backup finalizada."
