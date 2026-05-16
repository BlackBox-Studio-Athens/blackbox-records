import {
  buildField,
  buildFieldMapping,
  buildFileCollection,
  buildFolderCollection,
  buildSchemaField,
  escapeYamlScalar,
  indentYamlBlock,
  type DecapSelectOption,
} from './decap-yaml-builder';
import { buildHomeFields } from './decap-home-fields';

export type DecapArtistOption = DecapSelectOption;

export type BuildDecapConfigOptions = {
  artistOptions: DecapArtistOption[];
  authEndpoint: string;
  authTokenEndpoint: string;
  baseUrl: string;
  branch: string;
  gatewayUrl: string;
  useLocalBackend: boolean;
  localBackendPort: string;
  logoUrl: string;
  repository: string;
  siteRootUrl: string;
};

export function buildDecapConfig(options: BuildDecapConfigOptions): string {
  const backendConfig = options.useLocalBackend
    ? `backend:\n  name: proxy\n  proxy_url: ${escapeYamlScalar(`http://127.0.0.1:${options.localBackendPort}/api/v1`)}\n  branch: ${escapeYamlScalar(options.branch)}`
    : `backend:\n  name: git-gateway\n  repo: ${escapeYamlScalar(options.repository)}\n  branch: ${escapeYamlScalar(options.branch)}\n  auth_type: pkce\n  base_url: ${escapeYamlScalar(options.baseUrl)}\n  auth_endpoint: ${escapeYamlScalar(options.authEndpoint)}\n  auth_token_endpoint: ${escapeYamlScalar(options.authTokenEndpoint)}\n  gateway_url: ${escapeYamlScalar(options.gatewayUrl)}\n\n  commit_messages:\n    create: "Create {{collection}} \\"{{slug}}\\" via Decap CMS"\n    update: "Update {{collection}} \\"{{slug}}\\" via Decap CMS"\n    delete: "Delete {{collection}} \\"{{slug}}\\" via Decap CMS"\n    uploadMedia: "Upload \\"{{path}}\\" via Decap CMS"\n    deleteMedia: "Delete \\"{{path}}\\" via Decap CMS"\n    openAuthoring: "Open authoring for {{collection}} via Decap CMS"`;

  const authConfig = options.useLocalBackend
    ? ''
    : `\n\nauth:\n  email_claim: email\n  first_name_claim: first_name\n  last_name_claim: last_name\n  avatar_url_claim: avatar_url`;

  const homeFields = buildHomeFields();

  const aboutFields = [
    buildSchemaField('../../../.astro/collections/about.schema.json'),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Opening section for the full About page.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          hint: 'Small label above the hero title.',
        }),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Primary About page title.' }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Hero image for the About page. Use a clear focal point that survives a tall crop.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          hint: 'Describe the About hero image for screen readers.',
        }),
      ],
    }),
    buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder whole About page sections.',
      collapsed: true,
      types: [
        {
          label: 'Lead',
          name: 'lead',
          summary: '{{fields.text}}',
          fields: [
            buildField({
              label: 'Text',
              name: 'text',
              widget: 'text',
              hint: 'Opening paragraph immediately after the About hero.',
            }),
          ],
        },
        {
          label: 'Story',
          name: 'story',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Section heading.' }),
            buildField({
              label: 'Paragraphs',
              name: 'paragraphs',
              widget: 'list',
              collapsed: true,
              summary: '{{fields.value}}',
              field: buildFieldMapping({
                label: 'Paragraph',
                name: 'value',
                widget: 'text',
                hint: 'Section body copy. Keep each item to one paragraph.',
              }),
            }),
          ],
        },
        {
          label: 'Quote',
          name: 'quote',
          summary: '{{fields.cite}}',
          fields: [
            buildField({ label: 'Text', name: 'text', widget: 'text', hint: 'Quoted line or statement.' }),
            buildField({
              label: 'Cite',
              name: 'cite',
              widget: 'string',
              hint: 'Attribution line shown with the quote.',
            }),
          ],
        },
        {
          label: 'Contact',
          name: 'contact',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Contact panel heading.' }),
            buildField({
              label: 'Intro',
              name: 'intro',
              widget: 'text',
              hint: 'Short intro line before the contact rows.',
            }),
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Contact rows such as email, city, or booking.',
              collapsed: true,
              summary: '{{fields.label}}: {{fields.value}}',
              fields: [
                buildField({
                  label: 'Label',
                  name: 'label',
                  widget: 'string',
                  hint: 'Left-hand label. Example: "Email".',
                }),
                buildField({ label: 'Value', name: 'value', widget: 'string', hint: 'Displayed value or address.' }),
              ],
            }),
          ],
        },
        {
          label: 'Stats',
          name: 'stats',
          summary: 'Stats',
          fields: [
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Small label/value pairs shown near the About content.',
              collapsed: true,
              summary: '{{fields.label}}',
              fields: [
                buildField({
                  label: 'Key',
                  name: 'key',
                  widget: 'string',
                  hint: 'Short value or number. Example: "12" or "EST. 2026".',
                }),
                buildField({ label: 'Label', name: 'label', widget: 'string', hint: 'Descriptor shown with the key.' }),
              ],
            }),
          ],
        },
      ],
    }),
  ];

  const servicesFields = [
    buildSchemaField('../../../.astro/collections/services.schema.json'),
    buildField({
      label: 'Hero',
      name: 'hero',
      widget: 'object',
      hint: 'Opening copy block at the top of the Services page.',
      collapsed: true,
      summary: '{{fields.title}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Main Services page heading.' }),
        buildField({ label: 'Intro', name: 'intro', widget: 'text', hint: 'Short framing paragraph under the title.' }),
        buildField({
          label: 'CTA text',
          name: 'cta_text',
          widget: 'string',
          hint: 'Short inquiry button label. Keep it compact.',
        }),
      ],
    }),
    buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder whole Services page sections.',
      collapsed: true,
      types: [
        {
          label: 'Services list',
          name: 'services',
          summary: 'Services list',
          fields: [
            buildField({
              label: 'Items',
              name: 'items',
              widget: 'list',
              hint: 'Editorial service entries shown on the page and used by the inquiry flow.',
              collapsed: true,
              summary: '{{fields.title}}',
              fields: [
                buildField({
                  label: 'ID',
                  name: 'id',
                  widget: 'string',
                  hint: 'Stable ID used for inquiry preselection. Use lowercase kebab-case, for example "vinyl-printing".',
                }),
                buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Visible service heading.' }),
                buildField({
                  label: 'Image',
                  name: 'image',
                  widget: 'image',
                  hint: 'Representative image for the service section. Choose a crop that works in both stacked and side-by-side layouts.',
                }),
                buildField({
                  label: 'Image alt',
                  name: 'image_alt',
                  widget: 'string',
                  hint: 'Describe the service image for screen readers.',
                }),
                buildField({
                  label: 'Summary',
                  name: 'summary',
                  widget: 'text',
                  hint: 'Short editorial description shown near the service title.',
                }),
                buildField({
                  label: 'Bullets',
                  name: 'bullets',
                  widget: 'list',
                  hint: 'Capability bullets shown under the summary.',
                  collapsed: true,
                  summary: '{{fields.value}}',
                  field: buildFieldMapping({
                    label: 'Bullet',
                    name: 'value',
                    widget: 'string',
                    hint: 'One concise capability per item.',
                  }),
                }),
                buildField({
                  label: 'Contact note',
                  name: 'contact_note',
                  widget: 'text',
                  hint: 'Short line that nudges readers toward the inquiry form.',
                }),
                buildField({
                  label: 'Partner name',
                  name: 'partner_name',
                  widget: 'string',
                  required: false,
                  hint: 'Optional partner name displayed inline.',
                }),
                buildField({
                  label: 'Partner URL',
                  name: 'partner_url',
                  widget: 'string',
                  required: false,
                  hint: 'Optional partner URL. Include https://.',
                }),
              ],
            }),
          ],
        },
        {
          label: 'Process',
          name: 'process',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Process section heading.' }),
            buildField({
              label: 'Intro',
              name: 'intro',
              widget: 'text',
              hint: 'Short sentence introducing the process steps.',
            }),
            buildField({
              label: 'Steps',
              name: 'steps',
              widget: 'list',
              collapsed: true,
              summary: '{{fields.title}}',
              fields: [
                buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Step heading.' }),
                buildField({
                  label: 'Body',
                  name: 'body',
                  widget: 'text',
                  hint: 'Short explanatory sentence for the step.',
                }),
              ],
            }),
          ],
        },
        {
          label: 'Inquiry',
          name: 'inquiry',
          summary: '{{fields.title}}',
          fields: [
            buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Inquiry section heading.' }),
            buildField({ label: 'Intro', name: 'intro', widget: 'text', hint: 'Short intro line above the form.' }),
            buildField({
              label: 'Email',
              name: 'email',
              widget: 'string',
              hint: 'Mailbox that receives inquiries. Example: hello@blackboxrecords.com.',
            }),
            buildField({
              label: 'Submit text',
              name: 'submit_text',
              widget: 'string',
              hint: 'Button label used when composing the email draft.',
            }),
          ],
        },
      ],
    }),
  ];

  const settingsFields = [
    buildSchemaField('../../../.astro/collections/settings.schema.json'),
    buildField({
      label: 'Label name',
      name: 'label_name',
      widget: 'string',
      hint: 'Official public name used in metadata and footer copy.',
    }),
    buildField({
      label: 'Established year',
      name: 'established_year',
      widget: 'number',
      hint: 'Four-digit year used in footer and metadata.',
      extras: ['value_type: int', 'min: 1900'],
    }),
    buildField({
      label: 'URL',
      name: 'url',
      widget: 'string',
      hint: 'Canonical site URL including https://. Example: https://blackbox-studio-athens.github.io/blackbox-records/.',
    }),
    buildField({
      label: 'Logo path',
      name: 'logo',
      widget: 'string',
      hint: 'Public asset path used in metadata and admin chrome. Example: /assets/images/brand/logo.png.',
    }),
    buildField({
      label: 'Location',
      name: 'location',
      widget: 'object',
      hint: 'Location data used in structured metadata.',
      collapsed: true,
      summary: '{{fields.locality}}, {{fields.country}}',
      fields: [
        buildField({ label: 'Locality', name: 'locality', widget: 'string', hint: 'City or locality name.' }),
        buildField({ label: 'Country', name: 'country', widget: 'string', hint: 'Country name.' }),
      ],
    }),
  ];

  const collections = [
    buildFileCollection({
      name: 'home',
      label: 'Home',
      create: false,
      delete: false,
      files: [
        {
          name: 'home-site',
          label: 'Home Content',
          file: 'src/content/home/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: homeFields,
        },
      ],
    }),
    buildFileCollection({
      name: 'about',
      label: 'About',
      create: false,
      delete: false,
      files: [
        {
          name: 'about-site',
          label: 'About Content',
          file: 'src/content/about/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: aboutFields,
        },
      ],
    }),
    buildFileCollection({
      name: 'services',
      label: 'Services',
      create: false,
      delete: false,
      files: [
        {
          name: 'services-site',
          label: 'Services Content',
          file: 'src/content/services/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: servicesFields,
        },
      ],
    }),
    buildFileCollection({
      name: 'settings',
      label: 'Settings',
      create: false,
      delete: false,
      files: [
        {
          name: 'settings-site',
          label: 'Site Settings',
          file: 'src/content/settings/site.json',
          fields: settingsFields,
        },
      ],
    }),
    buildFolderCollection({
      name: 'navigation',
      label: 'Navigation',
      folder: 'src/content/navigation',
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      summary: '{{title}} -> {{url}}',
      fields: [
        buildSchemaField('../../../.astro/collections/navigation.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Visible navigation label.' }),
        buildField({
          label: 'URL',
          name: 'url',
          widget: 'string',
          hint: 'Internal routes should start with /. External links should include https://.',
        }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          extras: ['value_type: int', 'min: 0'],
        }),
        buildField({
          label: 'Show in header',
          name: 'show_in_header',
          widget: 'boolean',
          required: false,
          hint: 'Enable this item in the desktop and mobile header navigation.',
          extras: ['default: true'],
        }),
        buildField({
          label: 'Show in footer',
          name: 'show_in_footer',
          widget: 'boolean',
          required: false,
          hint: 'Enable this item in the footer sitemap.',
          extras: ['default: true'],
        }),
      ],
    }),
    buildFolderCollection({
      name: 'socials',
      label: 'Socials',
      folder: 'src/content/socials',
      create: true,
      delete: true,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      summary: '{{title}}',
      fields: [
        buildSchemaField('../../../.astro/collections/socials.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Platform or network name.' }),
        buildField({ label: 'URL', name: 'url', widget: 'string', hint: 'Full profile URL including https://.' }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first.',
          extras: ['value_type: int', 'min: 0'],
        }),
      ],
    }),
    buildFolderCollection({
      name: 'artists',
      label: 'Artists',
      folder: 'src/content/artists',
      create: true,
      delete: true,
      extension: 'md',
      format: 'frontmatter',
      identifierField: 'title',
      slug: '{{fields.slug}}',
      mediaFolder: '.',
      publicFolder: './',
      summary: '{{title}} - {{slug}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Artist or band name.' }),
        buildField({
          label: 'Slug',
          name: 'slug',
          widget: 'string',
          hint: 'Used for the artist page filename. Use lowercase kebab-case, for example "mass-culture".',
        }),
        buildField({
          label: 'Genre',
          name: 'genre',
          widget: 'string',
          hint: 'Short genre line shown in cards and detail views.',
        }),
        buildField({
          label: 'Country',
          name: 'country',
          widget: 'string',
          required: false,
          hint: 'Optional country or origin.',
        }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Portrait-oriented artist image. Keep the subject centered for the 3:4 crop.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          required: false,
          hint: 'Describe the band or artist image for screen readers.',
        }),
        buildField({
          label: 'Bio',
          name: 'bio',
          widget: 'text',
          hint: 'Short artist bio used in cards, metadata, and fallback detail copy.',
        }),
        buildField({
          label: 'Profile links',
          name: 'profile_links',
          widget: 'list',
          required: false,
          collapsed: true,
          summary: '{{fields.label}}',
          hint: 'Optional quiet profile links shown near the artist story.',
          fields: [
            buildFieldMapping({ label: 'Label', name: 'label', widget: 'string', hint: 'Example: "Bandcamp".' }),
            buildFieldMapping({
              label: 'URL',
              name: 'url',
              widget: 'string',
              hint: 'Full public profile URL including https://.',
            }),
          ],
        }),
        buildField({
          label: 'Videos',
          name: 'videos',
          widget: 'list',
          required: false,
          collapsed: true,
          summary: '{{fields.title}}',
          hint: 'Optional YouTube videos for the artist page. Use the 11-character YouTube video ID, not iframe HTML.',
          fields: [
            buildFieldMapping({
              label: 'Title',
              name: 'title',
              widget: 'string',
              hint: 'Video title shown in the UI.',
            }),
            buildFieldMapping({
              label: 'YouTube video ID',
              name: 'youtube_video_id',
              widget: 'string',
              hint: 'The 11-character ID from a YouTube URL, for example dQw4w9WgXcQ.',
            }),
            buildFieldMapping({
              label: 'Description',
              name: 'description',
              widget: 'text',
              required: false,
              hint: 'Optional short context for the video.',
            }),
          ],
        }),
        buildField({
          label: 'Upcoming release',
          name: 'upcoming_release',
          widget: 'string',
          required: false,
          hint: 'Optional note shown when an artist has a release on the way.',
        }),
        buildField({
          label: 'Shop collection handle',
          name: 'shop_collection_handle',
          widget: 'string',
          required: false,
          hint: 'Optional Fourthwall collection handle, without a full URL.',
        }),
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          required: false,
          hint: 'Optional small label used in selected UI contexts.',
        }),
        buildField({
          label: 'Body',
          name: 'body',
          widget: 'markdown',
          required: false,
          hint: 'Rich artist profile body in Markdown. Keep frontmatter Bio short.',
        }),
      ],
    }),
    buildFolderCollection({
      name: 'releases',
      label: 'Releases',
      folder: 'src/content/releases',
      create: true,
      delete: true,
      extension: 'md',
      format: 'frontmatter',
      identifierField: 'title',
      mediaFolder: '.',
      publicFolder: './',
      summary: '{{title}} - {{artist}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Release title.' }),
        buildField({
          label: 'Artist',
          name: 'artist',
          widget: 'select',
          hint: 'Pick the matching artist entry so Astro references stay valid.',
          options: options.artistOptions,
        }),
        buildField({
          label: 'Release date',
          name: 'release_date',
          widget: 'datetime',
          hint: 'Release day only. Time is ignored. Example: 2026-09-18.',
          extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
        }),
        buildField({
          label: 'Cover image',
          name: 'cover_image',
          widget: 'image',
          hint: 'Primary release artwork used in cards and the release detail view.',
        }),
        buildField({
          label: 'Cover image alt',
          name: 'cover_image_alt',
          widget: 'string',
          required: false,
          hint: 'Describe the artwork for screen readers.',
        }),
        buildField({
          label: 'Merch URL',
          name: 'merch_url',
          widget: 'string',
          required: false,
          hint: 'Optional direct merch or product URL. Include https://.',
        }),
        buildField({
          label: 'Shop collection handle',
          name: 'shop_collection_handle',
          widget: 'string',
          required: false,
          hint: 'Optional Fourthwall collection handle, without a full URL.',
        }),
        buildField({
          label: 'Bandcamp embed URL',
          name: 'bandcamp_embed_url',
          widget: 'string',
          required: false,
          hint: 'Paste the iframe src from Bandcamp Share/Embed, not the public album or track page URL.',
        }),
        buildField({
          label: 'Tidal URL',
          name: 'tidal_url',
          widget: 'string',
          required: false,
          hint: 'Full Tidal album, track, playlist, or video URL including https://. Artist profile URLs are not embedded players.',
        }),
        buildField({
          label: 'Summary',
          name: 'summary',
          widget: 'text',
          required: false,
          hint: 'Short release summary shown in cards and detail headers.',
        }),
        buildField({
          label: 'Formats',
          name: 'formats',
          widget: 'list',
          required: false,
          hint: 'Physical or digital formats shown in the release detail UI.',
          collapsed: true,
          summary: '{{fields.value}}',
          field: buildFieldMapping({
            label: 'Format',
            name: 'value',
            widget: 'string',
            hint: 'Example: "LP", "CD", or "Digital".',
          }),
        }),
        buildField({
          label: 'Credits',
          name: 'credits',
          widget: 'list',
          required: false,
          hint: 'Role/name credit pairs shown in the release detail.',
          collapsed: true,
          summary: '{{fields.role}}',
          fields: [
            buildField({ label: 'Role', name: 'role', widget: 'string', hint: 'Example: "Mastering" or "Artwork".' }),
            buildField({ label: 'Name', name: 'name', widget: 'string', hint: 'Person or studio name.' }),
          ],
        }),
      ],
    }),
    buildFolderCollection({
      name: 'distro',
      label: 'Distro',
      folder: 'src/content/distro',
      create: true,
      delete: true,
      extension: 'json',
      format: 'json',
      identifierField: 'title',
      mediaFolder: '.',
      publicFolder: './',
      summary: '{{title}} - {{group}}',
      fields: [
        buildSchemaField('../../../.astro/collections/distro.schema.json'),
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Item name shown in distro cards.' }),
        buildField({
          label: 'Group',
          name: 'group',
          widget: 'select',
          hint: 'Choose the shelf this item appears under.',
          options: [
            { label: 'Vinyl 12-inch', value: 'Vinyl 12-inch' },
            { label: 'Vinyl 7-inch', value: 'Vinyl 7-inch' },
            { label: 'CDs', value: 'CDs' },
            { label: 'Clothes', value: 'Clothes' },
            { label: 'Tapes', value: 'Tapes' },
            { label: 'Other', value: 'Other' },
          ],
        }),
        buildField({
          label: 'Artist or label',
          name: 'artist_or_label',
          widget: 'string',
          hint: 'Supporting line shown below the item title.',
        }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Product image used in distro cards. Choose a clean, readable crop.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          hint: 'Describe the product image for screen readers.',
        }),
        buildField({
          label: 'Summary',
          name: 'summary',
          widget: 'text',
          hint: 'Short curator-style note for the distro item.',
        }),
        buildField({
          label: 'Fourthwall URL',
          name: 'fourthwall_url',
          widget: 'string',
          hint: 'Direct product URL on Fourthwall. Include https://.',
        }),
        buildField({
          label: 'Eyebrow',
          name: 'eyebrow',
          widget: 'string',
          required: false,
          hint: 'Optional small label above the summary.',
        }),
        buildField({
          label: 'Format',
          name: 'format',
          widget: 'string',
          required: false,
          hint: 'Optional short format note, such as "LP" or "Black tee".',
        }),
        buildField({
          label: 'Release date',
          name: 'release_date',
          widget: 'datetime',
          required: false,
          hint: 'Optional known release date. Leave empty when unknown; do not infer from description text.',
          extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
        }),
        buildField({
          label: 'Order',
          name: 'order',
          widget: 'number',
          hint: 'Lower numbers appear first within the group.',
          extras: ['value_type: int', 'min: 0'],
        }),
      ],
    }),
    buildFolderCollection({
      name: 'news',
      label: 'News',
      folder: 'src/content/news',
      create: true,
      delete: true,
      extension: 'md',
      format: 'frontmatter',
      identifierField: 'title',
      mediaFolder: '.',
      publicFolder: './',
      summary: '{{title}} - {{date}}',
      fields: [
        buildField({ label: 'Title', name: 'title', widget: 'string', hint: 'Article title.' }),
        buildField({
          label: 'Date',
          name: 'date',
          widget: 'datetime',
          hint: 'Publish date for the card and article header. Example: 2026-05-12.',
          extras: ['date_format: YYYY-MM-DD', 'time_format: false'],
        }),
        buildField({ label: 'Summary', name: 'summary', widget: 'text', hint: 'Short teaser used in listing cards.' }),
        buildField({
          label: 'Image',
          name: 'image',
          widget: 'image',
          hint: 'Lead image for the news card and article header.',
        }),
        buildField({
          label: 'Image alt',
          name: 'image_alt',
          widget: 'string',
          required: false,
          hint: 'Describe the news image for screen readers.',
        }),
        buildField({
          label: 'Section label',
          name: 'section_label',
          widget: 'string',
          required: false,
          hint: 'Optional small label shown above the article title.',
        }),
        buildField({ label: 'Body', name: 'body', widget: 'markdown', hint: 'Main article body in Markdown.' }),
      ],
    }),
  ];

  return `${backendConfig}\n\npublish_mode: simple\nmedia_folder: src/content/uploads\n${authConfig}\n\nsite_url: ${escapeYamlScalar(options.siteRootUrl)}\ndisplay_url: ${escapeYamlScalar(options.siteRootUrl)}\nlogo_url: ${escapeYamlScalar(options.logoUrl)}\neditor:\n  preview: true\n\ncollections:\n${indentYamlBlock(collections.join('\n\n'), 2)}\n`;
}
