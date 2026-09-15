// Meta CSP in Firefox srcdoc frames does not reliably resolve 'self'. Use the validated request origin.
export function previewPolicy(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    throw new Error('Invalid preview origin');
  return `default-src 'none'; img-src ${url.origin} data:; style-src ${url.origin} 'unsafe-inline' https://fonts.googleapis.com; font-src ${url.origin} https://fonts.gstatic.com; script-src 'none'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'`;
}
