# Dicionário de Variáveis de Ambiente — Diário de Viagens

Este documento cataloga todas as variáveis de ambiente consumidas pelas aplicações e contêineres do sistema.

---

## 1. Classificação de Segurança

* 🔴 **SECRETO**: Nunca deve ser commitado no Git ou exposto no cliente Web/Mobile.
* 🟡 **CONFIGURAÇÃO**: Parâmetros de infraestrutura internos.
* 🟢 **PÚBLICO**: Variáveis injetadas no bundle do cliente (ex.: prefixo `NEXT_PUBLIC_`).

---

## 2. Catálogo Geral de Variáveis

| Variável | Nível | Padrão Local | Descrição |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | 🟡 | `development` | Ambiente de execução (`development`, `test`, `production`) |
| `API_PORT` | 🟡 | `3001` | Porta de escuta da API Fastify |
| `WEB_PORT` | 🟡 | `3000` | Porta de escuta do Next.js |
| `POSTGRES_DB` | 🟡 | `travel_diary` | Nome da base de dados no PostgreSQL |
| `POSTGRES_USER`| 🟡 | `travel_user` | Usuário do banco PostgreSQL |
| `POSTGRES_PASSWORD` | 🔴 | `travel_password...` | Senha de acesso ao banco PostgreSQL |
| `DATABASE_URL` | 🔴 | `postgresql://...` | Connection string completa utilizada pelo Drizzle |
| `STORAGE_PROVIDER` | 🟡 | `s3` | Provedor de armazenamento (`s3`, `local`) |
| `STORAGE_ENDPOINT` | 🟡 | `http://localhost:9000` | Endpoint do S3/MinIO para chamadas internas |
| `STORAGE_PUBLIC_URL` | 🟡 | `http://localhost:9000` | URL base do storage acessível pelos navegadores dos clientes |
| `STORAGE_BUCKET` | 🟡 | `travel-diary-media` | Nome do bucket para fotos |
| `STORAGE_ACCESS_KEY` | 🔴 | `minio_admin` | Access Key do MinIO ou AWS IAM |
| `STORAGE_SECRET_KEY` | 🔴 | `minio_password...` | Secret Key do MinIO ou AWS IAM |
| `STORAGE_REGION` | 🟡 | `us-east-1` | Região do bucket S3 |
| `JWT_ACCESS_SECRET` | 🔴 | (string aleatória) | Chave secreta de 256 bits para assinatura dos JWTs curtos |
| `JWT_REFRESH_SECRET` | 🔴 | (string aleatória) | Chave secreta para geração de tokens de atualização |
| `ACCESS_TOKEN_EXPIRATION` | 🟡 | `15m` | Tempo de vida do access token |
| `REFRESH_TOKEN_EXPIRATION` | 🟡 | `30d` | Tempo de vida do refresh token |
| `NEXT_PUBLIC_API_URL` | 🟢 | `http://localhost:3001/api/v1` | URL base da API consumida pelo cliente Web |
| `NEXT_PUBLIC_MAP_STYLE_URL` | 🟢 | `https://demotiles...` | URL do estilo JSON de mapa (MapLibre / OpenStreetMap) |
| `REDIS_URL` | 🟡 | `redis://localhost:6379` | Conexão com Redis (opcional; profile `with-redis`) |

---

## 3. Validação de Variáveis no Bootstrap

O backend não inicia com variáveis de ambiente inválidas ou ausentes. Utilizamos o plugin de configuração com validação estrita via **Zod** no `apps/api/src/core/config/env.ts`. Caso uma chave como `JWT_ACCESS_SECRET` esteja ausente no `.env`, o processo falha imediatamente (*Fail-Fast*) com mensagem explicativa no terminal.
