# Navegação Mobile — Diário de Viagens

Este documento detalha o mapa de navegação, pilhas (*stacks*), abas (*tabs*) e rotas profundas (*deep linking*) no aplicativo React Native.

---

## 1. Estrutura das Árvores de Navegação

A navegação é dividida em dois fluxos raiz controlados pelo estado de autenticação:

```text
RootNavigator
 ├── AuthStack (Se não autenticado)
 │    ├── LoginScreen
 │    ├── RegisterScreen
 │    └── ForgotPasswordScreen
 │
 └── MainTabNavigator (Se autenticado)
      ├── TripsTab (Stack)
      │    ├── TripsListScreen
      │    ├── TripDetailScreen (Timeline)
      │    ├── TripMapScreen (Mapa da Viagem)
      │    ├── TripGalleryScreen (Galeria de Fotos)
      │    └── EditTripScreen
      │
      ├── QuickEntryModal (Botão central "+" de ação rápida)
      │    ├── CaptureEntryScreen (Nota rápida + foto da câmera)
      │    └── SelectTripScreen (Se houver mais de uma viagem ativa)
      │
      └── ProfileTab (Stack)
           ├── ProfileScreen
           ├── OfflineSyncStatusScreen (Visualização da fila)
           └── SettingsScreen
```

---

## 2. O Botão Central de Registro Rápido ("Quick Entry")

Durante uma viagem, o usuário precisa registrar um acontecimento ou tirar uma foto em menos de 5 segundos.

* O botão central da barra de abas (`BottomTabBar`) é destacado visualmente.
* Ao tocar no botão, uma tela modal de alta velocidade é aberta diretamente com o teclado em foco e atalhos rápidos para ativar a câmera ou anexar localização por GPS.
* Os dados são salvos no banco SQLite local em milissegundos, liberando o usuário para guardar o celular no bolso imediatamente.

---

## 3. Deep Linking e Esquema de URLs

O app responde ao esquema de URI nativo `traveldiary://`:

* `traveldiary://trips/:id`: Abre a visualização da viagem especificada.
* `traveldiary://trips/p/:shareToken`: Abre a visualização de uma viagem compartilhada.
* `traveldiary://sync`: Abre a tela de monitoramento da fila de sincronização.
