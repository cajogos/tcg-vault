import type { InventoryItem } from '../types';

// sellerCountry=7 is Great Britain on CardMarket
export function generateCardmarketUkLink(item: InventoryItem): string
{
  const search = item.cardMetadata.name;
  const params = new URLSearchParams({
    idExpansion: '0',
    searchString: search,
    idRarity: '0',
    perSite: '30',
    mode: 'gallery',
    sellerCountry: '7',
  });
  return `https://www.cardmarket.com/en/Pokemon/Products/Singles?${params.toString()}`;
}
