'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api-client';
import {
  X,
  Camera,
  MapPin,
  Loader2,
  Calendar,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

interface CreateEntryModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEntryModal({
  tripId,
  isOpen,
  onClose,
  onSuccess,
}: CreateEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: '',
      content: '',
      category: 'JOURNAL',
      locationName: '',
      locationCity: '',
      locationCountry: '',
      latitude: '',
      longitude: '',
    },
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      const mediaIds: string[] = [];

      // 1. Upload Direto da Imagem (se houver) via Presigned URL
      if (selectedFile) {
        setUploadProgress('Solicitando autorização de upload...');
        const presignedRes = await api.post<{
          success: boolean;
          data: {
            mediaId: string;
            uploadUrl: string;
          };
        }>('/media/upload-url', {
          tripId,
          filename: selectedFile.name,
          mimeType: selectedFile.type || 'image/jpeg',
          sizeBytes: selectedFile.size,
        });

        if (presignedRes.success && presignedRes.data) {
          const { mediaId, uploadUrl } = presignedRes.data;

          setUploadProgress('Enviando foto diretamente ao storage...');
          // Upload direto via HTTP PUT para MinIO/S3
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': selectedFile.type || 'image/jpeg',
            },
            body: selectedFile,
          });

          if (!uploadRes.ok) {
            throw new Error('Falha no upload direto da foto');
          }

          setUploadProgress('Confirmando metadados...');
          // Confirmação à API
          await api.post(`/media/${mediaId}/confirm`);
          mediaIds.push(mediaId);
        }
      }

      // 2. Criação da Entrada de Diário
      setUploadProgress('Salvando relato de viagem...');
      const payload: any = {
        title: data.title || undefined,
        content: data.content,
        category: data.category,
        mediaIds,
      };

      if (hasLocation && data.locationName && data.latitude && data.longitude) {
        payload.location = {
          name: data.locationName,
          city: data.locationCity || undefined,
          country: data.locationCountry || undefined,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };
      }

      await api.post(`/trips/${tripId}/entries`, payload);

      reset();
      setSelectedFile(null);
      setHasLocation(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Falha ao registrar entrada');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2 text-stone-900">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="font-serif text-xl font-bold">Novo Relato de Viagem</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Título da Entrada
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Ex: Passeio de barco ao entardecer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Categoria
            </label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 bg-white"
            >
              <option value="JOURNAL">Relato Diário (Geral)</option>
              <option value="ACTIVITY">Passeio / Atração</option>
              <option value="FOOD">Gastronomia / Restaurante</option>
              <option value="TRAVEL">Deslocamento / Transporte</option>
              <option value="LODGING">Hospedagem</option>
            </select>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Relato / Memórias *
            </label>
            <textarea
              rows={4}
              required
              {...register('content')}
              placeholder="Escreva como foi o dia, o que você sentiu, dicas para não esquecer..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Foto (Upload Direto S3) */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-600" />
              <span>Anexar Foto (Upload direto S3/MinIO)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-xs text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Localização GPS toggle */}
          <div>
            <button
              type="button"
              onClick={() => setHasLocation(!hasLocation)}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{hasLocation ? '− Remover Localização' : '+ Adicionar Localização no Mapa'}</span>
            </button>

            {hasLocation && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 grid grid-cols-2 gap-2.5 text-xs animate-fade-in">
                <div className="col-span-2">
                  <input
                    type="text"
                    {...register('locationName')}
                    placeholder="Nome do local (ex: Torre Eiffel)"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    {...register('latitude')}
                    placeholder="Latitude (ex: 48.8584)"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    {...register('longitude')}
                    placeholder="Longitude (ex: 2.2945)"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Progresso do Upload */}
          {uploadProgress && (
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-900 text-xs flex items-center gap-2">
              <UploadCloud className="w-4 h-4 animate-bounce" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {/* Ações */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>Publicar Relato</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
