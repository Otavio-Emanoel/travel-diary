'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { formatDate } from '../../../lib/utils';
import { TripSummary } from '@travel-diary/contracts';
import {
  Compass,
  PlusCircle,
  Calendar,
  MapPin,
  Loader2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export default function TripsDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: async () => {
      const endpoint =
        statusFilter === 'ALL'
          ? '/trips'
          : `/trips?status=${statusFilter}`;
      const res = await api.get<{ success: boolean; data: any[] }>(endpoint);
      return res.data || [];
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Minhas Viagens
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Seus destinos, relatos e memórias reunidos em um só lugar.
          </p>
        </div>

        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md transition-all self-start sm:self-auto hover:shadow-brand-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Nova Viagem</span>
        </Link>
      </div>

      {/* Filtros de Status */}
      <div className="flex items-center gap-2 my-6 overflow-x-auto pb-2">
        {['ALL', 'PLANNED', 'ONGOING', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === status
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-100'
            }`}
          >
            {status === 'ALL' && 'Todas'}
            {status === 'PLANNED' && 'Planejadas'}
            {status === 'ONGOING' && 'Em Andamento'}
            {status === 'COMPLETED' && 'Concluídas'}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm">Carregando suas viagens...</p>
        </div>
      ) : trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip: any) => {
            const hasDestinations = trip.destinations && trip.destinations.length > 0;
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group glass-panel rounded-2xl overflow-hidden border border-stone-200/90 shadow-soft hover:shadow-md transition-all flex flex-col hover:border-brand-300"
              >
                {/* Capa */}
                <div className="h-44 w-full bg-gradient-to-tr from-stone-800 to-stone-700 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-stone-900/10 transition-colors z-10" />
                  <Compass className="w-12 h-12 text-stone-400/40 group-hover:scale-110 transition-transform duration-500" />
                  
                  {/* Badge de Status */}
                  <span
                    className={`absolute top-3 right-3 z-20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                      trip.status === 'ONGOING'
                        ? 'bg-emerald-500 text-white'
                        : trip.status === 'COMPLETED'
                        ? 'bg-stone-700 text-white'
                        : 'bg-amber-400 text-amber-950'
                    }`}
                  >
                    {trip.status === 'ONGOING' && 'Em andamento'}
                    {trip.status === 'COMPLETED' && 'Concluída'}
                    {trip.status === 'PLANNED' && 'Planejada'}
                  </span>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-brand-700 transition-colors flex items-center justify-between">
                      <span>{trip.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                    </h3>

                    {trip.description && (
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDate(trip.startDate)}</span>
                    </div>

                    {hasDestinations && (
                      <div className="flex items-center gap-1 text-brand-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3" />
                        <span>{trip.destinations.length} {trip.destinations.length === 1 ? 'destino' : 'destinos'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="py-20 text-center glass-panel rounded-3xl p-8 max-w-lg mx-auto my-8 border border-dashed border-stone-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-brand-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
            Nenhuma viagem registrada ainda
          </h3>
          <p className="text-sm text-stone-600 mb-6 max-w-sm mx-auto">
            Comece registrando sua próxima aventura ou uma viagem inesquecível do passado.
          </p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Minha Primeira Viagem</span>
          </Link>
        </div>
      )}
    </div>
  );
}
