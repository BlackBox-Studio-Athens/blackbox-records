import * as React from 'react';

import { resolveShopperCountry } from './shopper-country';
import './international-order-notice.css';

const copy = {
  address: 'orders@blackboxrecordsathens.com',
  subject: 'Order from outside Greece',
  link: 'Email us to order',
  strip: {
    label: 'Shipping',
    landmark: 'Shipping outside Greece',
    body: 'We ship within Greece only, for now.',
    detail: "Ordering from abroad? Email us and we'll arrange it with you.",
  },
  line: {
    rule: 'Ships within Greece only.',
    question: 'Outside Greece?',
  },
  card: {
    title: 'Ordering from outside Greece?',
    landmark: 'Ordering from outside Greece',
    body: "Online checkout ships within Greece only for now. Email us what you'd like and where it's going, and we'll confirm shipping and payment with you.",
  },
} as const;

export function buildInternationalOrderMailto(itemTitles: string[] = []): string {
  const items = itemTitles.length ? ` ${itemTitles.join(', ')}` : '';
  const body = `Items:${items}\nCountry:\nCity:`;
  return `mailto:${copy.address}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
}

type InternationalOrderNoticeProps = {
  variant: 'strip' | 'line' | 'card';
  itemTitles?: string[];
  borderTone?: 'accent' | 'neutral';
};

export default function InternationalOrderNotice({
  variant,
  itemTitles = [],
  borderTone = 'accent',
}: InternationalOrderNoticeProps) {
  const [country, setCountry] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void resolveShopperCountry().then((resolved) => {
      if (active) setCountry(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!country || country === 'GR') return null;

  const link = (
    <a className="international-order-notice__link" href={buildInternationalOrderMailto(itemTitles)}>
      {copy.link}
      {variant !== 'line' && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      )}
    </a>
  );
  const className = `international-order-notice international-order-notice--${variant}`;

  if (variant === 'line') {
    return (
      <p className={className}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <rect x="1.5" y="4" width="9" height="7" />
          <path d="M10.5 6.5h2.5l1.5 2v2.5h-4" />
          <circle cx="4.5" cy="12" r="1.2" />
          <circle cx="12" cy="12" r="1.2" />
        </svg>
        <span>
          <span className="international-order-notice__rule">{copy.line.rule} </span>
          {copy.line.question}
        </span>
        {link}
      </p>
    );
  }

  return (
    <aside className={className} aria-label={copy[variant].landmark} data-border-tone={borderTone}>
      {variant === 'strip' ? (
        <>
          <span className="international-order-notice__label">{copy.strip.label}</span>
          <p className="international-order-notice__body">
            {copy.strip.body} <span>{copy.strip.detail}</span>
          </p>
        </>
      ) : (
        <>
          <h3 className="international-order-notice__title">{copy.card.title}</h3>
          <p className="international-order-notice__body">{copy.card.body}</p>
        </>
      )}
      {link}
    </aside>
  );
}
