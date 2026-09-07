# Configuração dos Containers Docker — Diário de Viagens

Este documento detalha o isolamento, imagens base, segurança e governança dos contêineres Docker do sistema.

---

## 1. Imagens Oficiais Utilizadas

Para garantir estabilidade, segurança e mínimo consumo de recursos, todas as imagens base são derivadas de **Alpine Linux** ou builds oficiais minimalistas:

* **Reverse Proxy**: `caddy:2.8-alpine` (~15MB compactada)
* **Banco de Dados**: `postgres:16-alpine` (~40MB compactada)
* **Object Storage**: `minio/minio:RELEASE.2024-05-10T01-41-38Z-cpuv1`
* **Node.js Runner (API e Web)**: `node:22-alpine` (~50MB compactada)
* **Cache Opcional**: `redis:7-alpine` (~12MB compactada)

---

## 2. Hardening e Segurança nos Dockerfiles

1. **Usuários Não-Root**: Nenhum container da aplicação roda como `root`. Os containers `api` e `web` criam grupos e usuários dedicados (`fastify:nodejs` e `nextjs:nodejs`) com UID/GID `1001`.
2. **Multi-Stage Builds**: Arquivos intermediários de compilação, código-fonte bruto TypeScript e pacotes de desenvolvimento são descartados na fase final, gerando imagens com menos de 150MB e superfície de ataque mínima.
3. **Isolamento de Rede**: Apenas o Caddy possui mapeamento de portas externas (`80:80` e `443:443`). PostgreSQL e MinIO são restritos à rede privada `travel_network`.

---

## 3. Matriz de Governança de Recursos (Docker Limits)

No arquivo `docker-compose.yml`, cada serviço possui um limite rígido (`memory.limits`) para impedir que qualquer serviço consiga consumir a RAM do host descontroladamente:

```yaml
deploy:
  resources:
    limits:
      memory: 160M # Exemplo na API
      cpus: '0.80'
```

* **Comportamento sob Limite**: Se o processo Node.js começar a vazar memória, o container é reiniciado automaticamente pelo Docker (`restart: unless-stopped`) antes de afetar o banco de dados PostgreSQL.

---

## 4. Persistência e Volumes

Os dados sensíveis e dinâmicos residem em volumes nomeados do Docker:

* `postgres_data`: Diretório `/var/lib/postgresql/data`.
* `minio_data`: Diretório `/data` contendo as fotos dos buckets.
* `caddy_data`: Certificados SSL/TLS gerados pelo Let's Encrypt.
* `caddy_config`: Configurações ativas do Caddy.

> [!WARNING]
> Volumes Docker **NÃO** são backups. Se o disco rígido da VPS falhar, os volumes serão perdidos. Veja a rotina de backups em [`docs/infrastructure/backups.md`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/backups.md).
