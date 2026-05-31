import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { dbPath as DB_PATH } from '../lib/config';

async function main()
{
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });

  const seedCards: typeof schema.cards.$inferInsert[] = [
    {
      id: 'seed-base1-4-EN',
      sdkId: 'base1-4',
      name: 'Charizard',
      supertype: 'Pokémon',
      subtypes: 'Stage 2',
      rarity: 'Rare Holo',
      setNumber: '4',
      setName: 'Base Set',
      language: 'EN',
      imageUrl: 'https://assets.tcgdex.net/en/base/base1/4',
      artist: 'Mitsuhiro Arita',
    },
    {
      id: 'seed-sm12-173-JP',
      sdkId: 'sm12-173',
      name: 'Pikachu',
      supertype: 'Pokémon',
      subtypes: 'Basic',
      rarity: 'Promo',
      setNumber: '173',
      setName: 'Alter Genesis',
      language: 'JP',
      imageUrl: 'https://assets.tcgdex.net/jp/sm/sm12/173',
      artist: 'Atsuko Nishida',
    },
    {
      id: 'seed-swsh35-TG30-EN',
      sdkId: 'swsh35-TG30',
      name: 'Umbreon VMAX',
      supertype: 'Pokémon',
      subtypes: 'VMAX',
      rarity: 'Trainer Gallery Rare Holo',
      setNumber: 'TG30',
      setName: 'Brilliant Stars',
      language: 'EN',
      imageUrl: 'https://assets.tcgdex.net/en/swsh/swsh9/TG30',
      artist: 'Souichirou Gunjima',
    },
  ];

  for (const card of seedCards)
  {
    await db.insert(schema.cards).values(card).onConflictDoNothing();
  }

  const item1Id = crypto.randomUUID();
  const item2Id = crypto.randomUUID();
  const item3Id = crypto.randomUUID();

  const seedItems: typeof schema.inventoryItems.$inferInsert[] = [
    {
      id: item1Id,
      cardId: 'seed-base1-4-EN',
      storageType: 'raw',
      condition: 'NM',
      gradingCompany: null,
      grade: null,
      certNumber: null,
      isMisprint: false,
      notes: 'Purchased at local card fair. Light play on back edge.',
      tags: [],
      storageLocation: 'office-wardrobe',
      status: 'vaulted',
    },
    {
      id: item2Id,
      cardId: 'seed-sm12-173-JP',
      storageType: 'raw',
      condition: null,
      gradingCompany: null,
      grade: null,
      certNumber: null,
      isMisprint: false,
      notes: 'Original cellophane promo wrap intact. League night promo.',
      tags: ['sealed'],
      storageLocation: 'zapdos-tin',
      status: 'vaulted',
    },
    {
      id: item3Id,
      cardId: 'seed-swsh35-TG30-EN',
      storageType: 'graded',
      condition: null,
      gradingCompany: 'PSA',
      grade: 10,
      certNumber: '84729156',
      isMisprint: false,
      notes: null,
      tags: [],
      storageLocation: 'eevee-tin',
      status: 'vaulted',
    },
  ];

  for (const item of seedItems)
  {
    await db.insert(schema.inventoryItems).values(item).onConflictDoNothing();
  }

  const seedValuations: typeof schema.valuationHistory.$inferInsert[] = [
    {
      id: crypto.randomUUID(),
      inventoryItemId: item3Id,
      checkedValueGbp: 180.00,
      checkDate: '2025-10-01',
    },
    {
      id: crypto.randomUUID(),
      inventoryItemId: item3Id,
      checkedValueGbp: 210.00,
      checkDate: '2026-02-14',
    },
  ];

  for (const val of seedValuations)
  {
    await db.insert(schema.valuationHistory).values(val).onConflictDoNothing();
  }

  console.log('✓ Seed complete: 3 cards, 3 items, 2 valuations inserted.');
  sqlite.close();
}

main().catch((err) =>
{
  console.error('Seed failed:', err.message);
  process.exit(1);
});
