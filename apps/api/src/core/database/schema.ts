import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  bigint,
  char,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// 1. USUÁRIOS (users)
// =============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    bio: text('bio'),
    role: varchar('role', { length: 20 }).notNull().default('USER'), // 'USER' | 'ADMIN'
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  trips: many(trips),
  media: many(media),
}));

// =============================================================================
// 2. SESSÕES & REFRESH TOKENS (sessions)
// =============================================================================
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    deviceName: varchar('device_name', { length: 120 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index('idx_sessions_token_hash').on(table.tokenHash),
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// 3. VIAGENS (trips)
// =============================================================================
export const trips = pgTable(
  'trips',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: varchar('status', { length: 20 }).notNull().default('PLANNED'), // 'PLANNED' | 'ONGOING' | 'COMPLETED'
    visibility: varchar('visibility', { length: 20 }).notNull().default('PRIVATE'), // 'PRIVATE' | 'UNLISTED' | 'PUBLIC'
    coverMediaId: uuid('cover_media_id'),
    shareToken: varchar('share_token', { length: 64 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userDatesIdx: index('idx_trips_user_dates').on(table.userId, table.startDate),
    shareTokenIdx: index('idx_trips_share_token').on(table.shareToken),
  })
);

export const tripsRelations = relations(trips, ({ one, many }) => ({
  owner: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  destinations: many(destinations),
  days: many(tripDays),
  entries: many(entries),
  media: many(media),
  shares: many(tripShares),
}));

// =============================================================================
// 4. DESTINOS DA VIAGEM (destinations)
// =============================================================================
export const destinations = pgTable(
  'destinations',
  {
    id: uuid('id').primaryKey(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    country: varchar('country', { length: 80 }).notNull(),
    countryCode: char('country_code', { length: 2 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    arrivalDate: date('arrival_date'),
    departureDate: date('departure_date'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tripOrderIdx: index('idx_destinations_trip_order').on(table.tripId, table.orderIndex),
  })
);

export const destinationsRelations = relations(destinations, ({ one }) => ({
  trip: one(trips, {
    fields: [destinations.tripId],
    references: [trips.id],
  }),
}));

// =============================================================================
// 5. DIAS DA VIAGEM (trip_days)
// =============================================================================
export const tripDays = pgTable(
  'trip_days',
  {
    id: uuid('id').primaryKey(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    dayDate: date('day_date').notNull(),
    dayNumber: integer('day_number').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tripDateUq: unique('uq_trip_day_date').on(table.tripId, table.dayDate),
    tripDateIdx: index('idx_trip_days_trip_date').on(table.tripId, table.dayDate),
  })
);

export const tripDaysRelations = relations(tripDays, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripDays.tripId],
    references: [trips.id],
  }),
  entries: many(entries),
}));

// =============================================================================
// 6. ENTRADAS DE DIÁRIO (entries)
// =============================================================================
export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    tripDayId: uuid('trip_day_id').references(() => tripDays.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 150 }),
    content: text('content').notNull(),
    entryTime: timestamp('entry_time', { withTimezone: true }).notNull().defaultNow(),
    category: varchar('category', { length: 20 }).notNull().default('JOURNAL'), // 'TRAVEL' | 'FOOD' | 'ACTIVITY' | 'LODGING' | 'JOURNAL'
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    timelineIdx: index('idx_entries_timeline').on(table.tripId, table.entryTime),
    dayIdx: index('idx_entries_day').on(table.tripDayId),
  })
);

export const entriesRelations = relations(entries, ({ one, many }) => ({
  trip: one(trips, {
    fields: [entries.tripId],
    references: [trips.id],
  }),
  day: one(tripDays, {
    fields: [entries.tripDayId],
    references: [tripDays.id],
  }),
  location: one(locations),
  media: many(media),
}));

// =============================================================================
// 7. LOCALIZAÇÃO (locations)
// =============================================================================
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey(),
    entryId: uuid('entry_id')
      .notNull()
      .unique()
      .references(() => entries.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    country: varchar('country', { length: 80 }),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    coordsIdx: index('idx_locations_coords').on(table.latitude, table.longitude),
  })
);

export const locationsRelations = relations(locations, ({ one }) => ({
  entry: one(entries, {
    fields: [locations.entryId],
    references: [entries.id],
  }),
}));

// =============================================================================
// 8. MÍDIA E FOTOS (media)
// =============================================================================
export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'set null' }),
    entryId: uuid('entry_id').references(() => entries.id, { onDelete: 'set null' }),
    storageKey: varchar('storage_key', { length: 500 }).notNull().unique(),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 60 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    width: integer('width'),
    height: integer('height'),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    status: varchar('status', { length: 20 }).notNull().default('PENDING_UPLOAD'), // 'PENDING_UPLOAD' | 'READY' | 'FAILED'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tripIdIdx: index('idx_media_trip_id').on(table.tripId),
    entryIdIdx: index('idx_media_entry_id').on(table.entryId),
    pendingIdx: index('idx_media_pending_cleanup').on(table.createdAt),
  })
);

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [media.tripId],
    references: [trips.id],
  }),
  entry: one(entries, {
    fields: [media.entryId],
    references: [entries.id],
  }),
}));

// =============================================================================
// 9. COMPARTILHAMENTO DE VIAGEM (trip_shares)
// =============================================================================
export const tripShares = pgTable(
  'trip_shares',
  {
    id: uuid('id').primaryKey(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    sharedWithUserId: uuid('shared_with_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().default('VIEWER'), // 'VIEWER' | 'EDITOR'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    tripUserUq: unique('uq_trip_share_user').on(table.tripId, table.sharedWithUserId),
  })
);

export const tripSharesRelations = relations(tripShares, ({ one }) => ({
  trip: one(trips, {
    fields: [tripShares.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripShares.sharedWithUserId],
    references: [users.id],
  }),
}));
