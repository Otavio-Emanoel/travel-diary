import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEntriesStore } from '../entries-store';
import { useTripsStore } from '../../trips/trips-store';
import { LocationService, LocationResult } from '../../../services/location-service';
import { CameraService, PhotoAsset } from '../../../services/camera-service';
import { LocalEntry } from '../../../database/repositories/entries-repository';

export function QuickEntryModal({ route, navigation }: any) {
  const paramTripId = route.params?.tripId;
  const { trips, loadTrips } = useTripsStore();
  const { createQuickEntry } = useEntriesStore();

  const [selectedTripId, setSelectedTripId] = useState<string>(paramTripId || '');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LocalEntry['category']>('NOTE');
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!paramTripId) {
      loadTrips();
    }
  }, [paramTripId]);

  useEffect(() => {
    if (!selectedTripId && trips.length > 0) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  const handleCaptureLocation = async () => {
    setIsLocating(true);
    const loc = await LocationService.getCurrentLocation();
    setIsLocating(false);
    if (loc) {
      setLocation(loc);
    } else {
      Alert.alert(
        'Localização Indisponível',
        'Não foi possível obter sua localização GPS. Você pode salvar a nota normalmente.'
      );
    }
  };

  const handleCaptureCamera = async () => {
    const photoResult = await CameraService.capturePhoto();
    if (photoResult) {
      setPhoto(photoResult);
    }
  };

  const handlePickGallery = async () => {
    const photoResult = await CameraService.pickFromGallery();
    if (photoResult) {
      setPhoto(photoResult);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Atenção', 'Escreva algo na sua nota antes de salvar.');
      return;
    }

    if (!selectedTripId) {
      Alert.alert('Atenção', 'Selecione ou crie uma viagem antes de registrar uma nota.');
      return;
    }

    setIsSaving(true);
    try {
      await createQuickEntry({
        tripId: selectedTripId,
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        location,
        photo,
      });

      // Salvo no SQLite em milissegundos; fecha imediatamente!
      navigation.goBack();
    } catch (_e) {
      Alert.alert('Erro', 'Não foi possível salvar a nota.');
      setIsSaving(false);
    }
  };

  const categories: LocalEntry['category'][] = [
    'NOTE',
    'FOOD',
    'ACTIVITY',
    'LODGING',
    'TRANSPORT',
    'HIGHLIGHT',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro Rápido ⚡</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* Viagem Selecionada */}
        {!paramTripId && trips.length > 0 && (
          <View style={styles.tripSelector}>
            <Text style={styles.sectionLabel}>Viagem:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {trips.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, selectedTripId === t.id && styles.chipActive]}
                  onPress={() => setSelectedTripId(t.id)}
                >
                  <Text
                    style={[styles.chipText, selectedTripId === t.id && styles.chipTextActive]}
                  >
                    {t.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categorias */}
        <Text style={styles.sectionLabel}>Categoria:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Título Opcional */}
        <TextInput
          style={styles.titleInput}
          placeholder="Título (opcional)"
          placeholderTextColor="#78716c"
          value={title}
          onChangeText={setTitle}
        />

        {/* Conteúdo da Nota */}
        <TextInput
          style={styles.contentInput}
          placeholder="O que está acontecendo agora na sua viagem?..."
          placeholderTextColor="#78716c"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />

        {/* Preview da Foto */}
        {photo && (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
              <Text style={styles.removePhotoText}>✕ Remover Foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status de Localização */}
        {location && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>
              📍 {location.locationName || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
            <TouchableOpacity onPress={() => setLocation(null)}>
              <Text style={styles.removeLocationText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barra de Ações Rápidas de Hardware */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCaptureCamera}>
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionLabel}>Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePickGallery}>
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionLabel}>Galeria</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCaptureLocation}
            disabled={isLocating}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionLabel}>
              {isLocating ? 'Buscando...' : 'GPS'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    color: '#a8a29e',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#d97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a8a29e',
    marginBottom: 8,
  },
  tripSelector: {
    marginBottom: 16,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#292524',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  chipActive: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  chipText: {
    color: '#d6d3d1',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  titleInput: {
    backgroundColor: '#292524',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  contentInput: {
    backgroundColor: '#292524',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  photoPreviewContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  removePhoto: {
    backgroundColor: '#450a0a',
    padding: 6,
    alignItems: 'center',
    marginTop: 4,
    borderRadius: 6,
  },
  removePhotoText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#292524',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  locationBadgeText: {
    color: '#34d399',
    fontSize: 13,
  },
  removeLocationText: {
    color: '#a8a29e',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#292524',
    paddingTop: 16,
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#292524',
    borderRadius: 12,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#d6d3d1',
    fontWeight: '500',
  },
});
