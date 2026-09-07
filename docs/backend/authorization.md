# Modelo de Autorização — Diário de Viagens

Este documento detalha as políticas de controle de acesso (ACL / RBAC) e permissões granulares por recurso.

---

## 1. Níveis de Acesso e Papéis

O sistema opera com uma combinação de **Papel Global de Usuário** e **Permissões Granulares por Viagem**.

### 1.1 Papéis Globais
* `USER`: Viajante padrão. Pode gerenciar suas próprias viagens, criar entradas e fazer uploads.
* `ADMIN`: Operador do sistema. Pode visualizar status geral, auditar métricas e intervir em abusos de armazenamento.

---

## 2. Permissões por Viagem (Trip-Level Authorization)

Cada viagem possui um proprietário exclusivo (`owner_id`) e, futuramente, colaboradores convidados com papéis específicos.

| Papel na Viagem | Visualizar Viagem | Criar/Editar Entradas | Fazer Upload de Mídia | Editar Dados da Viagem | Excluir Viagem | Convidar Outros |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Owner** (Proprietário) | Sim | Sim | Sim | Sim | Sim | Sim |
| **Editor** (Colaborador) | Sim | Sim | Sim | Não | Não | Não |
| **Viewer** (Leitor) | Sim | Não | Não | Não | Não | Não |
| **Público** (Via Link) | Sim | Não | Não | Não | Não | Não |

---

## 3. Matriz de Decisão de Acesso a Recursos

Para qualquer operação em uma viagem, entrada ou foto, o backend executa asserções na camada de serviço:

```typescript
export class TripAuthorizationPolicy {
  static canView(trip: Trip, userId?: string, shareToken?: string): boolean {
    if (trip.visibility === 'PUBLIC') return true;
    if (shareToken && trip.shareToken === shareToken) return true;
    if (!userId) return false;
    if (trip.userId === userId) return true;
    return false; // Ou checa tabela trip_shares na Fase 9
  }

  static canEdit(trip: Trip, userId: string): boolean {
    if (trip.userId === userId) return true;
    return false; // Ou checa se é colaborador EDITOR na Fase 9
  }

  static canDelete(trip: Trip, userId: string): boolean {
    return trip.userId === userId; // Apenas o dono pode deletar a viagem
  }
}
```

---

## 4. Proteção de Mídia e Isolamento Multi-inquilino

* **Mídia Órfã**: O usuário só pode anexar uma foto a uma entrada se ele for o dono daquela mídia e tiver permissão de edição na viagem correspondente.
* **URLs de Download**: As URLs pré-assinadas de visualização de mídia só são geradas se o solicitante passar na checagem de autorização da viagem associada.
