# ADR 001: Adoção da Arquitetura de Monólito Modular (Modular Monolith)

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

O projeto Diário de Viagens precisa ser executado de forma enxuta e estável em um servidor VPS de recursos reduzidos (1GB a 2GB de RAM), enquanto mantém a capacidade de crescer de 1 para dezenas de milhares de usuários sem necessidade de reescrita completa.

Arquiteturas de microserviços trazem latência de rede adicional, sobrecarga de memória (cada serviço exige seu próprio runtime Node.js de ~60MB+), complexidade de transações distribuídas (Sagas) e necessidade de orquestração (Kubernetes). Por outro lado, um monólito tradicional desestruturado tende a se transformar em uma "grande bola de lama" (*Big Ball of Mud*), onde controllers e modelos se entrelaçam de forma caótica.

---

## 2. Opções Consideradas

1. **Microserviços Distribuídos**: Criar serviços independentes (`auth-service`, `trip-service`, `media-service`, etc.) com gRPC ou HTTP interno.
2. **Monólito Tradicional**: Aplicação com separação clássica em pastas genéricas (`controllers/`, `services/`, `models/`).
3. **Monólito Modular (*Modular Monolith*)**: Único processo executável, mas com isolamento rígido por módulos de domínio (`modules/auth`, `modules/trips`, etc.), comunicação restrita a contratos/interfaces públicas e proibição de acoplamento direto de persistência.

---

## 3. Decisão

Adotar o **Monólito Modular**.

O backend será construído como uma única aplicação Fastify, porém subdividida em módulos de negócio autocontidos. Cada módulo possui seus próprios controllers, regras de domínio e repositórios. Nenhum módulo pode realizar queries em tabelas de outro módulo. A comunicação é feita por contratos de serviço ou eventos de domínio em memória.

---

## 4. Consequências

### Pontos Positivos:
* **Consumo de Memória Reduzido**: Um único processo Fastify consome ~50MB a 90MB de RAM, perfeito para VPS pequena.
* **Simplicidade Operacional**: Um único artefato de build, um único container Docker e deploy trivial.
* **Transações ACID Locais**: Facilidade de manter consistência de dados no PostgreSQL sem transações distribuídas.
* **Caminho Claro para Extração**: Caso um módulo específico (ex.: `media`) precise de escala independente no futuro, os limites já estão demarcados, permitindo extração rápida sem refatorar o restante do sistema.

### Pontos Negativos / Mitigações:
* **Risco de Vazamento de Dependência**: Desenvolvedores podem ser tentados a importar classes internas de outro módulo.
* *Mitigação*: Configuração de regras de ESLint (`eslint-plugin-import` com `no-restricted-paths`) para barrar imports cruzados fora das interfaces públicas expostas na raiz de cada módulo.
