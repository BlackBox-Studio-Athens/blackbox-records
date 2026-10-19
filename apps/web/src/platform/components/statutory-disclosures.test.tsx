import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { productSafetyOfferInformation } from '@blackbox/content-model';
import LegalGuaranteeNotice from './LegalGuaranteeNotice';
import PurchaseInformation from './PurchaseInformation';
import ProductSafetyDisclosure, { type ProductSafetyInformation } from './ProductSafetyDisclosure';

const verified = {
  review_status: 'verified',
  operator_role: 'distributor',
  product_type: '12-inch vinyl LP',
  product_identifier: 'BBX-014',
  manufacturer: {
    name: 'Example Pressing Ltd',
    postal_address: '12 Example Street, 104 31 Athens, Greece',
    electronic_address: 'safety@example.test',
    establishment: 'eu',
  },
  safety_information: { status: 'provided', text_el: 'Φυλάσσετε μακριά από πηγές θερμότητας.' },
  evidence: { reference: 'Invoice 2026-031', checked_on: '2026-10-14', notes: 'Private supplier note' },
};

describe('legal guarantee notice', () => {
  it('is a closed native disclosure with the official artwork, both languages and a real-text transcript', () => {
    const markup = renderToStaticMarkup(<LegalGuaranteeNotice />);
    expect(markup).toMatch(
      /^<details class="legal-guarantee" data-legal-guarantee="true"><summary>Your legal guarantee rights<\/summary>/,
    );
    expect(markup).not.toContain(' open');
    expect(markup).toContain('legal-guarantee-notice-en.svg');
    expect(markup).toContain('legal-guarantee-notice-el.svg');
    expect(markup).toContain('alt="EU notice on your legal guarantee rights"');
    expect(markup).toContain('href="https://europa.eu/youreurope/guarantees"');
    expect(markup).toContain('Minimum two-year legal guarantee protection for goods sold in the European Union.');
    expect(markup).toContain('<div lang="el">');
    expect(markup).toContain('Ελάχιστη νόμιμη εγγύηση δύο ετών');
  });

  it('remains in checkout support while compact item information stays concise', () => {
    expect(renderToStaticMarkup(<PurchaseInformation presentation="checkout-support" />)).toContain(
      'data-legal-guarantee',
    );
    expect(renderToStaticMarkup(<PurchaseInformation presentation="checkout" />)).not.toContain('data-legal-guarantee');
    expect(renderToStaticMarkup(<PurchaseInformation />)).not.toContain('data-legal-guarantee');
  });

  it('ships the unmodified Commission files', () => {
    const hash = (name: string) =>
      createHash('sha256')
        .update(readFileSync(new URL(`../../../public/assets/images/legal/${name}`, import.meta.url)))
        .digest('hex');
    expect(hash('legal-guarantee-notice-en.svg')).toBe(
      'd1b4293b75637022b582b3025f789d292e1c845660a0460d855bbe523b9763f7',
    );
    expect(hash('legal-guarantee-notice-el.svg')).toBe(
      'cb474fb5261ed80aa1e21695d07268b39897e2d8043e69c6988907f879c2f428',
    );
  });
});

describe('product safety disclosure', () => {
  it('renders nothing for an unverified or missing projection', () => {
    expect(renderToStaticMarkup(<ProductSafetyDisclosure information={undefined} />)).toBe('');
    expect(productSafetyOfferInformation({ ...verified, review_status: 'incomplete' })).toBeUndefined();
  });

  it('shows the verified public facts in a closed disclosure and never the private evidence', () => {
    const information = productSafetyOfferInformation(verified) as ProductSafetyInformation;
    const markup = renderToStaticMarkup(<ProductSafetyDisclosure information={information} />);
    expect(markup).toMatch(
      /^<details class="product-safety" data-product-safety="true"><summary>Product safety<\/summary>/,
    );
    expect(markup).toContain('Example Pressing Ltd, 12 Example Street, 104 31 Athens, Greece');
    expect(markup).toContain('href="mailto:safety@example.test"');
    expect(markup).toContain('BBX-014');
    expect(markup).toContain('<dd lang="el">Φυλάσσετε μακριά από πηγές θερμότητας.</dd>');
    for (const secret of ['Invoice 2026-031', 'Private supplier note', 'distributor', '2026-10-14']) {
      expect(markup).not.toContain(secret);
    }
  });

  it('names a non-EU manufacturer’s EU responsible person and an evidenced no-warnings assessment', () => {
    const information = productSafetyOfferInformation({
      ...verified,
      manufacturer: {
        ...verified.manufacturer,
        establishment: 'non_eu',
        electronic_address: 'https://plant.example/contact',
      },
      responsible_person: {
        name: 'EU Rep GmbH',
        postal_address: 'Beispielstraße 1, 10115 Berlin, Germany',
        electronic_address: 'rep@example.test',
        eu_country: 'DE',
      },
      safety_information: { status: 'not_required' },
    }) as ProductSafetyInformation;
    const markup = renderToStaticMarkup(<ProductSafetyDisclosure information={information} />);
    expect(markup).toContain('EU responsible person');
    expect(markup).toContain('EU Rep GmbH');
    expect(markup).toContain('href="https://plant.example/contact" target="_blank" rel="noopener noreferrer"');
    expect(markup).toContain('No specific warnings for this product');
  });

  for (const [address, href, newTab] of [
    ['safety@example.test', 'mailto:safety@example.test', false],
    ['https://plant.example/contact', 'https://plant.example/contact', true],
    ['https://plant.example/@safety/contact', 'https://plant.example/@safety/contact', true],
    [
      'https://plant.example/contact?email=safety@example.test',
      'https://plant.example/contact?email=safety@example.test',
      true,
    ],
  ] as const) {
    it(`links the ${address} contact of both the manufacturer and the EU responsible person`, () => {
      const information = productSafetyOfferInformation({
        ...verified,
        manufacturer: { ...verified.manufacturer, establishment: 'non_eu', electronic_address: address },
        responsible_person: {
          name: 'EU Rep GmbH',
          postal_address: 'Beispielstraße 1, 10115 Berlin, Germany',
          electronic_address: address,
          eu_country: 'DE',
        },
      }) as ProductSafetyInformation;
      const markup = renderToStaticMarkup(<ProductSafetyDisclosure information={information} />);
      const links = [...markup.matchAll(/<a href="([^"]*)"([^>]*)>([^<]*)<\/a>/g)];
      expect(links).toHaveLength(2);
      for (const [, linkHref, attributes, text] of links) {
        expect(linkHref).toBe(href);
        expect(text).toBe(address);
        expect(attributes).toBe(newTab ? ' target="_blank" rel="noopener noreferrer"' : '');
      }
    });
  }
});
