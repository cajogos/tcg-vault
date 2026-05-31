import Database from 'better-sqlite3';
import { downloadCardImage } from '../lib/imageCache';
import { dbPath } from '../lib/config';

const db = new Database(dbPath);

const cards = db.prepare(
  `SELECT id, image_url FROM cards WHERE image_url IS NOT NULL AND image_url != '' AND image_url NOT LIKE '/images/%'`
).all() as { id: string; image_url: string }[];

if (cards.length === 0)
{
  console.log('All images already local.');
  process.exit(0);
}

console.log(`Downloading images for ${cards.length} card(s)...`);

const update = db.prepare(`UPDATE cards SET image_url = ? WHERE id = ?`);

let success = 0;
let failed = 0;

for (const card of cards)
{
  process.stdout.write(`  ${card.id} ... `);
  const localUrl = await downloadCardImage(card.id, card.image_url);
  if (localUrl)
  {
    update.run(localUrl, card.id);
    console.log(`OK`);
    success++;
  }
  else
  {
    console.log(`FAILED (keeping external URL)`);
    failed++;
  }
}

console.log(`\nDone. ${success} downloaded, ${failed} failed.`);
db.close();
