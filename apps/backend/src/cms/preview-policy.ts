export function previewPolicy(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    throw new Error('Invalid preview origin');
  return `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src https://bandcamp.com https://*.bandcamp.com https://embed.tidal.com; form-action 'none'; base-uri 'none'; frame-ancestors ${url.origin}; sandbox allow-scripts allow-same-origin`;
}
