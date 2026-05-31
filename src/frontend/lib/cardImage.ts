const DIRECT_IMAGE_RE = /\.(png|jpe?g|webp|gif)(\?|$)/i;

export function isDirectImageUrl(url: string): boolean
{
  return DIRECT_IMAGE_RE.test(url);
}

export function cardImageUrl(baseUrl: string, quality: 'low' | 'high' | 'original' = 'low'): string
{
  if (!baseUrl) return '';
  if (isDirectImageUrl(baseUrl)) return baseUrl;
  if (quality === 'low') return `${baseUrl}/low.png`;
  if (quality === 'high') return `${baseUrl}/high.png`;
  return baseUrl;
}
