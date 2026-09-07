#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP DO MINIO OBJECT STORAGE (MIRROR / SYNC)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/travel-diary/minio}"
MINIO_CONTAINER="${MINIO_CONTAINER:-travel_diary_minio}"
BUCKET_NAME="${STORAGE_BUCKET:-travel-diary-media}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TAR_FILE="${BACKUP_DIR}/minio_${BUCKET_NAME}_${TIMESTAMP}.tar.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Iniciando backup dos arquivos do MinIO (bucket: ${BUCKET_NAME})..."

# Cria arquivo tar.gz diretamente do volume de dados do container
docker run --rm \
  --volumes-from "${MINIO_CONTAINER}" \
  -v "${BACKUP_DIR}":/backup \
  alpine tar -czf "/backup/minio_${BUCKET_NAME}_${TIMESTAMP}.tar.gz" -C /data "${BUCKET_NAME}"

echo "[$(date)] Backup do MinIO finalizado: ${TAR_FILE} ($(du -h "${TAR_FILE}" | cut -f1))"

# Limpeza por retenção
find "${BACKUP_DIR}" -type f -name "minio_${BUCKET_NAME}_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date)] Rotina de backup do MinIO finalizada com sucesso."
