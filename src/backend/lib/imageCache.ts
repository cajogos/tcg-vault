import fs from 'fs';
import path from 'path';
import { imagesDir } from './config';

const DIRECT_IMAGE_RE = /\.(png|jpe?g|webp|gif)(\?|$)/i;

function isDirect(url: string): boolean
{
  return DIRECT_IMAGE_RE.test(url);
}

export function localImagePath(cardId: string): string
{
  return path.join(imagesDir, `${cardId}.png`);
}

export function localImageUrl(cardId: string): string
{
  return `/images/${cardId}.png`;
}

export function hasLocalImage(cardId: string): boolean
{
  return fs.existsSync(localImagePath(cardId));
}

export async function downloadCardImage(cardId: string, imageUrl: string): Promise<string | null>
{
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/images/')) return imageUrl;

  const fetchUrl = isDirect(imageUrl) ? imageUrl : `${imageUrl}/high.png`;

  fs.mkdirSync(imagesDir, { recursive: true });

  try
  {
    const response = await fetch(fetchUrl);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localImagePath(cardId), buffer);
    return localImageUrl(cardId);
  }
  catch
  {
    return null;
  }
}
