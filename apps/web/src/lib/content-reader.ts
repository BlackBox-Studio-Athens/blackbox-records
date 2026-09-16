// Public builds use Astro collections; the CMS build supplies a request-scoped preview reader.
export { getCollection, getEntry } from 'astro:content';
