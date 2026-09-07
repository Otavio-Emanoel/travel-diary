import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '@travel-diary/contracts';

export class AuthController {
  constructor(private readonly service: AuthService = new AuthService()) {}

  private setRefreshTokenCookie(reply: FastifyReply, token: string) {
    reply.setCookie('refresh_token', token, {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
    });
  }

  private clearRefreshTokenCookie(reply: FastifyReply) {
    reply.clearCookie('refresh_token', {
      path: '/api/v1/auth',
    });
  }

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    const signer = {
      sign: (payload: any, options: any) => request.server.jwt.sign(payload, options),
    };
    const result = await this.service.register(request.body, signer);

    if (result.refreshToken) {
      this.setRefreshTokenCookie(reply, result.refreshToken);
    }

    return reply.status(201).send({
      success: true,
      data: result,
    });
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    const signer = {
      sign: (payload: any, options: any) => request.server.jwt.sign(payload, options),
    };
    const meta = {
      deviceName: request.headers['user-agent'],
      ipAddress: request.ip,
    };

    const result = await this.service.login(request.body, signer, meta);

    if (result.refreshToken) {
      this.setRefreshTokenCookie(reply, result.refreshToken);
    }

    return reply.status(200).send({
      success: true,
      data: result,
    });
  }

  async refresh(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ) {
    const signer = {
      sign: (payload: any, options: any) => request.server.jwt.sign(payload, options),
    };

    // Lê o refresh token do cookie (Web) ou do corpo da requisição (Mobile)
    const token =
      request.cookies.refresh_token || (request.body && request.body.refreshToken);

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token ausente',
        },
      });
    }

    const meta = {
      deviceName: request.headers['user-agent'],
      ipAddress: request.ip,
    };

    const result = await this.service.refreshToken(token, signer, meta);

    this.setRefreshTokenCookie(reply, result.refreshToken);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  }

  async logout(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ) {
    const token =
      request.cookies.refresh_token || (request.body && request.body.refreshToken);

    if (token) {
      await this.service.logout(token);
    }

    this.clearRefreshTokenCookie(reply);

    return reply.status(200).send({
      success: true,
      data: { message: 'Sessão encerrada com sucesso' },
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).sub;
    const user = await this.service.getMe(userId);

    return reply.status(200).send({
      success: true,
      data: user,
    });
  }
}
