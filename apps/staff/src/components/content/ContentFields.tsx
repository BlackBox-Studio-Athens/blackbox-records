import { lazy, Suspense } from 'react';
import { cmsBodySchema, DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import EditorialPicker from '../items/EditorialPicker';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const ContentBodyEditor = lazy(() => import('./ContentBodyEditor'));
export type ContentData = Record<string, unknown>;
export const contentSections = {
  artists: 'Artists',
  releases: 'Releases',
  distro: 'Distro and merch',
  news: 'News',
  home: 'Home page',
  about: 'About page',
  services: 'Services page',
  distro_page: 'Distro page',
  purchase_information: 'Purchase information',
  newsletter: 'Newsletter',
  navigation: 'Navigation',
  socials: 'Social links',
  settings: 'Label details',
} as const;
export type ContentSection = keyof typeof contentSections;

export default function ContentFields({
  collection,
  data,
  onChange,
  base,
  disabled = false,
}: {
  collection: ContentSection;
  data: ContentData;
  onChange(data: ContentData): void;
  base: string;
  disabled?: boolean;
}) {
  function value(path: string): unknown {
    return path
      .split('.')
      .reduce<unknown>(
        (current, key) => (current && typeof current === 'object' ? (current as ContentData)[key] : undefined),
        data,
      );
  }
  function set(path: string, next: unknown) {
    const updated = structuredClone(data);
    const parts = path.split('.');
    let parent = updated;
    for (const key of parts.slice(0, -1)) {
      if (!parent[key] || typeof parent[key] !== 'object') parent[key] = {};
      parent = parent[key] as ContentData;
    }
    parent[parts.at(-1)!] = next;
    onChange(updated);
  }
  const fieldClass = 'min-h-11 w-full min-w-0 border border-border bg-background p-2';
  function field(
    path: string,
    label: string,
    options: { multiline?: boolean; type?: string; required?: boolean } = {},
  ) {
    const props = {
      id: `content-${path}`,
      value: String(value(path) ?? ''),
      required: options.required ?? true,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const input = event.target.value;
        set(
          path,
          options.type === 'number'
            ? input === ''
              ? null
              : Number(input)
            : input || (options.required === false ? (path.includes('.') ? undefined : null) : ''),
        );
      },
    };
    return (
      <label className="grid min-w-0 gap-2" key={path}>
        {label}
        {options.required === false ? ' (optional)' : ''}
        {options.multiline ? (
          <textarea {...props} className={fieldClass} rows={4} />
        ) : (
          <Input {...props} type={options.type ?? 'text'} />
        )}
      </label>
    );
  }
  function check(path: string, label: string) {
    return (
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={value(path) === true} onChange={(event) => set(path, event.target.checked)} />
        {label}
      </label>
    );
  }
  function image(path: string, alt: string, label: string) {
    const reference = value(path) as { id?: string } | undefined;
    return (
      <div className="grid gap-4">
        <EditorialPicker
          base={base}
          collection="media"
          label={label}
          value={reference?.id ?? ''}
          selectedLabel="Current image"
          onSelect={(item) => set(path, { id: item.id })}
        />
        {field(alt, 'Describe the image')}
      </div>
    );
  }
  function rows(
    path: string,
    label: string,
    initial: unknown,
    render: (path: string, index: number) => React.ReactNode,
  ) {
    const items = Array.isArray(value(path)) ? (value(path) as unknown[]) : [];
    return (
      <section className="grid min-w-0 gap-4">
        <h2 className="text-xl font-semibold">{label}</h2>
        {items.map((_, index) => (
          <div className="grid min-w-0 gap-4 border-t border-border pt-4" key={`${path}-${index}`}>
            {render(`${path}.${index}`, index)}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={index === 0}
                onClick={() => {
                  const next = [...items];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  set(path, next);
                }}
              >
                Move up
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  set(
                    path,
                    items.filter((_, i) => i !== index),
                  )
                }
              >
                Remove row {index + 1}
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => set(path, [...items, structuredClone(initial)])}>
          Add row
        </Button>
      </section>
    );
  }
  const bodyValidation = cmsBodySchema.safeParse(data.body ?? []);
  const body = (
    <section className="grid min-w-0 gap-3">
      <h2 id="content-body-label" className="text-xl font-semibold">
        Full text
      </h2>
      <p className="text-sm text-muted-foreground">
        Use paragraphs, headings, lists, quotes, links, images with descriptions, or code. HTML, tables, galleries and
        text alignment are not supported.
      </p>
      <Suspense fallback={<p>Loading text editor…</p>}>
        <ContentBodyEditor
          aria-labelledby="content-body-label"
          editable={!disabled}
          value={(data.body ?? []) as never}
          onChange={(body) => set('body', body)}
        />
      </Suspense>
      {!bodyValidation.success && (
        <p role="alert" className="border border-border p-3">
          {bodyValidation.error.issues[0]?.message} Your text is still here and has not been saved.
        </p>
      )}
    </section>
  );
  if (collection === 'artists')
    return (
      <>
        {field('title', 'Artist name')}
        {field('genre', 'Genre')}
        {field('country', 'Country', { required: false })}
        {image('image', 'image_alt', 'Artist image')}
        {field('bio', 'Short biography', { multiline: true })}
        {rows('profile_links', 'Artist links', { label: '', url: '' }, (path) => (
          <>
            {field(`${path}.label`, 'Link name')}
            {field(`${path}.url`, 'Website address', { type: 'url' })}
          </>
        ))}
        {rows('videos', 'Videos', { title: '', youtube_video_id: '' }, (path) => (
          <>
            {field(`${path}.title`, 'Video title')}
            {field(`${path}.youtube_video_id`, 'YouTube video code')}
            {field(`${path}.description`, 'Description', { multiline: true, required: false })}
          </>
        ))}
        {field('upcoming_release', 'Upcoming release', { required: false })}
        {body}
      </>
    );
  if (collection === 'releases')
    return (
      <>
        {field('title', 'Release title')}
        <EditorialPicker
          base={base}
          collection="artists"
          label="Artist"
          value={String(data.artist ?? '')}
          selectedLabel="Current artist"
          onSelect={(item) => set('artist', item.id)}
        />
        {field('release_date', 'Release date', { type: 'date' })}
        {image('cover_image', 'cover_image_alt', 'Cover image')}
        {field('summary', 'Short description', { multiline: true, required: false })}
        {field('merch_url', 'Merchandise link', { required: false })}
        {field('bandcamp_embed_url', 'Bandcamp player link', { required: false })}
        {field('tidal_url', 'Tidal link', { required: false })}
        {rows('formats', 'Formats', '', (path) => field(path, 'Format'))}
        {rows('credits', 'Credits', { role: '', name: '' }, (path) => (
          <>
            {field(`${path}.role`, 'Role')}
            {field(`${path}.name`, 'Name')}
          </>
        ))}
        {body}
      </>
    );
  if (collection === 'news')
    return (
      <>
        {field('title', 'News title')}
        {field('date', 'Date', { type: 'date' })}
        {field('summary', 'Short description', { multiline: true })}
        {image('image', 'image_alt', 'News image')}
        {field('section_label', 'Section label', { required: false })}
        {body}
      </>
    );
  if (collection === 'distro')
    return (
      <>
        {field('title', 'Item title')}
        {field('artist_or_label', 'Artist or label')}
        <label className="grid gap-2">
          Physical format
          <select
            className={fieldClass}
            value={String(data.group)}
            onChange={(event) => set('group', event.target.value)}
          >
            {DISTRO_GROUP_VALUES.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
        </label>
        {image('image', 'image_alt', 'Item image')}
        {field('summary', 'Short description', { multiline: true })}
        {rows('gallery', 'More images', { image: null, image_alt: '' }, (path) =>
          image(`${path}.image`, `${path}.image_alt`, 'Image'),
        )}
        {field('eyebrow', 'Small heading', { required: false })}
        {field('format', 'Format description', { required: false })}
        {field('release_date', 'Release date', { type: 'date', required: false })}
        {field('order', 'Display order', { type: 'number' })}
      </>
    );
  if (collection === 'home')
    return (
      <>
        {field('hero.tagline', 'Opening text', { multiline: true })}
        {image('hero.image', 'hero.image_alt', 'Home image')}
        {field('hero.scroll_indicator_text', 'Scroll hint')}
        {field('news.title', 'News heading')}
        {field('news.link_text', 'News link text')}
        {field('news.link_url', 'News link')}
        {field('artists.title', 'Artists heading')}
        {field('artists.button_text', 'Artists button text')}
        {field('artists.button_link', 'Artists button link')}
      </>
    );
  if (collection === 'about')
    return (
      <>
        {field('hero.section_label', 'Section label')}
        {field('hero.title', 'Page title')}
        {image('hero.image', 'hero.image_alt', 'About image')}
        {field('lead.text', 'Opening text', { multiline: true })}
        {field('story.title', 'Story heading')}
        {rows('story.paragraphs', 'Story', '', (path) => field(path, 'Paragraph', { multiline: true }))}
        {data.quote ? (
          <>
            {field('quote.text', 'Quote', { multiline: true })}
            {field('quote.cite', 'Quote author')}
            <Button type="button" variant="outline" onClick={() => set('quote', null)}>
              Remove quote
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => set('quote', { text: '', cite: '' })}>
            Add quote
          </Button>
        )}
        {field('contact.title', 'Contact heading')}
        {field('contact.intro', 'Contact introduction', { multiline: true })}
        {rows('contact.items', 'Contact details', { label: '', value: '' }, (path) => (
          <>
            {field(`${path}.label`, 'Label')}
            {field(`${path}.value`, 'Contact detail')}
          </>
        ))}
        {rows('stats.items', 'Label facts', { key: '', label: '' }, (path) => (
          <>
            {field(`${path}.key`, 'Fact')}
            {field(`${path}.label`, 'Description')}
          </>
        ))}
      </>
    );
  if (collection === 'services')
    return (
      <>
        {field('hero.title', 'Page title')}
        {field('hero.intro', 'Introduction', { multiline: true })}
        {field('hero.cta_text', 'Contact button text')}
        {rows(
          'services.items',
          'Services',
          { id: '', title: '', image: null, image_alt: '', summary: '', bullets: ['', ''], contact_note: '' },
          (path) => (
            <>
              {field(`${path}.id`, 'Link name (lowercase words separated by hyphens)')}
              {field(`${path}.title`, 'Service title')}
              {image(`${path}.image`, `${path}.image_alt`, 'Service image')}
              {field(`${path}.summary`, 'Summary', { multiline: true })}
              {rows(`${path}.bullets`, 'Service details', '', (item) => field(item, 'Detail'))}
              {field(`${path}.contact_note`, 'Contact note')}
              {field(`${path}.partner_name`, 'Partner name', { required: false })}
              {field(`${path}.partner_url`, 'Partner website', { type: 'url', required: false })}
            </>
          ),
        )}
        {field('process.title', 'Process heading')}
        {field('process.intro', 'Process introduction', { multiline: true })}
        {rows('process.steps', 'Process steps', { title: '', body: '' }, (path) => (
          <>
            {field(`${path}.title`, 'Step title')}
            {field(`${path}.body`, 'Step text', { multiline: true })}
          </>
        ))}
        {field('inquiry.title', 'Contact form heading')}
        {field('inquiry.intro', 'Contact form introduction', { multiline: true })}
        {field('inquiry.email', 'Contact email', { type: 'email' })}
        {field('inquiry.submit_text', 'Send button text')}
      </>
    );
  if (collection === 'navigation')
    return (
      <>
        {field('title', 'Link text')}
        {field('url', 'Page link')}
        {field('order', 'Display order', { type: 'number' })}
        {check('show_in_header', 'Show at the top of the site')}
        {check('show_in_footer', 'Show at the bottom of the site')}
      </>
    );
  if (collection === 'socials')
    return (
      <>
        {field('title', 'Link name')}
        {field('url', 'Profile link')}
        {field('order', 'Display order', { type: 'number' })}
      </>
    );
  if (collection === 'newsletter')
    return (
      <>
        {field('section_label', 'Section label')}
        {field('title', 'Heading')}
        {field('description', 'Description', { multiline: true })}
        {field('placeholder', 'Example email', { type: 'email' })}
        {field('button_label', 'Button text')}
        {field('note', 'Small print', { multiline: true })}
      </>
    );
  if (collection === 'settings')
    return (
      <>
        {field('label_name', 'Label name')}
        {field('established_year', 'Year established', { type: 'number' })}
        {field('url', 'Label website', { type: 'url' })}
        {field('logo', 'Logo path')}
        {field('location.locality', 'City')}
        {field('location.country', 'Country')}
      </>
    );
  if (collection === 'distro_page')
    return (
      <>
        {field('hero.title', 'Page title')}
        {field('hero.intro', 'Introduction', { multiline: true })}
        {Object.keys((data.group_intros as object) ?? {}).map((key) =>
          field(`group_intros.${key}`, key.replaceAll('_', ' '), { multiline: true }),
        )}
      </>
    );
  return (
    <>
      <label className="grid gap-2">
        Public wording approval
        <select
          className={fieldClass}
          value={String(data.publication)}
          onChange={(event) => set('publication', event.target.value)}
        >
          <option value="pending">Awaiting review</option>
          <option value="approved">Approved by the label</option>
        </select>
      </label>
      {field('content.revision', 'Date of wording', { type: 'date' })}
      {field('content.seller.name', 'Seller name')}
      {field('content.seller.address', 'Seller address', { multiline: true })}
      {field('content.seller.support_email', 'Support email', { type: 'email' })}
      {(['terms', 'privacy'] as const).map((group) => (
        <section className="grid gap-6" key={group}>
          <h2 className="text-2xl font-semibold">{group === 'terms' ? 'Purchase terms' : 'Privacy'}</h2>
          {(group === 'terms'
            ? ['dispatch', 'delivery', 'returns', 'damaged_items', 'uncollected_parcels']
            : ['purposes', 'recipients', 'retention', 'rights', 'contact']
          ).map((section) => (
            <div className="grid gap-4" key={section}>
              {field(`content.${group}.${section}.summary`, section.replaceAll('_', ' ') + ' summary', {
                multiline: true,
              })}
              {rows(`content.${group}.${section}.paragraphs`, 'Full wording', '', (path) =>
                field(path, 'Paragraph', { multiline: true }),
              )}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
