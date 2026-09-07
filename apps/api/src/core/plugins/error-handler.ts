import { FastifyInstance, FastifyPluginAsync, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../errors/app-error';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
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
        message: 'Ocorreu um erro inesperado nos servidores.',
        requestId,
      },
    });
  });
};

export default fp(errorHandlerPlugin);
