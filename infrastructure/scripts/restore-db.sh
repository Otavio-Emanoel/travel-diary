#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURAÇÃO DO POSTGRESQL
# ==============================================================================
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Erro: Forneça o caminho do arquivo de backup .sql.gz como primeiro argumento."
  echo "Uso: $0 /caminho/para/travel_diary_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${DB_CONTAINER:-travel_diary_db}"
POSTGRES_USER="${POSTGRES_USER:-travel_user}"
POSTGRES_DB="${POSTGRES_DB:-travel_diary}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Erro: Arquivo '${BACKUP_FILE}' não encontrado."
  exit 1
fi

echo "ATENÇÃO: Isso irá restaurar o banco de dados ${POSTGRES_DB} sobrescrevendo dados existentes."
read -p "Deseja continuar? (s/N): " -r CONFIRM
if [[ ! "${CONFIRM}" =~ ^[sS]$ ]]; then
  echo "Restauração cancelada."
  exit 0
fi

echo "[$(date)] Descomprimindo e restaurando ${BACKUP_FILE} no banco ${POSTGRES_DB}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "[$(date)] Banco restaurado com sucesso!"
