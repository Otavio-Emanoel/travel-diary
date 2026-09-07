'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTripSchema, CreateTripInput } from '@travel-diary/contracts';
import { api } from '../../../../lib/api-client';
import { ArrowLeft, Loader2, Compass, AlertCircle } from 'lucide-react';

export default function NewTripPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'PLANNED',
      visibility: 'PRIVATE',
    },
  });

  const onSubmit = async (data: CreateTripInput) => {
    setErrorMessage(null);
    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>(
        '/trips',
        data
      );
      if (res.success && res.data) {
        router.push(`/trips/${res.data.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar viagem');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Botão Voltar */}
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Minhas Viagens</span>
      </Link>

      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-soft">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Criar Nova Viagem
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Preencha os detalhes básicos do seu itinerário. Você poderá adicionar destinos e relatos em seguida.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Título da Viagem *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Ex: Mochilão pela Patagônia ou Férias na Itália"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Descrição / Resumo
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Notas gerais, companheiros de viagem, expectativas..."
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Data de Início *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
              />
              {errors.startDate && (
                <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Data de Término (Opcional)
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
              />
              {errors.endDate && (
                <p className="text-xs text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Status e Visibilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
              >
                <option value="PLANNED">Planejada</option>
                <option value="ONGOING">Em Andamento</option>
                <option value="COMPLETED">Concluída</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Visibilidade
              </label>
              <select
                {...register('visibility')}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 bg-white/90 text-sm transition-all"
              >
                <option value="PRIVATE">Privada (apenas você)</option>
                <option value="UNLISTED">Link secreto</option>
                <option value="PUBLIC">Pública</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
            <Link
              href="/trips"
              className="px-5 py-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-sm font-medium transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Criar Viagem</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
