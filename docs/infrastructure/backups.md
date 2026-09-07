# Política e Procedimentos de Backup — Diário de Viagens

Este documento descreve a rotina de backups automatizados, estratégias de retenção e os procedimentos de restauração (*Disaster Recovery*) para o PostgreSQL e MinIO.

---

## 1. Princípio Crítico: Docker Volume Não é Backup

Muitos desenvolvedores assumem erroneamente que manter dados em volumes do Docker é uma forma de backup. Um volume Docker reside no mesmo sistema de arquivos do servidor. Se o disco da VPS corromper ou a VPS for terminada, todos os volumes serão destruídos.

Adotamos a estratégia **3-2-1**:
* **3 cópias** dos dados (banco ativo + backup local + backup offsite externo).
* **2 mídias diferentes** (disco local da VPS + storage externo, como Cloudflare R2 ou AWS S3 Glacier).
* **1 cópia fora do servidor primário** (*offsite*).

---

## 2. Backup do Banco de Dados PostgreSQL

Utilizamos o script executável [`infrastructure/scripts/backup-db.sh`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/infrastructure/scripts/backup-db.sh).

### 2.1 Como Funciona
1. Executa `pg_dump` dentro do container `travel_diary_db`.
2. Encaminha a saída diretamente pelo `gzip -9` sem gravar arquivo temporário não-comprimido, economizando I/O de disco.
3. Grava o arquivo com carimbo de data/hora em `/var/backups/travel-diary/postgres/travel_diary_YYYYMMDD_HHMMSS.sql.gz`.
4. Remove backups locais com mais de 7 dias (política de retenção).

### 2.2 Agendamento via Cron (Host da VPS)
Para executar o backup diariamente às 03:00 da madrugada:

```bash
sudo crontab -e
# Adicionar linha:
0 3 * * * /var/www/travel-diary/infrastructure/scripts/backup-db.sh >> /var/log/travel-diary-backup.log 2>&1
```

---

## 3. Backup dos Arquivos do MinIO (Fotos)

Utilizamos o script executável [`infrastructure/scripts/backup-minio.sh`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/infrastructure/scripts/backup-minio.sh).

### 3.1 Como Funciona
* Cria um arquivo compactado `.tar.gz` dos dados do bucket do MinIO.
* Para ambientes com alto volume de fotos, recomenda-se sincronização offsite contínua utilizando a ferramenta oficial do MinIO Client (`mc mirror`):
```bash
# Espelha o bucket local para um bucket externo de backup (ex: Cloudflare R2)
mc mirror local/travel-diary-media backup-r2/travel-diary-media-backup
```

---

## 4. Procedimento de Restauração (Disaster Recovery)

Para restaurar o banco de dados a partir de um arquivo de backup em caso de falha:

```bash
# Executa o script de restauração fornecendo o arquivo compactado
chmod +x infrastructure/scripts/restore-db.sh
./infrastructure/scripts/restore-db.sh /var/backups/travel-diary/postgres/travel_diary_20260906_030000.sql.gz
```

O script solicita confirmação explícita antes de sobrescrever os dados, garantindo proteção contra acidentes operacionais.
