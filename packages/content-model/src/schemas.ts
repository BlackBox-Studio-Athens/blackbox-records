import { z } from 'zod';
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
    title: z.string(),
    slug: z.string().regex(new RegExp(slugPatternSource), 'Use lowercase kebab-case.'),
    genre: z.string(),
    country: z.string().optional(),
    image: image(),
    image_alt: requiredAltText,
    bio: z.string(),
    profile_links: z
      .array(
        z.object({
          label: z.string(),
          url: httpsUrl,
        }),
      )
      .optional(),
    videos: z
      .array(
        z.object({
          title: z.string(),
          youtube_video_id: z.string().regex(new RegExp(youtubeVideoIdPatternSource)),
          description: z.string().optional(),
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
    title: z.string(),
    artist: references.artist,
    release_date: z.coerce.date(),
    cover_image: image(),
    cover_image_alt: requiredAltText,
    merch_url: internalOrHttpsUrl.optional(),
    bandcamp_embed_url: bandcampEmbedUrl.optional(),
    tidal_url: tidalUrl.optional(),
    summary: z.string().optional(),
    formats: z.array(z.string()).optional(),
    credits: z
      .array(
        z.object({
          role: z.string(),
          name: z.string(),
        }),
      )
      .optional(),
  });
}

export function createNewsContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: image(),
    image_alt: requiredAltText,
    section_label: z.string().optional(),
  });
}

export const distroPageContentSchema = z.object({
  hero: z.object({
    title: z.string(),
    intro: z.string(),
  }),
  group_intros: z.record(z.enum(DISTRO_INTRO_FIELDS.map(({ name }) => name)), z.string()),
});

export const navigationContentSchema = z.object({
  title: z.string(),
  url: internalSitePath,
  order: z.number().int().nonnegative(),
  show_in_header: z.boolean(),
  show_in_footer: z.boolean(),
});

export const socialsContentSchema = z.object({
  title: z.string(),
  url: z.string().refine(isSocialProfileUrl, { message: 'Use a full HTTPS profile URL or # to hide the link.' }),
  order: z.number().int().nonnegative(),
});

export const settingsContentSchema = z.object({
  label_name: z.string(),
  established_year: z.number().int().min(1900).max(2100),
  url: httpsUrl,
  logo: z.string().refine(isPublicImagePath, { message: 'Use an image path below /assets/.' }),
  location: z.object({
    locality: z.string(),
    country: z.string(),
  }),
});

export const newsletterContentSchema = z.object({
  section_label: z.string(),
  title: z.string(),
  description: z.string(),
  placeholder: z.email(),
  button_label: z.string(),
  note: z.string(),
});

export function createHomeContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      tagline: z.string(),
      image: image(),
      image_alt: requiredAltText,
      scroll_indicator_text: z.string(),
    }),
    news: z.object({
      title: z.string(),
      link_text: z.string(),
      link_url: internalSitePath,
    }),
    artists: z.object({
      title: z.string(),
      button_text: z.string(),
      button_link: internalSitePath,
    }),
  });
}

export function createAboutContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      section_label: z.string(),
      title: z.string(),
      image: image(),
      image_alt: requiredAltText,
    }),
    lead: z.object({ text: z.string() }),
    story: z.object({
      title: z.string(),
      paragraphs: z.array(z.string()),
    }),
    quote: z
      .object({
        text: z.string(),
        cite: z.string(),
      })
      .optional(),
    contact: z.object({
      title: z.string(),
      intro: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      ),
    }),
    stats: z.object({
      items: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
        }),
      ),
    }),
  });
}

export function createServicesContentSchema<TImage extends z.ZodType>(image: () => TImage) {
  return z.object({
    hero: z.object({
      title: z.string(),
      intro: z.string(),
      cta_text: z.string(),
    }),
    services: z.object({
      items: z.array(
        z.object({
          id: z.string().regex(new RegExp(slugPatternSource), 'Use lowercase kebab-case.'),
          title: z.string(),
          image: image(),
          image_alt: requiredAltText,
          summary: z.string(),
          bullets: z.array(z.string()).min(2).max(12),
          contact_note: z.string(),
          partner_name: z.string().optional(),
          partner_url: httpsUrl.optional(),
        }),
      ),
    }),
    process: z.object({
      title: z.string(),
      intro: z.string(),
      steps: z
        .array(
          z.object({
            title: z.string(),
            body: z.string(),
          }),
        )
        .min(3)
        .max(12),
    }),
    inquiry: z.object({
      title: z.string(),
      intro: z.string(),
      email: z.email(),
      submit_text: z.string(),
    }),
  });
}
