# ADR 005: Estratégia Mobile Offline-First com SQLite Local e Sync Queue

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

Viajantes frequentemente ficam sem conexão de rede durante deslocamentos (voos, trens, estradas remotas e trilhas). Se o aplicativo mobile depender de requisições de rede síncronas para criar viagens, registrar entradas ou salvar fotos, a experiência do usuário será severamente prejudicada com perda de relatos e frustração.

---

## 2. Opções Consideradas

1. **Apenas Cache de Leitura**: O app só salva em cache o que já foi lido da rede. Não permite criar nada offline.
2. **Frameworks Complexos de CRDTs / CouchDB / PouchDB**: Permitem sincronização bidirecional complexa e fusão de conflitos campo a campo, mas adicionam dependências gigantescas no bundle do React Native, são difíceis de depurar e desnecessários para diários pessoais.
3. **SQLite Local com Fila Sequencial de Mutações (Sync Queue)**: Persistência local imediata em SQLite; todas as criações e edições ganham status local (`PENDING_CREATE`, `PENDING_UPDATE`, `PENDING_DELETE`). Uma fila de sincronização em segundo plano processa as mutações quando a rede estiver disponível.

---

## 3. Decisão

Adotar a **Estratégia de SQLite Local com Fila de Sincronização (Sync Queue)**.

* **Armazenamento Local**: SQLite nativo via biblioteca leve (`expo-sqlite` ou `@op-engineering/op-sqlite`).
* **Identificadores Distribuídos**: Geração de identificadores únicos no cliente utilizando **UUIDv7** (que já inclui timestamp ordenável por natureza). Isso permite que o cliente crie registros localmente sem depender do ID gerado pelo PostgreSQL do servidor.
* **Resolução de Conflitos**: Estratégia **Last Write Wins (LWW)** orientada pelo campo `updated_at` (em milissegundos UTC).
* **Fila de Upload de Imagens**:
  1. A foto é salva no armazenamento local do dispositivo.
  2. Um registro na tabela local `pending_media` é enfileirado.
  3. Quando a rede estiver ativa, o worker mobile requisita a presigned URL, faz o upload do arquivo binário e confirma com o backend.

---

## 4. Consequências

### Pontos Positivos:
* A aplicação mobile tem tempo de resposta de 0ms (UI otimista instantânea) para criação e edição.
* Zero perda de dados durante viagens sem sinal de celular.
* Complexidade de código controlada e fácil de testar unitariamente.

### Pontos Negativos / Mitigações:
* O viajante pode editar o mesmo texto no navegador e no celular simultaneamente enquanto estiver offline.
* *Mitigação*: Como o diário de viagens no MVP é individual (monousuário por viagem), conflitos de edição simultânea são raríssimos. A estratégia LWW baseada no timestamp `updated_at` resolve esses casos com elegância.
