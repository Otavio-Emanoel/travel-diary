# Estratégia de Autenticação — Diário de Viagens

Este documento descreve a implementação técnica da autenticação, gestão de sessões e segurança de credenciais.

---

## 1. Visão Geral da Arquitetura de Tokens

A autenticação é híbrida: **Access Token Stateless** (para rapidez nas consultas rotineiras) + **Refresh Token Stateful** (para controle, rotação e revogação).

```text
+-------------------+--------------------+------------------------+
| Tipo de Token     | Validade           | Armazenamento          |
+-------------------+--------------------+------------------------+
| Access Token      | 15 minutos         | Memória / Bearer       |
| Refresh Token     | 30 dias            | PostgreSQL (Hash)      |
+-------------------+--------------------+------------------------+
```

---

## 2. Access Token (JWT)

* **Algoritmo**: `HS256` (HMAC com SHA-256) utilizando segredo de 256 bits (`JWT_ACCESS_SECRET`).
* **Estrutura do Payload**:
```json
{
  "sub": "018e3a2b-7c4d-7a1b-9f0e-3c5b8e2a1b9f",
  "role": "USER",
  "iat": 1788739200,
  "exp": 1788740100
}
```
* **Validação**: Feita inteiramente em memória pelo middleware do Fastify sem consultar o banco de dados.

---

## 3. Refresh Token e Tabela de Sessões

O Refresh Token é uma string aleatória criptograficamente segura gerada no backend:
```typescript
const rawRefreshToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
```

No banco de dados (`sessions`), gravamos apenas o `tokenHash`.

### 3.1 Schema da Tabela `sessions`
* `id` (UUIDv7, Primary Key)
* `user_id` (UUID, Foreign Key para `users.id`, ON DELETE CASCADE)
* `token_hash` (VARCHAR(64), Not Null, Index)
* `device_name` (VARCHAR(100), ex: "iPhone 15 Pro", "Chrome / Ubuntu")
* `ip_address` (VARCHAR(45))
* `expires_at` (TIMESTAMP WITH TIME ZONE)
* `revoked_at` (TIMESTAMP WITH TIME ZONE, Nullable)
* `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 4. Rotação de Tokens e Prevenção contra Roubo

A cada chamada para `/api/v1/auth/refresh`:
1. O backend busca a sessão ativa através do hash do token recebido.
2. Se a sessão existir e `revoked_at` for nulo e `expires_at > NOW()`:
   - A sessão antiga é marcada como revogada (`revoked_at = NOW()`).
   - Uma nova sessão é criada com um novo token.
   - O novo par (Access Token + Refresh Token) é devolvido ao cliente.
3. **Detecção de Ataque**: Se um token já revogado for apresentado, significa que alguém interceptou o token e tentou reutilizá-lo. O backend executa imediatamente:
```sql
UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1;
```
Isso desloga todas as instâncias do usuário imediatamente, protegendo sua conta.

---

## 5. Transporte por Plataforma

### 5.1 Frontend Web (Next.js)
* O Refresh Token é enviado em cookie seguro:
  - `HttpOnly: true` (inacessível para JavaScript, imune a XSS).
  - `Secure: true` (apenas trafega via HTTPS).
  - `SameSite: Strict` (proteção nativa contra CSRF).
  - `Path: /api/v1/auth` (restrito apenas às rotas de autenticação).

### 5.2 Aplicativo Mobile (React Native)
* O Refresh Token é devolvido no corpo JSON e gravado em armazenamento de chaves seguro nativo (`expo-secure-store` ou iOS Keychain / Android Keystore).
* Enviado nas requisições no corpo da chamada de `/refresh`.

---

## 6. Hashing de Senhas

* Algoritmo: **Argon2id** (padrão ouro moderno, resistente a ataques por GPU e ASICs) com parâmetros calibrados para não sobrecarregar a VPS:
  - `memoryCost: 19456` (19MB)
  - `timeCost: 2`
  - `parallelism: 1`
