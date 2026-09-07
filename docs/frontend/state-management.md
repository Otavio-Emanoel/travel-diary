# Gerenciamento de Estado no Frontend — Diário de Viagens

Este documento descreve a separação estrita entre **Server State** (estado do servidor) e **Client UI State** (estado transitório da interface).

---

## 1. Separação de Responsabilidades

```text
+------------------------+--------------------------+----------------------------+
| Tipo de Estado         | Ferramenta               | Exemplos                   |
+------------------------+--------------------------+----------------------------+
| Server State (Dados)   | TanStack Query v5        | Viagens, entradas, fotos   |
| Client UI State (Tela) | Zustand                  | Modal aberto, filtros, tab |
| Form State             | React Hook Form + Zod    | Criação de entrada/viagem  |
+------------------------+--------------------------+----------------------------+
```

---

## 2. Server State com TanStack Query (React Query)

O TanStack Query gerencia o ciclo de vida dos dados remotos, cache automático, deduplicação de requisições e mutações otimistas.

### 2.1 Padrão de Query Keys
Todas as chaves de query são organizadas como tuplas tipadas via fábrica de chaves (`queryKeyFactory`):
```typescript
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: TripFilters) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
  timeline: (id: string) => [...tripKeys.detail(id), 'timeline'] as const,
};
```

### 2.2 Atualizações Otimistas (*Optimistic Updates*)
Ao adicionar uma nota rápida na timeline, a interface é atualizada imediatamente antes mesmo da resposta do servidor:
```typescript
export function useCreateEntryMutation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newEntry: CreateEntryInput) => entriesApi.create(tripId, newEntry),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: tripKeys.timeline(tripId) });
      const previousTimeline = queryClient.getQueryData(tripKeys.timeline(tripId));

      // Atualiza o cache local imediatamente com ID temporário
      queryClient.setQueryData(tripKeys.timeline(tripId), (old: any) => ({
        ...old,
        entries: [{ id: 'temp-id', ...newEntry, createdAt: new Date().toISOString() }, ...old.entries],
      }));

      return { previousTimeline };
    },
    onError: (err, newEntry, context) => {
      // Reverte em caso de erro
      if (context?.previousTimeline) {
        queryClient.setQueryData(tripKeys.timeline(tripId), context.previousTimeline);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.timeline(tripId) });
    },
  });
}
```

---

## 3. Client UI State com Zustand

Estados puramente locais e transitórios da interface são gerenciados por stores enxutas do **Zustand**:

```typescript
import { create } from 'zustand';

interface TripUIStore {
  activeView: 'TIMELINE' | 'MAP' | 'SPLIT';
  selectedEntryId: string | null;
  isCreateModalOpen: boolean;
  setActiveView: (view: 'TIMELINE' | 'MAP' | 'SPLIT') => void;
  setSelectedEntryId: (id: string | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

export const useTripUIStore = create<TripUIStore>((set) => ({
  activeView: 'SPLIT',
  selectedEntryId: null,
  isCreateModalOpen: false,
  setActiveView: (activeView) => set({ activeView }),
  setSelectedEntryId: (selectedEntryId) => set({ selectedEntryId }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));
```

---

## 4. Validação de Formulários com Zod Compartilhado

Os formulários utilizam `react-hook-form` integrado com `@hookform/resolvers/zod`, consumindo diretamente os schemas definidos no pacote `@travel-diary/contracts`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTripSchema, type CreateTripInput } from '@travel-diary/contracts';

export function useCreateTripForm() {
  return useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'PLANNED',
    },
  });
}
```
Essa abordagem garante que qualquer regra adicionada no backend é imediatamente refletida e validada na interface.
