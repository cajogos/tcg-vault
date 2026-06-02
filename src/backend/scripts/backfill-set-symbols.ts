import Database from 'better-sqlite3';
import TCGdex from '@tcgdex/sdk';
import { dbPath as DB_PATH } from '../lib/config';

async function main()
{
  const sqlite = new Database(DB_PATH);

  const cards = sqlite
    .prepare('SELECT id, sdk_id, language FROM cards WHERE set_symbol IS NULL')
    .all() as { id: string; sdk_id: string; language: string }[];

  if (cards.length === 0)
  {
    console.log('All cards already have set symbols — nothing to do.');
    sqlite.close();
    return;
  }

  console.log(`Backfilling set symbols for ${cards.length} card(s)...`);

  // Group cards by (setId, language) to minimise API calls
  const setGroups = new Map<string, { setId: string; language: string; cardIds: string[] }>();
  for (const card of cards)
  {
    const parts = card.sdk_id.split('-');
    const setId = parts.slice(0, -1).join('-');
    const key = `${setId}::${card.language}`;
    if (!setGroups.has(key))
    {
      setGroups.set(key, { setId, language: card.language, cardIds: [] });
    }
    setGroups.get(key)!.cardIds.push(card.id);
  }

  console.log(`Fetching ${setGroups.size} unique set(s) from TCGDex...`);

  const updateStmt = sqlite.prepare('UPDATE cards SET set_symbol = ? WHERE id = ?');

  let updated = 0;
  let skipped = 0;

  for (const { setId, language, cardIds } of setGroups.values())
  {
    const langCode = language === 'JP' ? 'ja' : 'en';
    const tcgdex = new TCGdex(langCode as 'en' | 'ja');

    try
    {
      const set = await tcgdex.set.get(setId);
      if (!set?.symbol)
      {
        console.log(`  [skip] ${setId} (${language}) — no symbol available`);
        skipped += cardIds.length;
        continue;
      }
      const symbolUrl = `${set.symbol}.png`;
      for (const cardId of cardIds)
      {
        updateStmt.run(symbolUrl, cardId);
        updated++;
      }
      console.log(`  [ok] ${setId} (${language}) → ${symbolUrl} (${cardIds.length} card(s))`);
    }
    catch (err)
    {
      console.error(`  [error] ${setId} (${language}):`, (err as Error).message);
      skipped += cardIds.length;
    }
  }

  sqlite.close();
  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}`);
}

main();
