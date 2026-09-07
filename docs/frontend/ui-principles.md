# Princípios de UI & Design — Diário de Viagens

Este documento estabelece as diretrizes visuais, sistema de design, escolha de componentes e ergonomia da interface web.

---

## 1. Filosofia Visual e Estética

O design do Diário de Viagens deve transmitir uma sensação **editorial, acolhedora e moderna**, lembrando cadernos de viagem físicos sofisticados combinados com o refinamento da web contemporânea.

* **Anti-Genérico**: Proibido o uso de cores primárias puras ou botões padrão de bootstrap. A paleta é harmoniosa, baseada em tons terrosos, ardósia e toques vibrantes de âmbar e esmeralda.
* **Tipografia Elegante**:
  - Títulos: Fonte Serif moderna com personalidade (ex.: *Playfair Display*, *Newsreader* ou *Fraunces* do Google Fonts).
  - Textos de Leitura e UI: Sans-serif geométrica limpa e altamente legível (ex.: *Inter* ou *Plus Jakarta Sans*).
* **Profundidade e Textura**: Efeito suave de glassmorphism em barras flutuantes (`backdrop-blur-md`), sombras suaves (`shadow-sm`, `shadow-md`) e bordas delicadas (`border-stone-200` / dark: `border-stone-800`).

---

## 2. Paleta de Cores do Design System

```css
/* Tokens Tailwind / CSS Variables */
:root {
  /* Tons Principais (Earth & Slate) */
  --color-canvas: #faf8f5;        /* Fundo aconchegante estilo papel premium */
  --color-surface: #ffffff;       /* Cards e superfícies elevadas */
  --color-text-primary: #1c1917;  /* Stone-900 para contraste e leitura suave */
  --color-text-muted: #78716c;    /* Stone-500 para notas e metadados */
  
  /* Acentos de Destaque */
  --color-brand: #d97706;         /* Âmbar caloroso (pôr do sol / aventura) */
  --color-brand-hover: #b45309;
  --color-accent-forest: #059669; /* Verde esmeralda para natureza e trilhas */
  --color-accent-ocean: #0284c7;  /* Azul para litoral e deslocamentos marítimos */
}

.dark {
  --color-canvas: #121110;
  --color-surface: #1c1917;
  --color-text-primary: #f5f5f4;
  --color-text-muted: #a8a29e;
}
```

---

## 3. Mapa Interativo com Custo Zero de API (MapLibre / Leaflet)

* **Eliminação de Custos com Google Maps**: As APIs do Google Maps cobram quantias significativas após poucas requisições. Para manter o sistema 100% viável e auto-hospedável, utilizamos **MapLibre GL** ou **Leaflet** com tiles vetoriais abertos do OpenStreetMap e CartoDB Positron/Voyager.
* **Marcadores Dinâmicos**: Pins interativos que exibem a miniatura da foto tirada naquele exato ponto geográfico.
* **Traçado de Rota**: Polyline animada conectando as paradas em ordem temporal, permitindo que o usuário visualize toda a jornada percorrida.

---

## 4. Micro-interações e Animações

* **Transições Suaves**: Uso de Framer Motion / Tailwind Transitions com duração entre `150ms` e `300ms` (`ease-out`).
* **Hover States nos Cards de Viagem**: Leve elevação (`translate-y-[-2px]`), realce suave da foto de capa e iluminação de borda.
* **Feedback de Ação**: Toasts discretos (via `sonner`) para confirmações de salvamento de notas e uploads de fotos.

---

## 5. Acessibilidade (a11y) e Ergonomia

* **Alvos de Toque (*Tap Targets*)**: Todos os botões e áreas clicáveis possuem tamanho mínimo de `44x44px`.
* **Navegação por Teclado**: Estados de foco visíveis (`focus-visible:ring-2 focus-visible:ring-amber-500`).
* **Contraste de Cores**: Relação de contraste mínima de `4.5:1` para texto normal conforme diretrizes WCAG AA.
