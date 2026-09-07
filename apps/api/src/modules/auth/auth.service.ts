import crypto from 'crypto';
import argon2 from 'argon2';
import { AuthRepository } from './auth.repository';
import {
  RegisterInput,
  LoginInput,
  UserProfile,
  AuthResponse,
} from '@travel-diary/contracts';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../core/errors/app-error';

export interface TokenSigner {
  sign(payload: { sub: string; role: string }, options?: { expiresIn?: string }): string;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository = new AuthRepository(),
    private readonly tokenSigner?: TokenSigner
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private mapUserToProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role as 'USER' | 'ADMIN',
      createdAt: user.createdAt.toISOString(),
    };
  }

  async register(input: RegisterInput, signer: TokenSigner): Promise<AuthResponse> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail');
    }

    const passwordHash = await argon2.hash(input.password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const userId = crypto.randomUUID();
    const user = await this.repository.createUser({
      id: userId,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      name: input.name.trim(),
      role: 'USER',
      isActive: true,
    });

    const accessToken = signer.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await this.repository.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      user: this.mapUserToProfile(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(
    input: LoginInput,
    signer: TokenSigner,
    meta?: { deviceName?: string; ipAddress?: string }
  ): Promise<AuthResponse> {
    const user = await this.repository.findUserByEmail(input.email.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const accessToken = signer.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.repository.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      deviceName: meta?.deviceName,
      ipAddress: meta?.ipAddress,
      expiresAt,
    });

    return {
      user: this.mapUserToProfile(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refreshToken(
    rawRefreshToken: string,
    signer: TokenSigner,
    meta?: { deviceName?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.repository.findSessionByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedError('Sessão não encontrada');
    }

    // Se o token já foi revogado, detectamos potencial roubo e revogamos todas as sessões do usuário
    if (session.revokedAt) {
      await this.repository.revokeAllUserSessions(session.userId);
      throw new UnauthorizedError('Sessão comprometida. Todas as conexões foram deslogadas por segurança.');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    const user = await this.repository.findUserById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuário inativo ou inexistente');
    }

    // Rotação: revoga a sessão atual e emite um novo token
    await this.repository.revokeSession(session.id);

    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.repository.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: newTokenHash,
      deviceName: meta?.deviceName || session.deviceName,
      ipAddress: meta?.ipAddress,
      expiresAt,
    });

    const accessToken = signer.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '15m' }
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.repository.findSessionByTokenHash(tokenHash);
    if (session) {
      await this.repository.revokeSession(session.id);
    }
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return this.mapUserToProfile(user);
  }
}
