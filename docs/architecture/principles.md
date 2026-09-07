# Princípios Arquiteturais — Diário de Viagens

Este documento detalha os princípios que guiam todas as decisões técnicas e padrões de código no projeto **Diário de Viagens**.

---

## 1. Monólito Modular (*Modular Monolith*)

Microserviços prematuros adicionam complexidade de rede, serialização excessiva, dependência de orquestradores (Kubernetes), inconsistência eventual e custo de infraestrutura impraticável para um projeto inicial.

* **Fronteiras Claras**: O backend reside em um único processo Fastify, mas o código é rigorosamente dividido em módulos isolados por domínio (`auth`, `trips`, `entries`, `media`, etc.).
* **Regra de Acesso**: Nenhum módulo tem permissão de acessar tabelas do banco de dados ou detalhes internos de outro módulo. A comunicação entre módulos deve ocorrer exclusivamente via:
  1. Interfaces de Serviço públicas (`Service Contracts`).
  2. DTOs de entrada e saída.
  3. Event Emitters assíncronos em memória (quando desacoplamento temporal for benéfico).
* **Extração Futura**: Se no futuro o módulo de `media` exigir processamento massivo de vídeo/IA e precisar escalar independentemente, ele poderá ser destacado para um microserviço sem necessidade de refatorar a regra de negócio dos demais módulos.

---

## 2. Sobriedade de Infraestrutura (KISS & VPS-Friendly)

* **Respeito aos Recursos**: Toda dependência adicionada custa CPU e memória. Evitamos ferramentas pesadas que não agregam valor imediato comprovado (ex.: RabbitMQ, Kafka, Elasticsearch, APMs invasivos).
* **Stack Mínima e Suficiente**: O trio PostgreSQL 16 + Fastify + MinIO atende com louvor até dezenas de milhares de usuários ativos em um único servidor bem ajustado.
* **Redis Sob Demanda**: O Redis não deve ser uma dependência inicial obrigatória para o sistema subir e operar. O monólito funciona perfeitamente sem ele em sua fase de fundação.

---

## 3. Desenvolvimento Orientado a Contratos (*Contract-Driven*)

* **Fonte Única da Verdade**: Todos os modelos de dados trafegados entre cliente e servidor são definidos uma única vez em `packages/contracts` utilizando schemas **Zod**.
* **Validação Estrita na Borda**: O Fastify valida inputs HTTP utilizando os schemas compartilhados. O frontend e mobile usam os mesmos schemas para validação instantânea de formulários na interface.
* **Segurança de Tipos Ponta a Ponta**: Tipos TypeScript são inferidos diretamente dos schemas Zod (`z.infer<typeof Schema>`), garantindo que alterações de contrato gerem erros de compilação automáticos caso clientes estejam defasados.

---

## 4. Eficiência de Mídia (Upload Direto ao Storage)

* **Proteção do Processo da API**: Imagens de smartphones modernos pesam facilmente entre 5MB e 15MB. Fazer o tráfego da imagem passar pelo processo do Node.js/Fastify geraria consumo exorbitante de memória (buffers) e concorrência de I/O desnecessária na API.
* **Padrão Presigned URL**: O backend atua como autorizador e gerente de metadados, emitindo uma URL temporária pré-assinada. O cliente faz upload direto do binário para o MinIO/S3 via HTTP PUT e, ao concluir, notifica a API para persistência dos metadados.

---

## 5. Offline-First Pragmático

* **Respeito à Natureza da Viagem**: A conectividade em viagens é intermitente. O aplicativo mobile deve ser projetado desde o primeiro dia com persistência local em SQLite.
* **Simplicidade de Resolução**: Evitamos sistemas excessivamente complexos como CRDTs (*Conflict-Free Replicated Data Types*) na fase inicial, adotando a estratégia consagrada de **Last Write Wins** (LWW) baseada em timestamps UTC confiáveis e filas lineares de sincronização.
