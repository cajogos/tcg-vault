import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import languagesJson from '../../config/languages.json';
import storageTypesJson from '../../config/storageTypes.json';
import conditionsJson from '../../config/conditions.json';
import gradingCompaniesJson from '../../config/gradingCompanies.json';
import statusesJson from '../../config/statuses.json';
import storageLocationsJson from '../../config/storageLocations.json';

export const cards = sqliteTable('cards',
{
  id: text('id').primaryKey(),
  sdkId: text('sdk_id').notNull(),
  name: text('name').notNull(),
  supertype: text('supertype').notNull(),
  subtypes: text('subtypes'),
  rarity: text('rarity').notNull(),
  setNumber: text('set_number').notNull(),
  setName: text('set_name').notNull(),
  language: text('language').$type<typeof languagesJson[number]['id']>().notNull(),
  imageUrl: text('image_url').notNull(),
  setSymbol: text('set_symbol'),
  artist: text('artist'),
});

export const inventoryItems = sqliteTable('inventory_items',
{
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id),
  storageType: text('storage_type').$type<typeof storageTypesJson[number]['id']>().notNull(),
  condition: text('condition').$type<typeof conditionsJson[number]['id']>(),
  gradingCompany: text('grading_company').$type<typeof gradingCompaniesJson[number]['id']>(),
  grade: real('grade'),
  certNumber: text('cert_number'),
  isMisprint: integer('is_misprint', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  storageLocation: text('storage_location').$type<typeof storageLocationsJson[number]['id'] | null>(),
  status: text('status').$type<typeof statusesJson[number]['id']>().default('vaulted').notNull(),
});

export const valuationHistory = sqliteTable('valuation_history',
{
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id),
  checkedValueGbp: real('checked_value_gbp').notNull(),
  checkDate: text('check_date').notNull(),
});

export const salesLedger = sqliteTable('sales_ledger',
{
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id),
  platform: text('platform').default('ebay').notNull(),
  listingUrl: text('listing_url'),
  listedPriceGbp: real('listed_price_gbp'),
  dateListed: text('date_listed'),
  dateSold: text('date_sold'),
  finalSalePriceGbp: real('final_sale_price_gbp'),
  platformFeesGbp: real('platform_fees_gbp'),
  shippingCostGbp: real('shipping_cost_gbp'),
});

export const cardsRelations = relations(cards, ({ many }) =>
({
  instances: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) =>
({
  cardMetadata: one(cards, { fields: [inventoryItems.cardId], references: [cards.id] }),
  salesRecord: one(salesLedger, { fields: [inventoryItems.id], references: [salesLedger.inventoryItemId] }),
  priceHistory: many(valuationHistory),
}));

export const valuationHistoryRelations = relations(valuationHistory, ({ one }) =>
({
  inventoryItem: one(inventoryItems, { fields: [valuationHistory.inventoryItemId], references: [inventoryItems.id] }),
}));

export const salesLedgerRelations = relations(salesLedger, ({ one }) =>
({
  inventoryItem: one(inventoryItems, { fields: [salesLedger.inventoryItemId], references: [inventoryItems.id] }),
}));
