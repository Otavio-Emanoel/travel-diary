import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';
import { queryClient } from '../src/core/database';
import { FastifyInstance } from 'fastify';

describe('Travel Diary API - Integration Tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let createdTripId: string;
  const testEmail = `viajante_${Date.now()}@teste.com`;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await queryClient.end();
  });

  it('GET /health deve retornar status 200 OK', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.uptime).toBeDefined();
  });

  it('GET /ready deve validar conectividade com o PostgreSQL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ready');
    expect(body.checks.database).toBe('UP');
  });

  it('POST /api/v1/auth/register deve cadastrar novo usuário', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'SenhaForte@2026',
        name: 'Lucas Teste',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(testEmail);
    expect(body.data.accessToken).toBeDefined();

    accessToken = body.data.accessToken;
  });

  it('POST /api/v1/auth/login deve autenticar com credenciais corretas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'SenhaForte@2026',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.accessToken).toBeDefined();
  });

  it('POST /api/v1/trips deve criar uma nova viagem autenticada', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Mochilão Patagônia 2026',
        description: 'Trilha e fotos nos glaciares',
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        status: 'PLANNED',
        visibility: 'PRIVATE',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Mochilão Patagônia 2026');
    createdTripId = body.data.id;
  });

  it('POST /api/v1/trips/:tripId/destinations deve adicionar destino à viagem', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/trips/${createdTripId}/destinations`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'El Calafate',
        country: 'Argentina',
        countryCode: 'AR',
        latitude: -50.3379,
        longitude: -72.2648,
        arrivalDate: '2026-11-02',
        departureDate: '2026-11-06',
        orderIndex: 0,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.name).toBe('El Calafate');
  });

  it('POST /api/v1/trips/:tripId/entries deve criar um relato de diário com localização', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/trips/${createdTripId}/entries`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Caminhada no Glaciar Perito Moreno',
        content: 'O som do gelo estalando é inacreditável. Tomamos uísque com gelo milenar.',
        category: 'ACTIVITY',
        location: {
          name: 'Glaciar Perito Moreno',
          city: 'El Calafate',
          country: 'Argentina',
          latitude: -50.4957,
          longitude: -73.1378,
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.title).toBe('Caminhada no Glaciar Perito Moreno');
    expect(body.data.location.name).toBe('Glaciar Perito Moreno');
  });

  it('GET /api/v1/trips/:tripId/timeline deve retornar a linha do tempo consolidada', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/trips/${createdTripId}/timeline`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.trip.title).toBe('Mochilão Patagônia 2026');
    expect(body.data.trip.destinations).toHaveLength(1);
    expect(body.data.unassignedEntries).toHaveLength(1);
  });
});
