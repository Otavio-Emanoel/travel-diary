# Monitoramento e Observabilidade — Diário de Viagens

Este documento detalha o modelo de observabilidade de baixo custo, probes de integridade e gestão de logs em produção.

---

## 1. Probes de Integridade HTTP

O backend Fastify expõe dois endpoints essenciais na raiz:

### 1.1 Liveness Probe: `GET /health`
* **Objetivo**: Verificar se o processo Node.js está ativo e o event loop está respondendo.
* **Resposta (200 OK)**:
```json
{
  "status": "ok",
  "uptime": 86400,
  "timestamp": "2026-09-06T18:00:00.000Z"
}
```

### 1.2 Readiness Probe: `GET /ready`
* **Objetivo**: Verificar se a API é capaz de atender tráfego de negócio (checa conexão com PostgreSQL e MinIO).
* **Resposta de Sucesso (200 OK)**:
```json
{
  "status": "ready",
  "checks": {
    "database": "UP",
    "storage": "UP"
  },
  "memory": {
    "rssMb": 64,
    "heapUsedMb": 38
  }
}
```
* **Resposta de Falha (503 Service Unavailable)**: Se o PostgreSQL estiver fora do ar ou o storage inacessível.

---

## 2. Logs Estruturados em JSON com Pino

* Toda requisição HTTP gera um log em linha única no formato JSON padronizado.
* **Campos Obrigatórios**:
  - `time`: Timestamp ISO-8601.
  - `level`: Nível de severidade (`info`, `warn`, `error`).
  - `reqId`: Identificador único da requisição (`x-request-id`).
  - `method` e `url`: Rota acessada.
  - `statusCode`: Código HTTP de resposta.
  - `responseTime`: Tempo gasto para processar a requisição em milissegundos.

Exemplo de log real:
```json
{"level":30,"time":1788739200000,"pid":1,"hostname":"api","reqId":"req-a1b2c3","req":{"method":"GET","url":"/api/v1/trips"},"res":{"statusCode":200},"responseTime":14.2,"msg":"request completed"}
```

---

## 3. Rotação de Logs do Docker no Host

Para evitar que os logs do Docker encham o disco da VPS, configuramos a rotação global no arquivo `/etc/docker/daemon.json` do host:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "3"
  }
}
```
Isso garante que nenhum container gere mais de 60MB de logs acumulados em disco.
