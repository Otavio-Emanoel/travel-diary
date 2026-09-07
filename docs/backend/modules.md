# Especificação dos Módulos do Backend — Diário de Viagens

Este documento descreve detalhadamente os métodos públicos, interfaces e contratos de serviço de cada módulo do backend.

---

## 1. Módulo `auth`

### 1.1 Interface Pública (`AuthService`)
```typescript
export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput, meta: ClientMetadata): Promise<AuthResult>;
  refreshToken(refreshToken: string, meta: ClientMetadata): Promise<AuthResult>;
  logout(refreshToken: string): Promise<void>;
  validateAccessToken(token: string): Promise<{ userId: string; role: string }>;
}
```

* **`RegisterInput`**: `{ email: string, password: string, name: string }`
* **`AuthResult`**: `{ user: UserProfile, accessToken: string, refreshToken: string }`
* **`ClientMetadata`**: `{ userAgent: string, ipAddress: string }`

---

## 2. Módulo `trips`

### 2.1 Interface Pública (`TripService`)
```typescript
export interface ITripService {
  createTrip(userId: string, input: CreateTripInput): Promise<TripDetails>;
  getTripById(tripId: string, requestingUserId: string): Promise<TripDetails>;
  listTrips(userId: string, query: ListTripsQuery): Promise<PaginatedResult<TripSummary>>;
  updateTrip(tripId: string, userId: string, input: UpdateTripInput): Promise<TripDetails>;
  deleteTrip(tripId: string, userId: string): Promise<void>;
  assertCanEdit(tripId: string, userId: string): Promise<boolean>;
}
```

* **Regras de Negócio**:
  - `start_date` deve ser anterior ou igual a `end_date`.
  - Excluir uma viagem remove os registros associados em cascata ou marca `deleted_at`.
  - Apenas o dono ou editores autorizados podem modificar a viagem.

---

## 3. Módulo `destinations`

### 3.1 Interface Pública (`DestinationService`)
```typescript
export interface IDestinationService {
  addDestination(tripId: string, userId: string, input: AddDestinationInput): Promise<Destination>;
  listDestinations(tripId: string): Promise<Destination[]>;
  reorderDestinations(tripId: string, userId: string, destinationIds: string[]): Promise<void>;
  deleteDestination(destinationId: string, userId: string): Promise<void>;
}
```

---

## 4. Módulo `entries`

### 4.1 Interface Pública (`EntryService`)
```typescript
export interface IEntryService {
  createEntry(tripId: string, userId: string, input: CreateEntryInput): Promise<EntryDetails>;
  getEntryById(entryId: string, userId: string): Promise<EntryDetails>;
  listEntriesByTrip(tripId: string, userId: string, query: ListEntriesQuery): Promise<EntrySummary[]>;
  getTimeline(tripId: string, userId: string): Promise<TimelineResponse>;
  updateEntry(entryId: string, userId: string, input: UpdateEntryInput): Promise<EntryDetails>;
  deleteEntry(entryId: string, userId: string): Promise<void>;
}
```

* **`TimelineResponse`**: Estrutura aninhada contendo os dias da viagem (`TripDay`) e cada entrada com suas mídias e localização agrupadas cronologicamente.

---

## 5. Módulo `media`

### 5.1 Interface Pública (`MediaService`)
```typescript
export interface IMediaService {
  requestUploadUrl(userId: string, input: RequestUploadUrlInput): Promise<PresignedUploadResponse>;
  confirmUpload(mediaId: string, userId: string): Promise<MediaDetails>;
  getMediaById(mediaId: string): Promise<MediaDetails>;
  deleteMedia(mediaId: string, userId: string): Promise<void>;
  attachToEntry(mediaId: string, entryId: string, userId: string): Promise<void>;
}
```

* **Validações**:
  - Tamanho máximo: 15MB por foto.
  - Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/heic`.

---

## 6. Módulo `locations`

### 6.1 Interface Pública (`LocationService`)
```typescript
export interface ILocationService {
  createOrUpdateEntryLocation(entryId: string, input: LocationInput): Promise<Location>;
  getLocationByEntry(entryId: string): Promise<Location | null>;
  getTripMapPoints(tripId: string): Promise<MapPoint[]>;
}
```

---

## 7. Módulo `sharing`

### 7.1 Interface Pública (`SharingService`)
```typescript
export interface ISharingService {
  createShareLink(tripId: string, userId: string, options: ShareOptions): Promise<ShareLink>;
  getPublicTrip(shareToken: string): Promise<PublicTripView>;
  revokeShareLink(tripId: string, userId: string): Promise<void>;
}
```
