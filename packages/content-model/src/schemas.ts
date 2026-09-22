import { tracklistSchema } from './tracklist';
import { z } from 'zod';
import { proseSchema, requiredProseSchema, richTextSchema } from './prose';
import { buildBandcampEmbedUrl, buildTidalEmbedUrl } from './music';
import {
  DISTRO_INTRO_FIELDS,
  isHttpsUrl,
  isInternalOrHttpsUrl,
  isInternalSitePath,
  isPublicImagePath,
  isSocialProfileUrl,
  youtubeVideoIdPatternSource,
  slugPatternSource,
} from './validation';

const requiredAltText = z.string().trim().min(1, 'Describe the visible image for people who cannot see it.');
const requiredText = z.string().trim().min(1, 'Enter a value.');
const httpsUrl = z.string().refine(isHttpsUrl, { message: 'Use a full HTTPS URL.' });
const internalSitePath = z
  .string()
  .refine(isInternalSitePath, { message: 'Use a safe internal path beginning with /.' });
const internalOrHttpsUrl = z.string().refine(isInternalOrHttpsUrl, {
  message: 'Use a safe internal path beginning with / or a full HTTPS URL.',
});

const bandcampEmbedUrl = z.string().refine((value) => buildBandcampEmbedUrl(value) === value, {
  message: 'Use the official Bandcamp iframe src from Share/Embed. Public album or track URLs are not valid embeds.',
});

const tidalUrl = z.string().refine((value) => buildTidalEmbedUrl(value) !== '', {
  message: 'Use a Tidal album, track, playlist, or video URL. Artist profile URLs are not embedded players.',
});

export function createArtistsContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    title: requiredText,
    slug: z.string().regex(new RegExp(slugPatternSource), 'Use lowercase kebab-case.'),
    genre: requiredText,
    country: z.string().optional(),
    image: image(),
    image_alt: requiredAltText,
    bio: requiredText,
    bio_rich: richTextSchema.nullish(),
    profile_links: z
      .array(
        z.object({
          label: requiredText,
          url: httpsUrl,
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
    release_date: z.coerce.date(),
    cover_image: image(),
    cover_image_alt: requiredAltText,
    merch_url: internalOrHttpsUrl.optional(),
    bandcamp_embed_url: bandcampEmbedUrl.optional(),
    tidal_url: tidalUrl.optional(),
    summary: z.string().optional(),
    summary_rich: richTextSchema.nullish(),
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

export function createNewsContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    title: requiredText,
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

export const navigationContentSchema = z.object({
  title: requiredText,
  url: internalSitePath,
  order: z.number().int().nonnegative(),
  show_in_header: z.boolean(),
  show_in_footer: z.boolean(),
});

export const socialsContentSchema = z.object({
  title: requiredText,
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
    country: requiredText,
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
      link_url: internalSitePath,
    }),
    artists: z.object({
      title: requiredText,
      button_text: requiredText,
      button_link: internalSitePath,
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
          value: requiredText,
        }),
      ),
    }),
    stats: z.object({
      items: z.array(
        z.object({
          key: requiredText,
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
      items: z.array(
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
      ),
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
