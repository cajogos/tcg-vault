import { Router } from 'express';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';
import statusesJson from '../../config/statuses.json';
import { downloadCardImage } from '../lib/imageCache';

const VALID_STATUSES = statusesJson.map(s => s.id);
type ItemStatus = typeof statusesJson[number]['id'];

export function createInventoryRouter(
  db: BetterSQLite3Database<typeof schema>
): Router
{
  const router = Router();

  router.get('/', async (req, res) =>
  {
    try
    {
      const results = await db.query.inventoryItems.findMany({
        with: {
          cardMetadata: true,
          salesRecord: true,
          priceHistory: true,
        },
      });
      res.json(results);
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
      const { cardData, instanceData, initialValuationGbp } = req.body;

      await db.insert(schema.cards)
        .values(cardData)
        .onConflictDoNothing();

      // Download image immediately; fall back to external URL if it fails
      if (cardData.imageUrl)
      {
        const localUrl = await downloadCardImage(cardData.id, cardData.imageUrl);
        if (localUrl)
        {
          await db.update(schema.cards)
            .set({ imageUrl: localUrl })
            .where(eq(schema.cards.id, cardData.id));
        }
      }

      await db.insert(schema.inventoryItems)
        .values(instanceData);

      if (initialValuationGbp != null && !isNaN(Number(initialValuationGbp)))
      {
        await db.insert(schema.valuationHistory).values({
          id: crypto.randomUUID(),
          inventoryItemId: instanceData.id,
          checkedValueGbp: Number(initialValuationGbp),
          checkDate: new Date().toISOString().split('T')[0],
        });
      }

      res.status(201).json({ success: true });
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.patch('/:id/status', async (req, res) =>
  {
    try
    {
      const { id } = req.params;
      const { status } = req.body;

      if (!VALID_STATUSES.includes(status))
      {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      await db.update(schema.inventoryItems)
        .set({ status })
        .where(eq(schema.inventoryItems.id, id));

      res.json({ success: true });
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/:id/valuations', async (req, res) =>
  {
    try
    {
      const { id } = req.params;
      const { checkedValueGbp, checkDate } = req.body;

      if (checkedValueGbp == null || isNaN(Number(checkedValueGbp)))
      {
        return res.status(400).json({ error: 'checkedValueGbp must be a valid number' });
      }
      if (!checkDate || typeof checkDate !== 'string')
      {
        return res.status(400).json({ error: 'checkDate is required' });
      }

      const entry =
      {
        id: crypto.randomUUID(),
        inventoryItemId: id,
        checkedValueGbp: Number(checkedValueGbp),
        checkDate,
      };

      await db.insert(schema.valuationHistory).values(entry);

      res.status(201).json({ success: true, entry });
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.delete('/:id', async (req, res) =>
  {
    try
    {
      const { id } = req.params;

      const existing = await db.query.inventoryItems.findFirst({
        where: (items, { eq }) => eq(items.id, id),
      });
      if (!existing)
      {
        return res.status(404).json({ error: 'Item not found' });
      }

      await db.delete(schema.valuationHistory)
        .where(eq(schema.valuationHistory.inventoryItemId, id));
      await db.delete(schema.salesLedger)
        .where(eq(schema.salesLedger.inventoryItemId, id));
      await db.delete(schema.inventoryItems)
        .where(eq(schema.inventoryItems.id, id));

      res.json({ success: true });
    }
    catch (error)
    {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
