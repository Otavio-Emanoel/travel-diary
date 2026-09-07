# Catálogo de Funcionalidades — Diário de Viagens

Este documento detalha o conjunto de funcionalidades do sistema **Diário de Viagens**, separadas entre as funcionalidades do **MVP (Fase Atual)** e as **Funcionalidades Futuras**.

---

## 1. Funcionalidades do MVP (Fase Atual)

### 1.1 Autenticação e Perfil de Usuário
* **Cadastro Simples**: Registro rápido com e-mail, nome e senha forte.
* **Sessão Multi-Dispositivo**: Login seguro e sincronização contínua entre Web e Mobile com refresh tokens rotativos.
* **Perfil Pessoal**: Visualização de viagens ativas, concluídas e estatísticas básicas (número de países/destinos visitados).

### 1.2 Gestão Completa de Viagens
* **Criação de Viagem**: Título, descrição, datas de partida e retorno, foto de capa.
* **Status da Viagem**: Classificação automática ou manual em:
  - `PLANNED` (Planejada)
  - `ONGOING` (Em andamento)
  - `COMPLETED` (Concluída)
* **Destinos da Viagem**: Cadastro de cidades e países visitados com ordenação sequencial do itinerário.
* **Capa e Mídia Principal**: Seleção de foto de destaque para a capa da viagem.

### 1.3 Registro Cronológico (Dias e Entradas)
* **Agrupamento por Dias (`TripDay`)**: Cada viagem é dividida em dias corridos, facilitando o diário de bordo.
* **Entradas de Diário (`Entry`)**:
  - Título da entrada.
  - Horário de registro.
  - Categoria: `TRAVEL` (deslocamento), `FOOD` (gastronomia), `ACTIVITY` (passeio/atração), `LODGING` (hospedagem), `JOURNAL` (reflexão geral).
  - Conteúdo rico em formato Markdown (notas, avaliações, custos, memórias).
* **Geolocalização da Entrada**: Fixação do local onde o evento ocorreu (latitude, longitude, nome do local e endereço legível).

### 1.4 Fotos e Mídia
* **Upload Direto Otimizado**: O cliente sobe a foto diretamente para o MinIO/S3 via URL pré-assinada, sem gastar memória ou banda do backend.
* **Galeria por Entrada**: Miniaturas organizadas em carrossel e grade na entrada correspondente.
* **Metadados de Foto**: Extração de dimensões (largura/altura), data de captura (EXIF) e formato (JPEG/PNG/WebP).

### 1.5 Visualizações Ricas (Timeline e Mapa)
* **Linha do Tempo Interativa**:
  - Exibição sequencial dia a dia com fotos em destaque e notas de diário.
  - Indicadores visuais de transporte e deslocamentos.
* **Mapa Interativo (MapLibre / Leaflet)**:
  - Marcação de todos os destinos e paradas georreferenciadas da viagem.
  - Linhas conectando os pontos de parada para visualizar a rota percorrida.
  - Zero custo de API externa (utilização de tiles abertos OpenStreetMap).

### 1.6 Suporte Offline Mobile (React Native)
* **Criação e Edição Desconectado**: Todas as notas e fotos tiradas sem internet são salvas no banco SQLite local do aparelho.
* **Fila de Sincronização Transparente**: Assim que o celular detecta rede (Wi-Fi ou 4G/5G), a fila é processada em segundo plano, enviando dados e fotos automaticamente para a nuvem.

---

## 2. Funcionalidades Futuras (Roadmap Pós-MVP)

### 2.1 Compartilhamento e Viagens Públicas
* **Links Públicos de Viagem**: Geração de URL amigável (`/trips/p/:shareToken`) para amigos e familiares acompanharem o diário sem precisar de login.
* **Privacidade Granular**: Configuração de viagens como `PRIVATE` (somente dono), `UNLISTED` (quem tiver o link secreto) ou `PUBLIC` (perfil público).

### 2.2 Colaboração em Grupo
* **Viagens Compartilhadas**: Capacidade de múltiplos viajantes participarem da mesma viagem, adicionando suas próprias fotos e relatos.
* **Atribuição de Autoria**: Identificação clara de quem escreveu cada entrada ou enviou cada foto.

### 2.3 Estatísticas e Retrospectivas
* **Painel de Memórias (Year in Review)**: Resumo visual de quantos quilômetros foram percorridos, quantos dias foram viajados e quais países foram explorados.
* **Exportação para PDF / Livro de Memórias**: Geração de um PDF diagramado do diário de viagem para impressão física.

### 2.4 Reconhecimento Automático de Itinerário
* **Leitura de EXIF em Lote**: Quando o usuário seleciona 20 fotos do rolo da câmera, o app infere automaticamente os locais e horários para pré-montar os dias da viagem.
