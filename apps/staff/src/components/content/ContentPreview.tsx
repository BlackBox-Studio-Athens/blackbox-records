import { lazy, Suspense, useEffect, useState } from 'react';
import {
  editorialMediaUrl,
  editorialRequest,
  type EditorialMedia,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';
import type { ContentData, ContentSection } from './ContentFields';

const ContentBodyEditor = lazy(() => import('./ContentBodyEditor'));
function DraftImage({ value, alt, base }: { value: unknown; alt: unknown; base: string }) {
  const id = (value as { id?: string } | null)?.id;
  const [source, setSource] = useState('');
  useEffect(() => {
    let active = true;
    setSource('');
    if (id)
      void editorialRequest<{ item: EditorialMedia }>(base, `media/${encodeURIComponent(id)}`)
        .then(({ item }) => {
          const origin = new URL(base || window.location.origin).origin;
          if (active) setSource(editorialMediaUrl(item, origin));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, base]);
  return source ? (
    <img src={source} alt={String(alt ?? '')} className="max-h-[32rem] w-full object-contain" />
  ) : (
    <p className="border border-border p-6">{id ? 'Image preview unavailable.' : 'Choose an image.'}</p>
  );
}

export default function ContentPreview({
  collection,
  data,
  base,
}: {
  collection: ContentSection;
  data: ContentData;
  base: string;
}) {
  const [artist, setArtist] = useState('');
  useEffect(() => {
    let active = true;
    if (collection === 'releases' && typeof data.artist === 'string') {
      void editorialRequest<{ item: EditorialRecord }>(base, `content/artists/${encodeURIComponent(data.artist)}`)
        .then(({ item }) => {
          if (active) setArtist(String(item.data.title));
        })
        .catch(() => {
          if (active) setArtist('Artist preview unavailable.');
        });
    }
    return () => {
      active = false;
    };
  }, [collection, data.artist, base]);
  const object = (value: unknown) => (value as ContentData) ?? {};
  const text = (value: unknown) => String(value ?? '');
  const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
  const paragraph = (value: unknown) => (
    <p className="max-w-[70ch] whitespace-pre-wrap leading-relaxed">{text(value)}</p>
  );
  const picture = (value: unknown, alt: unknown) => <DraftImage value={value} alt={alt} base={base} />;
  const hero = object(data.hero);
  const title = <h1 className="break-words text-3xl font-semibold">{text(data.title ?? hero.title)}</h1>;
  const body =
    Array.isArray(data.body) && data.body.length > 0 ? (
      <Suspense fallback={<p>Loading text…</p>}>
        <ContentBodyEditor value={data.body as never} editable={false} minimal />
      </Suspense>
    ) : null;
  return (
    <section aria-label="Draft preview" className="grid min-w-0 gap-6 border border-border p-4 sm:p-8">
      <p className="font-semibold">Draft preview. Only signed-in label members can see this.</p>
      {collection === 'home' && (
        <>
          {picture(hero.image, hero.image_alt)}
          <h1 className="text-3xl font-semibold">{text(hero.tagline)}</h1>
          {paragraph(hero.scroll_indicator_text)}
          <h2 className="text-2xl">{text(object(data.news).title)}</h2>
          {paragraph(object(data.news).link_text)}
          <h2 className="text-2xl">{text(object(data.artists).title)}</h2>
          {paragraph(object(data.artists).button_text)}
        </>
      )}
      {collection === 'about' && (
        <>
          {paragraph(hero.section_label)}
          {title}
          {picture(hero.image, hero.image_alt)}
          {paragraph(object(data.lead).text)}
          <h2 className="text-2xl">{text(object(data.story).title)}</h2>
          {array(object(data.story).paragraphs).map((value, index) => (
            <div key={index}>{paragraph(value)}</div>
          ))}
          {data.quote ? (
            <blockquote>
              {paragraph(object(data.quote).text)}
              <cite>{text(object(data.quote).cite)}</cite>
            </blockquote>
          ) : null}
          <h2 className="text-2xl">{text(object(data.contact).title)}</h2>
          {paragraph(object(data.contact).intro)}
          {array(object(data.contact).items).map((item, index) => (
            <p key={index}>
              {text(object(item).label)}: {text(object(item).value)}
            </p>
          ))}
          {array(object(data.stats).items).map((item, index) => (
            <p key={index}>
              {text(object(item).key)} {text(object(item).label)}
            </p>
          ))}
        </>
      )}
      {collection === 'services' && (
        <>
          {title}
          {paragraph(hero.intro)}
          {paragraph(hero.cta_text)}
          {array(object(data.services).items).map((raw, index) => {
            const item = object(raw);
            return (
              <section className="grid gap-4" key={index}>
                <h2 className="text-2xl">{text(item.title)}</h2>
                {picture(item.image, item.image_alt)}
                {paragraph(item.summary)}
                <ul className="list-disc pl-6">
                  {array(item.bullets).map((bullet, i) => (
                    <li key={i}>{text(bullet)}</li>
                  ))}
                </ul>
                {paragraph(item.contact_note)}
                {paragraph(item.partner_name)}
              </section>
            );
          })}
          <h2 className="text-2xl">{text(object(data.process).title)}</h2>
          {paragraph(object(data.process).intro)}
          {array(object(data.process).steps).map((step, index) => (
            <section key={index}>
              <h3 className="text-xl">{text(object(step).title)}</h3>
              {paragraph(object(step).body)}
            </section>
          ))}
          <h2 className="text-2xl">{text(object(data.inquiry).title)}</h2>
          {paragraph(object(data.inquiry).intro)}
          {paragraph(object(data.inquiry).email)}
          {paragraph(object(data.inquiry).submit_text)}
        </>
      )}
      {collection === 'artists' && (
        <>
          {title}
          {picture(data.image, data.image_alt)}
          {paragraph([data.genre, data.country].filter(Boolean).join(' · '))}
          {paragraph(data.bio)}
          {body}
          {paragraph(data.upcoming_release)}
          {array(data.profile_links).map((link, index) => (
            <p key={index}>
              {text(object(link).label)}: {text(object(link).url)}
            </p>
          ))}
          {array(data.videos).map((video, index) => (
            <section key={index}>
              <h2 className="text-xl">{text(object(video).title)}</h2>
              {paragraph(object(video).description)}
            </section>
          ))}
        </>
      )}
      {collection === 'releases' && (
        <>
          {title}
          {paragraph(artist)}
          {picture(data.cover_image, data.cover_image_alt)}
          {paragraph(data.release_date)}
          {paragraph(data.summary)}
          {paragraph(array(data.formats).join(' · '))}
          {body}
          {array(data.credits).map((credit, index) => (
            <p key={index}>
              {text(object(credit).role)}: {text(object(credit).name)}
            </p>
          ))}
        </>
      )}
      {collection === 'distro' && (
        <>
          {title}
          {paragraph(data.artist_or_label)}
          {picture(data.image, data.image_alt)}
          {paragraph(data.group)}
          {paragraph(data.format)}
          {paragraph(data.summary)}
          {paragraph(data.release_date)}
          {array(data.gallery).map((item, index) => (
            <div key={index}>{picture(object(item).image, object(item).image_alt)}</div>
          ))}
        </>
      )}
      {collection === 'news' && (
        <>
          {paragraph(data.section_label)}
          {title}
          {paragraph(data.date)}
          {picture(data.image, data.image_alt)}
          {paragraph(data.summary)}
          {body}
        </>
      )}
    </section>
  );
}
