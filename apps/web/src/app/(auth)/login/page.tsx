'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput, AuthResponse } from '@travel-diary/contracts';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../features/auth/auth-store';
import { Compass, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>(
        '/auth/login',
        data
      );
      if (response.success && response.data) {
        loginStore(response.data.user, response.data.accessToken);
        router.push('/trips');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 hero-gradient">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl shadow-soft border border-stone-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <Compass className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-stone-600 mt-2">
            Acesse suas memórias e diários de viagem
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/80 text-sm transition-all"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/80 text-sm transition-all"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-stone-600">
          Não possui uma conta?{' '}
          <Link
            href="/register"
            className="font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-4"
          >
            Cadastre-se gratuitamente
          </Link>
        </div>
      </div>
    </div>
  );
}
