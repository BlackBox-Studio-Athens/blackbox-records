import type { EmailMessageContent } from './types';

export function createBlackBoxEmailTemplate(input: {
  bodyHtml: string;
  bodyText: string;
  preheader: string;
  subject: string;
}): EmailMessageContent {
  return {
    html: [
      '<!doctype html>',
      '<html>',
      '<head><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media (max-width: 600px) { table { width: 100% !important; } h1 { font-size: 24px !important; } }</style></head>',
      '<body style="margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,sans-serif;">',
      `<span style="display:none;opacity:0;visibility:hidden;">${escapeHtml(input.preheader)}</span>`,
      input.bodyHtml,
      '</body>',
      '</html>',
    ].join(''),
    preheader: input.preheader,
    subject: input.subject,
    text: input.bodyText,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
