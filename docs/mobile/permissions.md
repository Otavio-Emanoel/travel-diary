# Permissões e Integrações Nativas — Diário de Viagens

Este documento detalha o tratamento de permissões nativas de hardware no aplicativo móvel (Câmera, Galeria de Fotos e Localização GPS).

---

## 1. Princípio da Degradação Graciosa

O aplicativo nunca deve travar ou bloquear o uso caso o usuário negue uma permissão do sistema operacional. Todas as funcionalidades possuem fallbacks manuais elegantes:

| Recurso | Permissão Nativa | Comportamento se Permitido | Fallback se Negado |
| :--- | :--- | :--- | :--- |
| **Câmera** | `CAMERA` | Abre o viewfinder nativo para captura instantânea de foto | Permite selecionar uma foto já existente da galeria |
| **Galeria** | `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | Abre o seletor nativo de fotos do sistema | Permite registrar a nota em texto puro sem fotos |
| **GPS** | `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Preenche automaticamente cidade, país e coordenadas exatas | Exibe campo de busca de texto para o usuário digitar o nome do local manualmente |

---

## 2. Fluxo de Solicitação Justificada (*Contextual Permissions*)

Nunca solicitamos permissões em bloco na inicialização do aplicativo (*onboarding*). As permissões são solicitadas no exato momento de sua utilização (*Just-in-Time*), acompanhadas de um modal explicativo:

```text
[ Usuário toca em "Adicionar Localização" ]
                   │
                   ▼
       { Permissão já concedida? }
        ├── Sim ──> Obtém coordenadas GPS imediatamente
        └── Não ──> Exibe modal contextual amigável:
                    "Para marcar onde você está nesta entrada do diário,
                     o aplicativo precisa de acesso à sua localização."
                         │
                         ▼
                    [ Botão "Permitir" ]
                         │
                         ▼
              Solicita API nativa do OS
```

---

## 3. Otimização de Bateria e Precisão de GPS

* **Apenas Foreground**: O aplicativo não requisita permissão de localização em segundo plano (`ACCESS_BACKGROUND_LOCATION`). Isso economiza bateria do smartphone do viajante e respeita sua privacidade.
* **Timeout e Cache Rápido**: A requisição de GPS é configurada com:
  - `accuracy: LocationAccuracy.Balanced` (precisão de ~100m, suficiente para cidades e bairros).
  - `timeout: 8000ms` (8 segundos).
  - `maximumAge: 60000ms` (aceita coordenadas em cache de até 1 minuto para resposta instantânea).
