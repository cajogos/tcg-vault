import conditions from '../config/conditions.json';
import storageTypes from '../config/storageTypes.json';
import gradingCompanies from '../config/gradingCompanies.json';
import statuses from '../config/statuses.json';
import languages from '../config/languages.json';
import tagsConfig from '../config/tags.json';
import storageLocationsConfig from '../config/storageLocations.json';

export type Language        = typeof languages[number]['id'];
export type StorageType     = typeof storageTypes[number]['id'];
export type Condition       = typeof conditions[number]['id'];
export type GradingCompany  = typeof gradingCompanies[number]['id'];
export type Status          = typeof statuses[number]['id'];
export type Tag             = typeof tagsConfig[number]['id'];
export type StorageLocation = typeof storageLocationsConfig[number]['id'];

export interface ValuationEntry
{
  id: string;
  inventoryItemId: string;
  checkedValueGbp: number;
  checkDate: string;
}

export interface CardMetadata
{
  id: string;
  sdkId: string;
  name: string;
  supertype: string;
  subtypes: string | null;
  rarity: string;
  setNumber: string;
  setName: string;
  language: Language;
  imageUrl: string;
  setSymbol: string | null;
  artist: string | null;
}

export interface SalesRecord
{
  id: string;
  inventoryItemId: string;
  platform: string;
  listingUrl: string | null;
  listedPriceGbp: number | null;
  dateListed: string | null;
  dateSold: string | null;
  finalSalePriceGbp: number | null;
  platformFeesGbp: number | null;
  shippingCostGbp: number | null;
}

export interface ExportRecord
{
  id: string;
  exportedAt: string;
  fileName: string;
  itemCount: number;
  totalValueGbp: number | null;
  discountPercent: number | null;
  finalValueGbp: number | null;
  includedTagIds: string[];
}

export interface InventoryItem
{
  id: string;
  cardId: string;
  storageType: StorageType;
  condition: Condition | null;
  gradingCompany: GradingCompany | null;
  grade: number | null;
  certNumber: string | null;
  isMisprint: boolean;
  notes: string | null;
  tags: string[];
  storageLocation: string | null;
  status: Status;
  priceHistory: ValuationEntry[];
  cardMetadata: CardMetadata;
  salesRecord?: SalesRecord | null;
}
