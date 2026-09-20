import type { ReactNode } from 'react';
import { changedPublicationFields, type PublicationReview } from '@blackbox/content-model';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { contentSections, type ContentSection } from './ContentFields';

const publicationFieldLabel = (key: string) =>
  ({
    body: 'Content',
    bio: 'Biography',
    image: 'Image',
    image_alt: 'Image description',
    artist: 'Artist',
    hero: 'Opening section',
    group: 'Format',
    profile_links: 'Profile links',
    slug: 'URL name',
  })[key] ?? key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Value({
  value,
  media,
  references,
  field = '',
}: {
  value: unknown;
  media: PublicationReview['media'];
  references: Record<string, string>;
  field?: string;
}): ReactNode {
  if (value === null || value === undefined || value === '')
    return <span className="text-muted-foreground">Not set</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number')
    return (
      <span className="whitespace-pre-wrap break-words">
        {field === 'artist' ? (references[String(value)] ?? 'Artist unavailable') : String(value)}
      </span>
    );
  if (Array.isArray(value))
    return value.length ? (
      <ol className="publication-value-list">
        {value.map((item, index) => (
          <li key={index}>
            <Value value={item} media={media} references={references} />
          </li>
        ))}
      </ol>
    ) : (
      <span className="text-muted-foreground">None</span>
    );
  if (typeof value !== 'object') return null;
  const object = value as Record<string, unknown>;
  if (object._type === 'image' && object.asset && typeof object.asset === 'object' && '_ref' in object.asset)
    return (
      <figure>
        <Value value={{ id: object.asset._ref }} media={media} references={references} />
        <figcaption>Image description: {String(object.alt ?? 'Not set')}</figcaption>
      </figure>
    );
  if (typeof object.id === 'string' && (Object.keys(object).length === 1 || object.provider === 'local')) {
    const image = media[object.id];
    return image ? (
      <img
        className="publication-comparison-image"
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        loading="lazy"
      />
    ) : (
      <span>Image unavailable</span>
    );
  }
  if (object._type === 'block' && Array.isArray(object.children))
    return (
      <div className="publication-rich-text">
        {typeof object.style === 'string' && object.style !== 'normal' && (
          <span className="text-xs text-muted-foreground">{String(object.style)}</span>
        )}
        <p>
          {object.children.map((child: { text?: string; marks?: string[] }, index) => (
            <span key={index}>
              {child.marks?.reduce<ReactNode>((text, mark) => {
                if (mark === 'strong') return <strong>{text}</strong>;
                if (mark === 'em') return <em>{text}</em>;
                if (mark === 'code') return <code>{text}</code>;
                if (mark === 'underline') return <u>{text}</u>;
                if (mark === 'strike-through') return <s>{text}</s>;
                return text;
              }, child.text) ?? child.text}
            </span>
          ))}
        </p>
        {Array.isArray(object.markDefs) &&
          object.markDefs.map((definition: { href?: string }, index) =>
            definition.href ? <p key={index}>Link: {definition.href}</p> : null,
          )}
        {typeof object.listItem === 'string' && (
          <small>
            {String(object.listItem)} list, level {String(object.level ?? 1)}
          </small>
        )}
      </div>
    );
  return (
    <dl className="publication-value-fields">
      {Object.entries(object)
        .filter(([key]) => !key.startsWith('_') && key !== 'provider')
        .map(([key, child]) => (
          <div key={key}>
            <dt>{publicationFieldLabel(key)}</dt>
            <dd>
              <Value value={child} media={media} references={references} field={key} />
            </dd>
          </div>
        ))}
    </dl>
  );
}

export default function PublicationComparison({
  review,
  activeEntry,
  onActiveEntryChange,
}: {
  review: PublicationReview;
  activeEntry?: string;
  onActiveEntryChange?(value: string): void;
}) {
  const firstEntry = `${review.entries[0]?.collection}/${review.entries[0]?.recordId}`;
  return (
    <Accordion
      type="single"
      collapsible
      {...(activeEntry === undefined
        ? { defaultValue: firstEntry }
        : { value: activeEntry, onValueChange: onActiveEntryChange ?? (() => {}) })}
    >
      {review.entries.map((entry) => {
        const fields = changedPublicationFields(entry);
        return (
          <AccordionItem
            key={`${entry.collection}/${entry.recordId}`}
            value={`${entry.collection}/${entry.recordId}`}
            className="publication-entry"
          >
            <AccordionTrigger>
              <span className="text-left">
                <strong className="block text-base">{entry.title}</strong>
                <span className="text-sm font-normal text-muted-foreground">
                  {contentSections[entry.collection as ContentSection]} ·{' '}
                  {entry.before ? `${fields.length} ${fields.length === 1 ? 'field' : 'fields'} changed` : 'New entry'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {entry.issues.length > 0 && (
                <div role="alert" className="publication-issues">
                  <strong>Needs attention</strong>
                  <ul>
                    {entry.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                  <a href={`/content/?${new URLSearchParams({ collection: entry.collection, id: entry.recordId })}`}>
                    Finish editing
                  </a>
                </div>
              )}
              {!fields.length && <p>No editorial differences from the website.</p>}
              {fields.map((field) => (
                <section className="publication-field" key={field}>
                  <h3>{publicationFieldLabel(field)}</h3>
                  <div className="publication-before-after">
                    {(['before', 'after'] as const).map((side) => (
                      <div key={side}>
                        <p className="publication-value-label">
                          {side === 'before' ? 'On the website' : 'After publishing'}
                        </p>
                        {entry[side] ? (
                          <Value
                            value={entry[side][field]}
                            field={field}
                            media={review.media}
                            references={side === 'before' ? review.baselineReferenceTitles : review.referenceTitles}
                          />
                        ) : (
                          <p className="text-muted-foreground">Not yet published</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
