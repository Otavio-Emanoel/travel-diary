# ADR 007: Observabilidade Leve via Fastify Pino e Health Checks

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

Para manter um sistema em produção estável, é fundamental ter rastreabilidade de erros, visibilidade de requisições lentas e probes de integridade. Contudo, stacks pesadas de observabilidade como Datadog, New Relic ou a combinação Prometheus + Grafana + Loki / OpenTelemetry Collector consomem facilmente entre 500MB e 1GB de RAM — consumindo toda a capacidade de uma VPS de baixo custo antes mesmo da aplicação processar uma requisição.

---

## 2. Opções Consideradas

1. **Stack Completa Prometheus + Grafana + Jaeger**: Excelente poder analítico, mas inviável pelo footprint de memória.
2. **Logs Desestruturados (`console.log`)**: Inadequados para depuração rápida e análise automatizada.
3. **Observabilidade Leve Embutida**:
   - Logger estruturado JSON nativo de alta performance (**Pino**) integrado ao Fastify.
   - Injeção obrigatória de `requestId` em todas as requisições (`x-request-id`).
   - Probes de integridade padronizados (`/health` para liveness e `/ready` para readiness).
   - Rotação de logs no host via `logrotate` do Linux.

---

## 3. Decisão

Adotar **Observabilidade Leve Embutida** com Fastify Pino e Probes HTTP.

* **Logs Estruturados**: O Fastify já possui o logger Pino integrado (o mais rápido do ecossistema Node.js). Todas as mensagens são geradas em formato JSON com timestamp UTC, level numérico, `requestId`, método HTTP, rota e tempo de resposta em milissegundos.
* **Probes HTTP**:
  - `GET /health`: Retorna `200 OK` se o processo Node.js estiver vivo.
  - `GET /ready`: Executa uma query leve no PostgreSQL (`SELECT 1`) e checa o MinIO via HEAD bucket. Retorna `200 OK` somente se as dependências essenciais estiverem responsivas.
* **Segurança de Logs**: Filtro automático (redaction) de campos sensíveis como `password`, `token`, `authorization` e `credit_card` antes de serem gravados nos logs.

---

## 4. Consequências

### Pontos Positivos:
* Sobrecarga de CPU e memória praticamente nula (< 5MB de RAM adicional).
* Logs perfeitamente legíveis por ferramentas externas caso o projeto migre no futuro para serviços gerenciados como Grafana Cloud ou BetterStack.
* Facilidade para scripts de health check do Docker Compose reiniciarem containers travados.

### Pontos Negativos / Mitigações:
* Não dispõe de painéis gráficos de métricas em tempo real na própria máquina.
* *Mitigação*: Uma VPS pequena monitora-se perfeitamente com métricas básicas do host (htop, uptime, docker stats) e os endpoints de health check expostos.
