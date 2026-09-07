'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api-client';
import { formatDate } from '../../../../lib/utils';
import { CreateEntryModal } from '../../../../features/entries/create-entry-modal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  PlusCircle,
  Share2,
  Camera,
  Loader2,
  Clock,
  Compass,
  Utensils,
  Plane,
  Home,
  Check,
} from 'lucide-react';

// Importa mapa dinamicamente desabilitando SSR
const TripMap = dynamic(() => import('../../../../features/map/trip-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 text-xs">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Carregando mapa interativo...
    </div>
  ),
});

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const [viewMode, setViewMode] = useState<'SPLIT' | 'TIMELINE' | 'MAP'>('SPLIT');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trip-timeline', tripId],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          trip: any;
          days: any[];
          unassignedEntries: any[];
        };
      }>(`/trips/${tripId}/timeline`);
      return res.data;
    },
  });

  const trip = data?.trip;
  const unassigned = data?.unassignedEntries || [];
  const days = data?.days || [];

  // Coleta todos os pontos com latitude/longitude para plotar no mapa
  const mapPoints: any[] = [];
  (trip?.destinations || []).forEach((d: any) => {
    if (d.latitude && d.longitude) {
      mapPoints.push({
        id: d.id,
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
        type: 'DESTINATION',
      });
    }
  });

  unassigned.forEach((e: any) => {
    if (e.location?.latitude && e.location?.longitude) {
      mapPoints.push({
        id: e.id,
        name: e.location.name,
        latitude: e.location.latitude,
        longitude: e.location.longitude,
        type: 'ENTRY',
      });
    }
  });

  const handleShare = async () => {
    try {
      const res = await api.post<{ success: boolean; data: { shareToken: string } }>(
        `/trips/${tripId}/share`
      );
      if (res.success && res.data) {
        const publicUrl = `${window.location.origin}/trips/public/${res.data.shareToken}`;
        await navigator.clipboard.writeText(publicUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch {
      alert('Não foi possível gerar o link de compartilhamento');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm">Carregando diário de bordo...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900">Viagem não encontrada</h2>
        <Link href="/trips" className="text-brand-600 text-sm mt-3 inline-block">
          ← Voltar para Minhas Viagens
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Topo / Voltar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Viagens</span>
        </Link>

        {/* Alternador de Visualização */}
        <div className="inline-flex rounded-xl p-1 bg-stone-200/70 text-xs font-medium">
          <button
            onClick={() => setViewMode('SPLIT')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'SPLIT' ? 'bg-white shadow-sm text-stone-900 font-semibold' : 'text-stone-600'
            }`}
          >
            Dividido
          </button>
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'TIMELINE' ? 'bg-white shadow-sm text-stone-900 font-semibold' : 'text-stone-600'
            }`}
          >
            Linha do Tempo
          </button>
          <button
            onClick={() => setViewMode('MAP')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'MAP' ? 'bg-white shadow-sm text-stone-900 font-semibold' : 'text-stone-600'
            }`}
          >
            Apenas Mapa
          </button>
        </div>
      </div>

      {/* Cabeçalho da Viagem */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-soft mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                {trip.status}
              </span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(trip.startDate)} {trip.endDate && `— ${formatDate(trip.endDate)}`}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {trip.title}
            </h1>
            {trip.description && (
              <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-brand-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Relato</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal (Timeline e Mapa) */}
      <div
        className={`grid gap-8 ${
          viewMode === 'SPLIT'
            ? 'grid-cols-1 lg:grid-cols-12'
            : viewMode === 'TIMELINE'
            ? 'grid-cols-1'
            : 'grid-cols-1'
        }`}
      >
        {/* Coluna da Linha do Tempo */}
        {(viewMode === 'SPLIT' || viewMode === 'TIMELINE') && (
          <div className={viewMode === 'SPLIT' ? 'lg:col-span-7' : 'w-full'}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-2">
                <span>Diário de Bordo</span>
                <span className="text-xs font-sans text-stone-500 font-normal">
                  ({unassigned.length} relatos)
                </span>
              </h2>
            </div>

            {unassigned.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-200">
                {unassigned.map((entry: any) => (
                  <div key={entry.id} className="relative pl-9 group">
                    {/* Marcador na Linha */}
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-500 shadow-sm group-hover:scale-125 transition-transform" />

                    <div className="glass-panel p-5 rounded-2xl border border-stone-200/90 shadow-soft">
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                        <span className="font-semibold text-brand-700 uppercase tracking-wider text-[10px]">
                          {entry.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.entryTime).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {entry.title && (
                        <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">
                          {entry.title}
                        </h3>
                      )}

                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>

                      {/* Localização */}
                      {entry.location && (
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-stone-600">
                          <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span>
                            {entry.location.name}
                            {entry.location.city && `, ${entry.location.city}`}
                          </span>
                        </div>
                      )}

                      {/* Fotos Anexadas */}
                      {entry.media && entry.media.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {entry.media.map((m: any) => (
                            <div
                              key={m.id}
                              className="h-36 rounded-xl bg-stone-100 overflow-hidden relative border border-stone-200"
                            >
                              <img
                                src={m.publicUrl || `http://localhost:9000/travel-diary-media/${m.storageKey}`}
                                alt="Foto do relato"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center glass-panel rounded-2xl border border-dashed border-stone-300 p-8">
                <Compass className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-800">
                  Nenhum relato registrado ainda nesta viagem
                </p>
                <p className="text-xs text-stone-500 mt-1 mb-4">
                  Clique no botão abaixo para adicionar sua primeira memória.
                </p>
                <button
                  onClick={() => setIsEntryModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                >
                  + Adicionar Primeiro Relato
                </button>
              </div>
            )}
          </div>
        )}

        {/* Coluna do Mapa */}
        {(viewMode === 'SPLIT' || viewMode === 'MAP') && (
          <div className={viewMode === 'SPLIT' ? 'lg:col-span-5' : 'w-full'}>
            <div className="sticky top-24">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span>Mapa da Rota</span>
              </h2>

              <div className="h-[480px]">
                <TripMap points={mapPoints} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação de Entradas */}
      <CreateEntryModal
        tripId={tripId}
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
