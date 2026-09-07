# Tratamento de Erros — Diário de Viagens

Este documento estabelece o padrão de tratamento centralizado de exceções, catálogo de códigos de erro e a resposta padronizada da API.

---

## 1. Hierarquia de Classes de Erro

Para manter desacoplamento, erros de domínio são classes puras em TypeScript que herdam de `AppError`:

```typescript
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_FAILED';
}

export class StorageError extends AppError {
  readonly statusCode = 502;
  readonly code = 'STORAGE_ERROR';
}
```

---

## 2. Plugin Centralizado de Erros no Fastify (`errorHandler`)

O Fastify intercepta qualquer exceção síncrona ou rejeição de Promise através de seu handler global:

```typescript
fastify.setErrorHandler((error, request, reply) => {
  const requestId = request.id;

  // Erros de Domínio Conhecidos
  if (error instanceof AppError) {
    request.log.warn({ err: error, requestId }, error.message);
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
  }

  // Erros de Validação Zod / Schema Fastify
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Parâmetros da requisição inválidos',
        details: error.validation,
        requestId,
      },
    });
  }

  // Erros Não Tratados (500 Internal Server Error)
  request.log.error({ err: error, requestId }, 'Erro interno não tratado');
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro inesperado em nossos servidores.',
      requestId,
    },
  });
});
```

---

## 3. Catálogo de Códigos de Erro

| Código | HTTP Status | Significado |
| :--- | :---: | :--- |
| `VALIDATION_FAILED` | 400 | Corpo, parâmetros de rota ou query string violam schema Zod |
| `UNAUTHORIZED` | 401 | Token ausente, expirado ou com assinatura inválida |
| `FORBIDDEN` | 403 | O usuário não possui permissão para acessar ou alterar o recurso |
| `NOT_FOUND` | 404 | O recurso especificado (viagem, entrada, foto) não existe |
| `CONFLICT` | 409 | Violação de unicidade (ex.: e-mail já cadastrado, slug duplicado) |
| `FILE_TOO_LARGE` | 413 | Imagem solicitada excede o limite estipulado (15MB) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Tipo MIME não aceito (apenas JPEG, PNG, WebP) |
| `STORAGE_ERROR` | 502 | Falha de comunicação com o MinIO / S3 |
| `INTERNAL_SERVER_ERROR` | 500 | Erro inesperado capturado pelo handler global |
