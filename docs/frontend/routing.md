# Roteamento e Navegação Web — Diário de Viagens

Este documento detalha o mapa de rotas da aplicação Next.js, a proteção de navegação e os fluxos de acesso.

---

## 1. Mapa Completo de Rotas

| Rota URL | Tipo de Acesso | Componente de Página | Finalidade |
| :--- | :--- | :--- | :--- |
| `/` | Público | `src/app/page.tsx` | Apresentação do produto e chamada para cadastro |
| `/login` | Público (Redireciona se autenticado) | `src/app/(auth)/login/page.tsx` | Formulário de login de usuários |
| `/register` | Público (Redireciona se autenticado) | `src/app/(auth)/register/page.tsx` | Formulário de criação de conta |
| `/trips` | **Protegido** | `src/app/(dashboard)/trips/page.tsx` | Dashboard com lista de viagens do usuário |
| `/trips/new` | **Protegido** | `src/app/(dashboard)/trips/new/page.tsx` | Formulário de criação de nova viagem |
| `/trips/[id]` | **Protegido / Público condicional** | `src/app/(dashboard)/trips/[id]/page.tsx` | Página principal da viagem (Timeline e Mapa) |
| `/trips/[id]/edit`| **Protegido (Dono)** | `src/app/(dashboard)/trips/[id]/edit/page.tsx`| Edição de datas, capa e título |
| `/trips/p/[shareToken]`| Público (Link secreto) | `src/app/trips/p/[shareToken]/page.tsx` | Visualização pública/compartilhada da viagem |
| `/profile` | **Protegido** | `src/app/(dashboard)/profile/page.tsx` | Gerenciamento de perfil e credenciais |

---

## 2. Middleware de Proteção de Rotas (`middleware.ts`)

O Next.js utiliza um middleware leve executado no Edge para interceptar rotas protegidas antes da renderização:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

const PROTECTED_ROUTES = ['/trips', '/profile'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has('refresh_token');

  // Redireciona usuário desautenticado tentando acessar área privada
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona usuário autenticado tentando acessar login/cadastro
  if (AUTH_ROUTES.some((route) => pathname === route) && hasRefreshToken) {
    return NextResponse.redirect(new URL('/trips', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 3. Estratégia de Carregamento e Suspense

* **Página de Detalhes da Viagem (`/trips/[id]`)**:
  - O cabeçalho da viagem e o esqueleto da timeline são renderizados imediatamente via SSR.
  - O componente de mapa (`<InteractiveMap />`) é carregado com `React.lazy` / `dynamic({ ssr: false })` dentro de uma fronteira de `<Suspense>`, pois bibliotecas de mapas (Leaflet / MapLibre) necessitam do objeto `window` do navegador.
