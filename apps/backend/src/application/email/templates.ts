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
      '<head><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:dark light;supported-color-schemes:dark light;}@media (max-width: 600px) { table { width: 100% !important; } h1 { font-size: 24px !important; } .email-pad { padding-left: 18px !important; padding-right: 18px !important; } .email-stack { display:block !important; width:100% !important; box-sizing:border-box !important; } .email-logo { width: 156px !important; height:auto !important; } }@media (prefers-color-scheme: light) { body { background:#0d0d0d !important; color:#f5f5f5 !important; } }</style></head>',
      '<body style="margin:0;background:#0d0d0d;color:#f5f5f5;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">',
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
