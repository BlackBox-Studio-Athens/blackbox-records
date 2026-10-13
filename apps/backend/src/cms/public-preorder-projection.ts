import { z } from 'zod';
import type { PublishedPreorders } from './published-reader';

export const publicPreorderProjectionPath = '/__publication/preorders';

// Same canonical key order as the commerce projection, so both sides derive the same identity.
export const publicPreorderProjectionSchema = z.object({
  items: z
    .array(
      z.object({
        storeItemSlug: z
          .string()
          .max(256)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        displayPrice: z.string().min(1).max(64),
        shipEstimate: z
          .discriminatedUnion('kind', [
            z.object({
              kind: z.literal('month'),
              month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
              part: z.enum(['early', 'mid', 'late']).nullable(),
            }),
            z.object({ kind: z.literal('date'), date: z.iso.date() }),
          ])
          .nullable(),
      }),
    )
    .max(500),
});

export async function publicPreorderIdentity(projection: PublishedPreorders) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(projection)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

type Stored = { projection: PublishedPreorders; identity: string };

/** The latest accepted projection, durable across hibernation. One row; an unchanged identity writes nothing. */
export class PublicPreorderStore {
  private current: Stored | null | undefined;
  constructor(private sql: SqlStorage) {
    sql.exec(`CREATE TABLE IF NOT EXISTS public_preorder_projection (
      id INTEGER PRIMARY KEY CHECK (id = 1), identity TEXT NOT NULL, projection TEXT NOT NULL
    )`);
  }

  read(): Stored | null {
    if (this.current === undefined) {
      const row = this.sql
        .exec<{ identity: string; projection: string }>(
          'SELECT identity, projection FROM public_preorder_projection WHERE id = 1',
        )
        .toArray()[0];
      this.current = row ? { identity: row.identity, projection: JSON.parse(row.projection) } : null;
    }
    return this.current;
  }

  /** Stores a changed projection and reports whether it changed. */
  write(projection: PublishedPreorders, identity: string): boolean {
    if (this.read()?.identity === identity) return false;
    this.sql.exec(
      'INSERT OR REPLACE INTO public_preorder_projection (id, identity, projection) VALUES (1, ?, ?)',
      identity,
      JSON.stringify(projection),
    );
    this.current = { projection, identity };
    return true;
  }
}
