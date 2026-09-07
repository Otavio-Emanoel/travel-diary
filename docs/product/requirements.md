# Requisitos do Sistema — Diário de Viagens

Este documento formaliza os **Requisitos Funcionais (RF)**, **Requisitos Não Funcionais (RNF)** e as **Restrições de Infraestrutura** do sistema Diário de Viagens.

---

## 1. Requisitos Funcionais (RF)

### 1.1 Autenticação e Usuários
* **RF-001**: O sistema deve permitir que novos usuários se cadastrem com nome, e-mail e senha.
* **RF-002**: O sistema deve autenticar usuários emitindo tokens JWT de acesso (curta duração) e refresh tokens seguros (longa duração).
* **RF-003**: O sistema deve permitir logout revogando a sessão ativa do usuário.
* **RF-004**: O sistema deve permitir que o usuário atualize seu perfil e foto de avatar.

### 1.2 Gestão de Viagens (Trips)
* **RF-005**: O usuário deve poder criar uma viagem informando título, descrição, datas de início e término.
* **RF-006**: O usuário deve poder definir uma foto de capa para a viagem.
* **RF-007**: O usuário deve poder listar suas viagens com paginação e ordenação por data.
* **RF-008**: O usuário deve poder editar os detalhes de uma viagem existente.
* **RF-009**: O usuário deve poder excluir uma viagem (com exclusão em cascata de suas entradas ou soft-delete).

### 1.3 Destinos (Destinations)
* **RF-010**: O usuário deve poder associar um ou mais destinos a uma viagem (cidade, país, coordenadas).
* **RF-011**: O usuário deve poder ordenar a sequência de destinos visitados na viagem.

### 1.4 Dias de Viagem e Entradas de Diário (TripDays & Entries)
* **RF-012**: O sistema deve permitir agrupar relatos por dias específicos da viagem (`TripDay`).
* **RF-013**: O usuário deve poder criar entradas de diário (`Entry`) contendo título, conteúdo textual (Markdown), horário e categoria (Deslocamento, Passeio, Gastronomia, Hospedagem, Pensamento).
* **RF-014**: O usuário deve poder editar e excluir entradas de diário.
* **RF-015**: O usuário deve poder associar uma localização geográfica (latitude, longitude, nome do local) a uma entrada.

### 1.5 Gestão de Mídia (Fotos)
* **RF-016**: O usuário deve poder anexar fotos a uma entrada de diário.
* **RF-017**: O upload de imagens deve ser feito diretamente para o armazenamento S3/MinIO via URLs pré-assinadas para não sobrecarregar a API.
* **RF-018**: O sistema deve registrar metadados da imagem (tamanho, dimensões, formato, timestamp de captura).
* **RF-019**: O usuário deve poder visualizar a galeria de fotos de uma entrada ou da viagem inteira.

### 1.6 Visualização em Linha do Tempo e Mapa
* **RF-020**: O sistema deve apresentar a viagem em formato de linha do tempo (timeline) cronológica interativa.
* **RF-021**: O sistema deve renderizar um mapa interativo contendo os pontos visitados (destinos e entradas georreferenciadas).

### 1.7 Compartilhamento e Colaboração (Fase Futura)
* **RF-022**: O sistema deve permitir gerar links públicos de leitura para viagens selecionadas.
* **RF-023**: O sistema deve permitir convidar outros usuários para colaborar na mesma viagem com permissões definidas (Leitor / Editor).

---

## 2. Requisitos Não Funcionais (RNF)

### 2.1 Performance e Recursos
* **RNF-001 (Footprint de Memória)**: O consumo total combinado de memória de todos os containers (DB + MinIO + Fastify + Next.js + Caddy) não deve exceder **500MB em repouso**, permitindo execução suave em VPS de 1GB a 2GB de RAM.
* **RNF-002 (Tempo de Resposta da API)**: Rotas de leitura de dados estruturados devem responder em menos de **100ms** (p95) em ambiente local/VPS.
* **RNF-003 (Eficiência de Banda)**: Nenhuma imagem em alta resolução deve trafegar pelo processo do Fastify. Os uploads e downloads devem ocorrer diretamente pelo storage S3/MinIO.

### 2.2 Disponibilidade e Operação Offline
* **RNF-004 (Offline-First no Mobile)**: O aplicativo React Native deve permitir criação de entradas e anexação de fotos mesmo sem conexão de rede, persistindo localmente e sincronizando com a API assim que a conexão for restabelecida.
* **RNF-005 (Recuperação de Falhas)**: A fila de sincronização mobile deve implementar retentativas exponenciais com jitter em caso de falhas de rede.

### 2.3 Segurança
* **RNF-006 (Armazenamento Seguro de Senhas)**: Senhas devem ser criptografadas utilizando **Argon2id** ou **bcrypt** com fator de custo adequado.
* **RNF-007 (Segurança de Tokens)**: Tokens JWT de acesso devem ter validade máxima de **15 minutos**. Refresh tokens devem ser armazenados como hashes no banco e invalidados após uso (rotação).
* **RNF-008 (Cookies na Web)**: Na plataforma Web, refresh tokens devem trafegar exclusivamente via cookies `HttpOnly`, `Secure` e `SameSite=Strict`.
* **RNF-009 (Headers HTTP)**: O proxy reverso Caddy deve injetar headers de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

### 2.4 Modularidade e Manutenibilidade
* **RNF-010 (Modular Monolith)**: Cada domínio (`auth`, `trips`, `entries`, `media`, `locations`) deve ter limites explícitos. Módulos nunca acessam tabelas ou repositórios internos uns dos outros diretamente.
* **RNF-011 (Contratos Centralizados)**: Todos os schemas de validação e tipos de request/response devem ser compartilhados via pacote `packages/contracts` com Zod.

---

## 3. Restrições de Infraestrutura (VPS de Baixo Custo)

1. **Sem Dependências Pesadas**: Não é permitido o uso de Kubernetes, Kafka, RabbitMQ, Elasticsearch ou múltiplos bancos de dados.
2. **PostgreSQL Otimizado**: O PostgreSQL 16 deve ser configurado com `shared_buffers` limitado (128MB) e número máximo de conexões controlado (max_connections = 50).
3. **Sem Prisma Engine**: Utilizar Drizzle ORM ou Kysely para evitar o runtime pesado em Rust do Prisma Engine (~150MB+ de memória).
4. **Redis Opcional**: O Redis não é obrigatório na fase inicial. Será ativado somente quando filas pesadas ou cache distribuído forem estritamente necessários.
5. **Caddy como Reverse Proxy**: Uso do Caddy em vez de pilhas complexas de Ingress, garantindo emissão automática de SSL/TLS com menos de 30MB de memória.
