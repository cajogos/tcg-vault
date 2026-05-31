import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../backend/schema';
import { createInventoryRouter } from '../../backend/routes/inventory';
import express from 'express';
import request from 'supertest';

function createTestDb()
{
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE cards (
      id TEXT PRIMARY KEY,
      sdk_id TEXT NOT NULL,
      name TEXT NOT NULL,
      supertype TEXT NOT NULL,
      subtypes TEXT,
      rarity TEXT NOT NULL,
      set_number TEXT NOT NULL,
      set_name TEXT NOT NULL,
      language TEXT NOT NULL,
      image_url TEXT NOT NULL,
      artist TEXT,
      set_symbol TEXT
    );
    CREATE TABLE inventory_items (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES cards(id),
      storage_type TEXT NOT NULL,
      condition TEXT,
      grading_company TEXT,
      grade REAL,
      cert_number TEXT,
      is_misprint INTEGER DEFAULT 0,
      notes TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      storage_location TEXT,
      status TEXT NOT NULL DEFAULT 'vaulted'
    );
    CREATE TABLE valuation_history (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      checked_value_gbp REAL NOT NULL,
      check_date TEXT NOT NULL
    );
    CREATE TABLE sales_ledger (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      platform TEXT NOT NULL DEFAULT 'ebay',
      listing_url TEXT,
      listed_price_gbp REAL,
      date_listed TEXT,
      date_sold TEXT,
      final_sale_price_gbp REAL,
      platform_fees_gbp REAL,
      shipping_cost_gbp REAL
    );
  `);
  return drizzle(sqlite, { schema });
}

const testCard =
{
  id: 'base1-4',
  sdkId: 'en-base1-4',
  name: 'Charizard',
  supertype: 'Pokémon',
  rarity: 'Rare Holo',
  setNumber: '4',
  setName: 'Base Set',
  language: 'EN' as const,
  imageUrl: 'https://example.com/charizard.png',
  artist: 'Mitsuhiro Arita',
};

const testInstance =
{
  id: 'inv-001',
  cardId: 'base1-4',
  storageType: 'raw' as const,
  condition: 'NM' as const,
  tags: [],
};

describe('Inventory API — in-memory SQLite', () =>
{
  let app: express.Express;

  beforeEach(() =>
  {
    const db = createTestDb();
    app = express();
    app.use(express.json());
    app.use('/api/inventory', createInventoryRouter(db));
  });

  it('GET /api/inventory returns empty array on a fresh database', async () =>
  {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/inventory inserts a card and inventory item', async () =>
  {
    const res = await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/inventory with initialValuationGbp records a valuation entry', async () =>
  {
    const res = await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
      initialValuationGbp: 200,
    });
    expect(res.status).toBe(201);
    const get = await request(app).get('/api/inventory');
    expect(get.body[0].priceHistory).toHaveLength(1);
    expect(get.body[0].priceHistory[0].checkedValueGbp).toBe(200);
  });

  it('GET /api/inventory returns the inserted item with relational card data', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    const res = await request(app).get('/api/inventory');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cardMetadata.name).toBe('Charizard');
    expect(res.body[0].cardMetadata.artist).toBe('Mitsuhiro Arita');
    expect(res.body[0].status).toBe('vaulted');
    expect(res.body[0].priceHistory).toEqual([]);
  });

  it('PATCH with an invalid status returns 400', async () =>
  {
    const res = await request(app)
      .patch('/api/inventory/any-id/status')
      .send({ status: 'broken' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid status value');
  });

  it('PATCH with a valid status updates the record', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    const res = await request(app)
      .patch('/api/inventory/inv-001/status')
      .send({ status: 'listed' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /:id/valuations records a new valuation entry', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    const res = await request(app)
      .post('/api/inventory/inv-001/valuations')
      .send({ checkedValueGbp: 175.50, checkDate: '2026-05-24' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.entry.checkedValueGbp).toBe(175.50);
  });

  it('POST /:id/valuations rejects missing checkedValueGbp', async () =>
  {
    const res = await request(app)
      .post('/api/inventory/inv-001/valuations')
      .send({ checkDate: '2026-05-24' });
    expect(res.status).toBe(400);
  });

  it('POST with duplicate card id does not fail (onConflictDoNothing)', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    const res = await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: { ...testInstance, id: 'inv-002' },
    });
    expect(res.status).toBe(201);
  });

  it('DELETE /api/inventory/:id returns 404 for a non-existent item', async () =>
  {
    const res = await request(app).delete('/api/inventory/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('DELETE /api/inventory/:id removes the item', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
    });
    const del = await request(app).delete('/api/inventory/inv-001');
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
    const get = await request(app).get('/api/inventory');
    expect(get.body).toHaveLength(0);
  });

  it('DELETE /api/inventory/:id cascades through valuation history', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: testInstance,
      initialValuationGbp: 200,
    });
    const del = await request(app).delete('/api/inventory/inv-001');
    expect(del.status).toBe(200);
    const get = await request(app).get('/api/inventory');
    expect(get.body).toHaveLength(0);
  });

  it('tags: stored as array and retrieved correctly', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: { ...testInstance, tags: ['sealed', 'miscentered'] },
    });
    const res = await request(app).get('/api/inventory');
    expect(res.body[0].tags).toEqual(['sealed', 'miscentered']);
  });

  it('storageLocation: stored and retrieved', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: { ...testInstance, storageLocation: 'zapdos-tin' },
    });
    const res = await request(app).get('/api/inventory');
    expect(res.body[0].storageLocation).toBe('zapdos-tin');
  });

  it('sealed tag: works alongside raw storageType', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData: { ...testInstance, storageType: 'raw', tags: ['sealed'] },
    });
    const res = await request(app).get('/api/inventory');
    expect(res.body[0].storageType).toBe('raw');
    expect(res.body[0].tags).toContain('sealed');
  });

  it('sealed tag: works alongside graded storageType', async () =>
  {
    await request(app).post('/api/inventory').send({
      cardData: testCard,
      instanceData:
      {
        ...testInstance,
        id: 'inv-graded-sealed',
        storageType: 'graded',
        condition: null,
        gradingCompany: 'PSA',
        grade: 10,
        tags: ['sealed'],
      },
    });
    const res = await request(app).get('/api/inventory');
    expect(res.body[0].storageType).toBe('graded');
    expect(res.body[0].gradingCompany).toBe('PSA');
    expect(res.body[0].tags).toContain('sealed');
  });
});
