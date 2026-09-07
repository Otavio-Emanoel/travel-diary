# ADR 004: Autenticação Stateless (JWT Curto) com Refresh Tokens Rotativos

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

O sistema precisa atender tanto clientes Web (Next.js) quanto Mobile (React Native). A autenticação deve ser segura contra ataques XSS e CSRF, permitir revogação imediata de sessões comprometidas e não sobrecarregar o banco de dados a cada requisição de leitura da API.

---

## 2. Opções Consideradas

1. **Sessões 100% Stateful no Banco (ou Redis)**: Cada requisição HTTP precisa consultar o banco de dados ou Redis para validar a sessão. Gera I/O excessivo.
2. **Tokens JWT Puros de Longa Duração (Sem Refresh Token)**: Práticos, mas impossíveis de revogar antes da expiração caso um token seja vazado.
3. **Padrão Híbrido: Access Token JWT Curto (15m) + Refresh Token Rotativo no Banco (30d)**: O Access Token é validado localmente pela chave criptográfica sem consulta ao banco (alta performance). O Refresh Token é persistido no banco e renova o par de tokens periodicamente.

---

## 3. Decisão

Adotar o **Padrão Híbrido com Rotação de Refresh Token**.

* **Access Token**: JWT assinado com HMAC-SHA256, validade de 15 minutos, contendo apenas `{ sub: userId, role: role }`.
* **Refresh Token**: String criptográfica de 64 caracteres gerada via `crypto.randomBytes(32).toString('hex')`. O hash SHA-256 do token é salvo na tabela `sessions` com `user_id`, `device_info`, `expires_at` e `revoked_at`.
* **Canal Web**: Cookies `HttpOnly`, `Secure` e `SameSite=Strict`. Evita roubo via XSS no navegador.
* **Canal Mobile**: Armazenamento seguro nativo (`SecureStore` no iOS Keychain / Android Keystore) e envio via cabeçalho `Authorization: Bearer <token>`.
* **Detecção de Roubo de Token (Family Invalidation)**: Se um refresh token já rotacionado/revogado for apresentado novamente, o sistema assume que o token foi interceptado e revoga imediatamente todas as sessões ativas do usuário.

---

## 4. Consequências

### Pontos Positivos:
* Excelente performance para rotas autenticadas (validação criptográfica local na API Fastify).
* Capacidade real de revogação de sessão no logout ou em caso de perda do celular.
* Rastreabilidade de sessões por dispositivo.

### Pontos Negativos / Mitigações:
* Clientes precisam lidar com a expiração do Access Token (erro 401) e acionar a rota de `/refresh` automaticamente.
* *Mitigação*: Implementação de interceptores padronizados no `api-client` do Next.js e React Native (Axios/Ky/Fetch wrapper).
