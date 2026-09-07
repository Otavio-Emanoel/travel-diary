import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/app-error';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string };
    user: { sub: string; role: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        throw new UnauthorizedError('Token de acesso ausente, inválido ou expirado');
      }
    }
  );
};

export default fp(authPlugin);
