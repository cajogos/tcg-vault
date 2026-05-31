import type { InventoryItem } from '../types';

export function generateEbayUkSoldLink(item: InventoryItem): string
{
  const languageLabel = item.cardMetadata.language === 'JP' ? 'japanese' : 'english';
  let query = `${item.cardMetadata.name} ${item.cardMetadata.setName} ${item.cardMetadata.setNumber} ${languageLabel}`;
  if (item.storageType === 'graded')
  {
    query += ` ${item.gradingCompany} ${item.grade}`;
  }
  else if (item.tags.includes('sealed'))
  {
    query += ' sealed promo';
  }
  if (item.tags.includes('pokemon-center-stamp'))
  {
    query += ' pokemon center';
  }
  return `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&rt=nc&LH_PrefLoc=1`;
}
