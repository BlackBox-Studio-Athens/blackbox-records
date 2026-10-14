import type { EmailConsentRecord, EmailConsentRepository, ProviderNewsletterContact } from '../../application/email';

const activeToken = `"tokenHash" = ? AND "purpose" = ? AND "consumedAt" IS NULL AND "expiresAt" > ?`;

export class D1EmailConsentRepository implements EmailConsentRepository {
  constructor(private readonly db: D1Database) {}

  async reserve(record: EmailConsentRecord, day: string): Promise<EmailConsentRecord | null> {
    const recent = new Date(new Date(record.createdAt).getTime() - 60 * 60 * 1000).toISOString();
    // One atomic batch reserves both a recipient attempt and one of twenty daily confirmation sends.
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO "EmailConsent"
        ("id", "tokenHash", "purpose", "email", "payload", "createdAt", "expiresAt")
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM "EmailConsent" WHERE "email" = ? AND "purpose" = ? AND "createdAt" > ?
          AND ("purpose" = 'newsletter' OR "consumedAt" IS NULL))
          AND COALESCE((SELECT "reservedCount" FROM "EmailConsentSendDay" WHERE "day" = ?), 0) < 20`,
        )
        .bind(
          record.id,
          record.tokenHash,
          record.purpose,
          record.email,
          record.payload,
          record.createdAt,
          record.expiresAt,
          record.email,
          record.purpose,
          recent,
          day,
        ),
      this.db
        .prepare(
          `INSERT INTO "EmailConsentSendDay" ("day", "reservedCount")
        SELECT ?, 1 WHERE EXISTS (SELECT 1 FROM "EmailConsent" WHERE "id" = ?)
        ON CONFLICT ("day") DO UPDATE SET "reservedCount" = "reservedCount" + 1`,
        )
        .bind(day, record.id),
    ]);
    return this.db
      .prepare(
        `SELECT * FROM "EmailConsent" WHERE "email" = ? AND "purpose" = ? AND "createdAt" > ?
          AND ("purpose" = 'newsletter' OR "consumedAt" IS NULL)
          AND (COALESCE((SELECT "reservedCount" FROM "EmailConsentSendDay" WHERE "day" = ?), 0) < 20 OR "id" = ?)
      ORDER BY "createdAt" DESC LIMIT 1`,
      )
      .bind(record.email, record.purpose, recent, day, record.id)
      .first<EmailConsentRecord>();
  }

  async markSent(tokenHash: string, now: Date): Promise<void> {
    await this.db
      .prepare('UPDATE "EmailConsent" SET "sentAt" = ? WHERE "tokenHash" = ?')
      .bind(now.toISOString(), tokenHash)
      .run();
  }

  async consumeNewsletter(tokenHash: string, now: Date): Promise<ProviderNewsletterContact | null> {
    const record = await this.db
      .prepare(`UPDATE "EmailConsent" SET "consumedAt" = ? WHERE ${activeToken} RETURNING "payload"`)
      .bind(now.toISOString(), tokenHash, 'newsletter', now.toISOString())
      .first<{ payload: string }>();
    return record ? (JSON.parse(record.payload) as ProviderNewsletterContact) : null;
  }

  async withdrawAlerts(tokenHash: string, now: Date): Promise<void> {
    const args = [tokenHash, 'availability-withdrawal', now.toISOString()];
    await this.db.batch([
      // Leave the presented token valid until the last statement so every step sees the same mailbox.
      this.db
        .prepare(
          `UPDATE "EmailConsent" SET "consumedAt" = ?, "payload" = '{}'
        WHERE "purpose" = 'availability-withdrawal' AND "consumedAt" IS NULL AND "tokenHash" <> ?
          AND "email" = (SELECT "email" FROM "EmailConsent" WHERE ${activeToken})`,
        )
        .bind(now.toISOString(), tokenHash, ...args),
      this.db
        .prepare(
          `DELETE FROM "AvailabilityAlert" WHERE "email" = (SELECT "email" FROM "EmailConsent" WHERE ${activeToken})`,
        )
        .bind(...args),
      this.db
        .prepare(`UPDATE "EmailConsent" SET "consumedAt" = ?, "payload" = '{}' WHERE ${activeToken}`)
        .bind(now.toISOString(), ...args),
    ]);
  }

  async prune(now: Date): Promise<void> {
    const recent = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oldDay = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await this.db.batch([
      this.db
        .prepare(
          `DELETE FROM "EmailConsent" WHERE "expiresAt" <= ? OR
        ("purpose" = 'availability-withdrawal' AND "createdAt" <= ? AND NOT EXISTS
          (SELECT 1 FROM "AvailabilityAlert" WHERE "email" = "EmailConsent"."email"))`,
        )
        .bind(now.toISOString(), recent),
      this.db.prepare('DELETE FROM "EmailConsentSendDay" WHERE "day" < ?').bind(oldDay),
    ]);
  }
}
