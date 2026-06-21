import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { buildPaidOrderEmailPreviews } from '../apps/backend/src/application/email';

const outputDir = path.join(process.cwd(), '.codex-artifacts', 'email-previews');

mkdirSync(outputDir, { recursive: true });

for (const preview of buildPaidOrderEmailPreviews()) {
  const filePath = path.join(outputDir, `${preview.name}.html`);
  writeFileSync(filePath, preview.message.html, 'utf8');
  console.log(filePath);
}
