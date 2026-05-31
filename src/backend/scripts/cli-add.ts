import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import storageTypesJson from '../../config/storageTypes.json';
import conditionsJson from '../../config/conditions.json';
import gradingCompaniesJson from '../../config/gradingCompanies.json';
import statusesJson from '../../config/statuses.json';
import tagsJson from '../../config/tags.json';
import storageLocationsJson from '../../config/storageLocations.json';
import { dbPath as DB_PATH } from '../lib/config';

function parseArgs(argv: string[]): Record<string, string>
{
  const result: Record<string, string> = {};
  for (const arg of argv)
  {
    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (match)
    {
      result[match[1]] = match[2];
    }
  }
  return result;
}

function usage(): void
{
  console.log(`
Usage: pnpm cli:add [flags]

Required:
  --cardId=<string>      Card ID already in the cards table (e.g. swsh1-1-EN)
  --type=<raw|graded>

Optional:
  --company=<PSA|BGS|CGC>
  --grade=<number>
  --cert=<string>
  --notes=<string>
  --status=<vaulted|listed|sold>  (defaults to vaulted)
  --valuation=<number>   Initial GBP valuation to record in history
  --misprint             Flag card as misprint / error card
  --tags=<tag1,tag2>     Comma-separated tag IDs (e.g. sealed,miscentered)
  --location=<id>        Storage location ID (e.g. office-wardrobe, zapdos-tin)
`);
}

async function main()
{
  const args = parseArgs(process.argv.slice(2));

  if (!args.cardId || !args.type)
  {
    console.error('Error: --cardId and --type are required.\n');
    usage();
    process.exit(1);
  }

  const validTypes = storageTypesJson.map(t => t.id);
  if (!validTypes.includes(args.type))
  {
    console.error(`Error: --type must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const validStatuses = statusesJson.map(s => s.id);
  const status = args.status ?? 'vaulted';
  if (!validStatuses.includes(status))
  {
    console.error(`Error: --status must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const validTagIds = tagsJson.map(t => t.id);
  const tags: string[] = args.tags
    ? args.tags.split(',').map(t => t.trim()).filter(t => validTagIds.includes(t))
    : [];

  const validLocationIds = storageLocationsJson.map(l => l.id);
  const storageLocation = args.location && validLocationIds.includes(args.location)
    ? args.location
    : null;

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });

  const itemId = crypto.randomUUID();
  const grade = args.grade != null ? parseFloat(args.grade) : null;
  const valuation = args.valuation != null ? parseFloat(args.valuation) : null;

  try
  {
    await db.insert(schema.inventoryItems).values(
    {
      id: itemId,
      cardId: args.cardId,
      storageType: args.type as typeof storageTypesJson[number]['id'],
      condition: args.type === 'raw' ? (args.condition as typeof conditionsJson[number]['id']) ?? 'NM' : null,
      gradingCompany: args.type === 'graded' ? (args.company as typeof gradingCompaniesJson[number]['id']) ?? null : null,
      grade: args.type === 'graded' ? grade : null,
      certNumber: args.cert ?? null,
      isMisprint: 'misprint' in args,
      notes: args.notes ?? null,
      tags,
      storageLocation: storageLocation as typeof storageLocationsJson[number]['id'] | null,
      status: status as typeof statusesJson[number]['id'],
    });

    if (valuation != null && !isNaN(valuation))
    {
      await db.insert(schema.valuationHistory).values(
      {
        id: crypto.randomUUID(),
        inventoryItemId: itemId,
        checkedValueGbp: valuation,
        checkDate: new Date().toISOString().split('T')[0],
      });
    }

    console.log(`✓ Inserted item ${itemId} (cardId: ${args.cardId}, type: ${args.type})`);
    if (tags.length > 0)
    {
      console.log(`  Tags: ${tags.join(', ')}`);
    }
    if (storageLocation)
    {
      console.log(`  Location: ${storageLocation}`);
    }
    if (valuation != null)
    {
      console.log(`  + Valuation recorded: £${valuation.toFixed(2)}`);
    }
  }
  catch (err)
  {
    console.error('Error inserting record:', (err as Error).message);
    process.exit(1);
  }
  finally
  {
    sqlite.close();
  }
}

main();
