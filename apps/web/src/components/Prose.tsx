import { PortableText, type PortableTextComponents, type PortableTextBlockComponent } from '@portabletext/react';
import {
  cmsLinkSchema,
  groupEditorialBlocks,
  proseBlocks,
  resolveProse,
  type Prose as ProseValue,
  type RichText,
} from '@blackbox/content-model';
import type { CSSProperties } from 'react';

const tags = {
  normal: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  blockquote: 'blockquote',
} as const;
const alignment = (value: unknown): CSSProperties =>
  typeof value === 'string' && ['left', 'center', 'right', 'justify'].includes(value)
    ? { textAlign: value as CSSProperties['textAlign'] }
    : {};
const block: PortableTextBlockComponent = ({ value, children }) => {
  const Tag = tags[value.style as keyof typeof tags] ?? 'p';
  return <Tag style={alignment('textAlign' in value ? value.textAlign : undefined)}>{children}</Tag>;
};
const components: Partial<PortableTextComponents> = {
  block,
  listItem: ({ value, children }) => (
    <li style={alignment('textAlign' in value ? value.textAlign : undefined)}>{children}</li>
  ),
  list: {
    number: ({ value, children }) => {
      const first = value.children[0] as { listStart?: number } | undefined;
      return <ol start={first?.listStart}>{children}</ol>;
    },
  },
  marks: {
    underline: ({ children }) => <u>{children}</u>,
    'strike-through': ({ children }) => <s>{children}</s>,
    link: ({ value, children }) => {
      const href = cmsLinkSchema.parse(value?.href);
      const blank = !href.startsWith('#') && value?.blank;
      return (
        <a href={href} target={blank ? '_blank' : undefined} rel={blank ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      );
    },
  },
};

export default function Prose({
  value,
  rich,
  className = '',
}: {
  value?: ProseValue | null | undefined;
  rich?: RichText | null | undefined;
  className?: string;
}) {
  return (
    <div className={`editorial-prose ${className}`}>
      {groupEditorialBlocks(proseBlocks(resolveProse(value, rich))).map((group, index) =>
        group.quote ? (
          <blockquote key={index}>
            <PortableText value={group.value} components={components} />
          </blockquote>
        ) : (
          <PortableText key={index} value={group.value} components={components} />
        ),
      )}
    </div>
  );
}
