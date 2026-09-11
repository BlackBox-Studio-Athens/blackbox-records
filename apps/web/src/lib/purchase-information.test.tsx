import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import source from '@/content/purchase-information/site.json';
import PurchaseInformation, { PrivacyLink } from '@/components/PurchaseInformation';
import PurchaseDocument from '@/components/PurchaseDocument';
import { getPurchaseInformation, purchasePrivacyHeadings, purchaseTermsHeadings } from './purchase-information';
import { purchaseInformationSchema } from './purchase-information-schema';

afterEach(() => vi.unstubAllEnvs());

describe('purchase information publication', () => {
  it('allows the editable draft but rejects publishing placeholders, missing sections and monetary authority', () => {
    expect(purchaseInformationSchema.safeParse(source).success).toBe(true);
    expect(purchaseInformationSchema.safeParse({ ...source, publication: 'approved' }).success).toBe(false);
    const content = JSON.parse(
      JSON.stringify(source.content)
        .replaceAll(/[^"\\]*to be confirmed[^"\\]*/gi, 'Reviewed fixture text')
        .replaceAll('support@example.invalid', 'support@example.com'),
    );
    const approved = { publication: 'approved', content };
    expect(purchaseInformationSchema.safeParse(approved).success).toBe(true);
    expect(purchaseInformationSchema.safeParse({ ...approved, content: { ...content, price: 250 } }).success).toBe(
      false,
    );
    for (const key of Object.keys(content.terms)) {
      const terms = { ...content.terms };
      delete terms[key];
      expect(purchaseInformationSchema.safeParse({ ...approved, content: { ...content, terms } }).success).toBe(false);
    }
    for (const key of Object.keys(content.privacy)) {
      const privacy = { ...content.privacy };
      delete privacy[key];
      expect(purchaseInformationSchema.safeParse({ ...approved, content: { ...content, privacy } }).success).toBe(
        false,
      );
    }
  });

  it('omits drafts and their privacy links outside local development', () => {
    vi.stubEnv('DEV', false);
    expect(getPurchaseInformation()).toBeNull();
    expect(renderToStaticMarkup(<PrivacyLink />)).toBe('');
    const html = renderToStaticMarkup(<PurchaseInformation />);
    expect(html).not.toMatch(/to be confirmed|example.invalid|\/privacy\//i);
    expect(html).toContain('/terms/#returns');
    expect(html).toContain('does not mean home delivery');
    expect(html).not.toContain('€');
  });

  it('renders every full document section and shared summaries without JavaScript', () => {
    vi.stubEnv('DEV', true);
    const information = getPurchaseInformation()!;
    const summary = renderToStaticMarkup(<PurchaseInformation information={information} />);
    expect(summary).toContain(information.terms.dispatch.summary);
    expect(summary).toContain(information.terms.delivery.summary);
    expect(summary).toContain('/privacy/');
    for (const kind of ['terms', 'privacy'] as const) {
      const html = renderToStaticMarkup(<PurchaseDocument kind={kind} information={information} />);
      const headings = kind === 'terms' ? purchaseTermsHeadings : purchasePrivacyHeadings;
      for (const id of Object.keys(headings)) {
        expect(html).toContain(`id="${id.replaceAll('_', '-')}"`);
        expect(html).toContain(`href="#${id.replaceAll('_', '-')}"`);
      }
      for (const section of Object.values(information[kind])) {
        for (const paragraph of section.paragraphs) expect(html).toContain(paragraph);
      }
      expect(html).toContain('Draft purchase information');
      expect(html).not.toContain('mailto:support@example.invalid');
    }
  });
});
