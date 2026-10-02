import { tracklistSchema } from './tracklist';
import { artistCountriesSchema, parseArtistCountries, validArtistLink } from './artist-fields';
import { z } from 'zod';
import { proseSchema, requiredProseSchema, richTextSchema } from './prose';
import { buildBandcampEmbedUrl, buildTidalEmbedUrl } from './music';
import {
  ABOUT_STAT_KEYS,
  DISTRO_INTRO_FIELDS,
  isHttpsUrl,
  isInternalOrHttpsUrl,
  isPublicImagePath,
  isSocialProfileUrl,
  SITE_PAGE_PATHS,
  SOCIAL_PLATFORMS,
  youtubeVideoIdPatternSource,
  slugPatternSource,
} from './validation';

const requiredAltText = z.string().trim().min(1, 'Describe the visible image for people who cannot see it.');
const requiredText = z.string().trim().min(1, 'Enter a value.');
const httpsUrl = z.string().refine(isHttpsUrl, { message: 'Use a full HTTPS URL.' });
const sitePagePath = z.enum(SITE_PAGE_PATHS, { error: 'Choose a page from the list.' });
const internalOrHttpsUrl = z.string().refine(isInternalOrHttpsUrl, {
  message: 'Use a safe internal path beginning with / or a full HTTPS URL.',
});

export const bandcampEmbedUrlSchema = z.string().refine((value) => buildBandcampEmbedUrl(value) === value, {
  message: 'Use the official Bandcamp iframe src from Share/Embed. Public album or track URLs are not valid embeds.',
});

export const tidalUrlSchema = z.string().refine((value) => buildTidalEmbedUrl(value) !== '', {
  message: 'Use a Tidal album, track, playlist, or video URL. Artist profile URLs are not embedded players.',
});

export function createArtistsContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    title: requiredText,
    slug: z.string().regex(new RegExp(slugPatternSource), 'Use lowercase kebab-case.'),
    is_active: z.boolean().default(true),
    genre: requiredText,
    country: artistCountriesSchema.optional(),
    image: image(),
    image_alt: requiredAltText,
    bio: requiredText,
    bio_rich: richTextSchema.nullish(),
    profile_links: z
      .array(
        z
          .object({
            label: requiredText,
            url: httpsUrl,
          })
          .refine((link) => validArtistLink(link.label, link.url), {
            path: ['url'],
            message: 'Use the matching service URL. Spotify links are not supported.',
          }),
      )
      .optional(),
    videos: z
      .array(
        z.object({
          title: requiredText,
          youtube_video_id: z.string().regex(new RegExp(youtubeVideoIdPatternSource)),
          description: proseSchema.optional(),
        }),
      )
      .optional(),
    upcoming_release: z.string().optional(),
  });
}

export function createReleasesContentSchema<TImage extends z.ZodType, TReference extends z.ZodType>(
  image: () => TImage,
  references: { artist: TReference },
) {
  return z.object({
    title: requiredText,
    artist: references.artist,
    release_stage: z.enum(['upcoming', 'released']).optional(),
    release_date: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.date().optional(),
    ),
    cover_image: image(),
    cover_image_alt: requiredAltText,
    gallery: z
      .array(
        z.object({
          image: image(),
          image_alt: requiredAltText,
        }),
      )
      .optional(),
    merch_url: internalOrHttpsUrl.optional(),
    bandcamp_embed_url: bandcampEmbedUrlSchema.optional(),
    tidal_url: tidalUrlSchema.optional(),
    summary: z.string().optional(),
    summary_rich: richTextSchema.nullish(),
    singles: z.array(z.object({ title: requiredText, url: httpsUrl })).optional(),
    partner_links: z.array(z.object({ label: requiredText, url: httpsUrl })).optional(),
    clips: z
      .array(
        z.object({ title: requiredText, youtube_video_id: z.string().regex(new RegExp(youtubeVideoIdPatternSource)) }),
      )
      .optional(),
    tracklist: tracklistSchema.nullish(),
    formats: z.array(requiredText).optional(),
    credits: z
      .array(
        z.object({
          role: requiredText,
          name: requiredText,
        }),
      )
      .optional(),
  });
}

export function createNewsContentSchema<TImage extends z.ZodType, TReference extends z.ZodType>(
  image: () => TImage,
  references: { artist: TReference },
) {
  return z.object({
    title: requiredText,
    artist: references.artist.or(z.literal('')).optional(),
    date: z.coerce.date(),
    summary: requiredText,
    summary_rich: richTextSchema.nullish(),
    image: image(),
    image_alt: requiredAltText,
    section_label: z.string().optional(),
  });
}

export const distroPageContentSchema = z.object({
  hero: z.object({
    title: requiredText,
    intro: requiredProseSchema,
  }),
  group_intros: z.record(z.enum(DISTRO_INTRO_FIELDS.map(({ name }) => name)), requiredProseSchema),
});

// Home is structural in the main menu: always first in the phone Menu and linked by the logo.
export const navigationContentSchema = z
  .object({
    title: requiredText,
    url: sitePagePath,
    order: z.number().int().nonnegative(),
    show_in_header: z.boolean(),
    show_in_footer: z.boolean(),
  })
  .refine((item) => item.url !== '/' || !item.show_in_header, {
    path: ['show_in_header'],
    message: 'Home is always in the main menu, so it cannot be added again.',
  });

export const socialsContentSchema = z.object({
  title: z.enum(SOCIAL_PLATFORMS, { error: 'Choose a platform from the list.' }),
  url: z.string().refine(isSocialProfileUrl, { message: 'Use a full HTTPS profile URL or # to hide the link.' }),
  order: z.number().int().nonnegative(),
});

export const settingsContentSchema = z.object({
  label_name: requiredText,
  established_year: z.number().int().min(1900).max(2100),
  url: httpsUrl,
  logo: z.string().refine(isPublicImagePath, { message: 'Use an image path below /assets/.' }),
  location: z.object({
    locality: requiredText,
    country: z.string().refine((value) => parseArtistCountries(value)?.length === 1, {
      message: 'Choose one country from the list.',
    }),
  }),
});

export const newsletterContentSchema = z.object({
  section_label: requiredText,
  title: requiredText,
  description: requiredText,
  description_rich: richTextSchema.nullish(),
  placeholder: z.email(),
  button_label: requiredText,
  note: requiredText,
  note_rich: richTextSchema.nullish(),
});

export function createHomeContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      tagline: requiredProseSchema,
      image: image(),
      image_alt: requiredAltText,
      scroll_indicator_text: requiredText,
    }),
    news: z.object({
      title: requiredText,
      link_text: requiredText,
      link_url: sitePagePath,
    }),
    artists: z.object({
      title: requiredText,
      button_text: requiredText,
      button_link: sitePagePath,
    }),
  });
}

export function createAboutContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      section_label: requiredText,
      title: requiredText,
      image: image(),
      image_alt: requiredAltText,
    }),
    lead: z.object({ text: requiredProseSchema }),
    story: z.object({
      title: requiredText,
      paragraphs: z.array(requiredProseSchema),
    }),
    quote: z
      .object({
        text: requiredProseSchema,
        cite: requiredText,
      })
      .optional(),
    contact: z.object({
      title: requiredText,
      intro: requiredProseSchema,
      items: z.array(
        z.object({
          label: requiredText,
          value: z.email('Enter an email address.'),
        }),
      ),
    }),
    stats: z.object({
      items: z.array(
        z.object({
          key: z.enum(ABOUT_STAT_KEYS, { error: 'Choose a fact from the list.' }),
          label: requiredText,
        }),
      ),
    }),
  });
}

export function createServicesContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      title: requiredText,
      intro: requiredProseSchema,
      cta_text: requiredText,
    }),
    services: z.object({
      items: z
        .array(
          z.object({
            id: z.string().regex(new RegExp(slugPatternSource), 'Use lowercase kebab-case.'),
            title: requiredText,
            image: image(),
            image_alt: requiredAltText,
            summary: requiredProseSchema,
            bullets: z.array(requiredProseSchema).min(2).max(12),
            contact_note: requiredProseSchema,
            partner_name: z.string().optional(),
            partner_url: httpsUrl.optional(),
          }),
        )
        .superRefine((items, context) => {
          // Service ids are page anchors, so each must be unique.
          items.forEach(({ id }, index) => {
            if (items.findIndex((item) => item.id === id) !== index)
              context.addIssue({
                code: 'custom',
                path: [index, 'id'],
                message: 'Use a link name no other service uses.',
              });
          });
        }),
    }),
    process: z.object({
      title: requiredText,
      intro: requiredProseSchema,
      steps: z
        .array(
          z.object({
            title: requiredText,
            body: requiredProseSchema,
          }),
        )
        .min(3)
        .max(12),
    }),
    inquiry: z.object({
      title: requiredText,
      intro: requiredProseSchema,
      email: z.email(),
      submit_text: requiredText,
    }),
  });
}
