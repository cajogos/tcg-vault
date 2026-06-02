import { Router } from 'express';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { desc } from 'drizzle-orm';

export function createExportsRouter(
  db: BetterSQLite3Database<typeof schema>
): Router
{
  const router = Router();

  router.get('/', async (_req, res) =>
  {
    try
    {
      const records = await db
        .select()
        .from(schema.exportHistory)
        .orderBy(desc(schema.exportHistory.exportedAt));
      res.json(records);
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/', async (req, res) =>
  {
    try
    {
      const { id, exportedAt, fileName, itemCount, totalValueGbp, discountPercent, finalValueGbp, includedTagIds } = req.body;
      await db.insert(schema.exportHistory).values({
        id,
        exportedAt,
        fileName,
        itemCount,
        totalValueGbp: totalValueGbp ?? null,
        discountPercent: discountPercent ?? null,
        finalValueGbp: finalValueGbp ?? null,
        includedTagIds: includedTagIds ?? [],
      });
      res.status(201).json({ success: true });
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
