# ADR 006: Estrutura de Monorepo com pnpm Workspaces

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

O projeto engloba múltiplos pacotes e aplicações:
* Backend (`apps/api`)
* Frontend Web (`apps/web`)
* Mobile (`apps/mobile`)
* Contratos e Tipos Compartilhados (`packages/contracts`, `packages/types`, `packages/config`)

Era necessário definir a ferramenta de orquestração do monorepo sem introduzir complexidade desnecessária ou dependências infladas na VPS.

---

## 2. Opções Consideradas

1. **Repositórios Separados (Polyrepo)**: Um repositório Git para cada projeto. Torna o compartilhamento de contratos Zod e tipos extremamente custoso (exigiria publicação de pacotes no npm a cada mudança).
2. **Turborepo / Nx**: Ferramentas consolidadas com cache de build distribuído, mas adicionam camadas proprietárias de configuração e pipelines que não agregam valor imediato em um projeto com foco em simplicidade e execução em VPS modesta.
3. **pnpm Workspaces Nativo**: Suporte embutido do próprio gerenciador de pacotes `pnpm` para monorepos, com resolução por symlinks locais (`workspace:*`), deduplicação de dependências por hardlinks e velocidade recorde de instalação.

---

## 3. Decisão

Adotar o **pnpm Workspaces Nativo** através do arquivo `pnpm-workspace.yaml`.

Não introduziremos Turborepo ou Nx na fase inicial. O pnpm resolve com perfeição:
* Compartilhamento de contratos Zod em tempo real entre API, Web e Mobile.
* Scripts recursivos de build, teste e linting (`pnpm --recursive run ...`).
* Economia drástica de espaço em disco na VPS graças ao armazenamento content-addressable por hardlinks.

---

## 4. Consequências

### Pontos Positivos:
* Zero dependência de softwares ou plugins externos de monorepo.
* Instalação de dependências rápida e determinística.
* Facilidade para migrar para Turborepo no futuro se o número de projetos crescer significativamente.

### Pontos Negativos / Mitigações:
* O cache de tarefas em disco precisa ser gerenciado via scripts do package.json.
* *Mitigação*: Como as aplicações são enxutas, os tempos de build já são inferiores a 30 segundos, não justificando a sobrecarga de caches complexos.
