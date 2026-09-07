# ADR 002: PostgreSQL 16 com Drizzle ORM (Eliminação do Prisma Engine)

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

Para o banco de dados principal, foi especificado o uso de **PostgreSQL**. A escolha da camada de acesso a dados (ORM / Query Builder) no ecossistema TypeScript tem impacto gigantesco no consumo de memória e na estabilidade do servidor em uma VPS de 1GB a 2GB de RAM.

O **Prisma** é o ORM mais popular no ecossistema Node.js, mas sua arquitetura baseia-se em um processo binário auxiliar escrito em Rust (`query-engine`). Em ambientes de produção, esse binário frequentemente consome entre 120MB e 250MB de RAM adicionais, além de introduzir sobrecarga de serialização de IPC (inter-process communication) entre o Node.js e o binário Rust.

---

## 2. Opções Consideradas

1. **Prisma ORM**: DX (Developer Experience) excelente, mas alto consumo de memória e inicialização lenta do engine.
2. **TypeORM**: Baseado em decoradores e reflexão em tempo de execução, API instável e manutenção lenta.
3. **Kysely**: Query builder puramente TypeScript, com tipagem estrita de SQL e overhead zero em tempo de execução.
4. **Drizzle ORM**: ORM moderno e declarativo em TypeScript puro, compilado para SQL direto sem binários intermediários, compatível com o driver `postgres.js` / `pg`, com footprint inferior a 30MB de RAM e geração de migrações segura via Drizzle Kit.

---

## 3. Decisão

Adotar o **PostgreSQL 16** combinado com **Drizzle ORM** (usando o driver `postgres.js`).

Drizzle oferece:
* Schemas declarativos em TypeScript (`schema.ts`).
* Segurança de tipos ponta a ponta sem geração de arquivos gigantescos.
* Desempenho idêntico ao SQL nativo.
* Consumo mínimo de memória (< 30MB), viabilizando a execução estável do backend em VPS pequena.
* Migrações determinísticas geradas com `drizzle-kit generate`.

---

## 4. Consequências

### Pontos Positivos:
* Economia de mais de 150MB de memória RAM no container da API.
* Consultas SQL transparentes, sem magias de joins obscuros.
* Suporte nativo a tipos avançados do PostgreSQL (arrays, JSONB, geolocalização simples).

### Pontos Negativos / Mitigações:
* O Drizzle exige que o desenvolvedor entenda conceitos de SQL tradicional de forma mais explícita do que o Prisma.
* *Mitigação*: Os schemas e queries serão centralizados em repositórios tipados, com utilitários claros para operações comuns.
