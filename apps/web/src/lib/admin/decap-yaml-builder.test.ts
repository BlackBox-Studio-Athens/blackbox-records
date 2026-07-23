import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import {
  buildField,
  buildFieldMapping,
  buildFileCollection,
  buildFolderCollection,
  buildSchemaField,
  indentYamlBlock,
} from './decap-yaml-builder';

describe('Decap YAML builder', () => {
  it('builds scalar field mappings with escaped values and extras', () => {
    expect(
      buildFieldMapping({
        label: 'Release "title"',
        name: 'title',
        widget: 'string',
        hint: 'Shown in cards.',
        required: false,
        extras: ['default: "Untitled"'],
      }),
    ).toBe(
      [
        'label: "Release \\"title\\""',
        'name: "title"',
        'widget: string',
        'required: false',
        'hint: "Shown in cards."',
        'default: "Untitled"',
      ].join('\n'),
    );
  });

  it('builds nested block fields with selectable options and list types', () => {
    const yaml = buildField({
      label: 'Sections',
      name: 'sections',
      widget: 'list',
      hint: 'Add, remove, or reorder.',
      collapsed: true,
      typeKey: 'kind',
      types: [
        {
          label: 'Quote',
          name: 'quote',
          summary: '{{fields.text}}',
          fields: [buildField({ label: 'Text', name: 'text', widget: 'text' })],
        },
      ],
      options: [{ label: 'Mass Culture', value: 'mass-culture' }],
    });

    expect(yaml).toContain('  options:\n    - { label: "Mass Culture", value: "mass-culture" }');
    expect(yaml).toContain('  typeKey: "kind"');
    expect(yaml).toContain('      widget: object');
    expect(yaml).toContain('      summary: "{{fields.text}}"');
    expect(yaml).toContain('          widget: text');
  });

  it('serializes native list, validation, and relation options as parsed YAML values', () => {
    const [field] = parse(
      buildField({
        label: 'Related entries: "Artists"',
        name: 'artists',
        widget: 'list',
        hint: 'Choose one or more artists.',
        required: false,
        collapsed: false,
        labelSingular: 'Artist',
        allowAdd: true,
        allowRemove: false,
        allowReorder: false,
        min: 1,
        max: 4,
        pattern: { value: '^[a-z0-9]+(?:-[a-z0-9]+)*$', message: 'Use lowercase kebab-case.' },
        field: buildFieldMapping({
          label: 'Artist',
          name: 'artist',
          widget: 'relation',
          relation: {
            collection: 'artists',
            searchFields: ['title', 'slug'],
            valueField: '{{slug}}',
            displayFields: ['title', 'slug'],
            optionsLength: 25,
          },
        }),
      }),
    ) as Record<string, unknown>[];

    expect(field).toMatchObject({
      label: 'Related entries: "Artists"',
      required: false,
      collapsed: false,
      label_singular: 'Artist',
      allow_add: true,
      allow_remove: false,
      allow_reorder: false,
      min: 1,
      max: 4,
      pattern: ['^[a-z0-9]+(?:-[a-z0-9]+)*$', 'Use lowercase kebab-case.'],
      field: {
        collection: 'artists',
        search_fields: ['title', 'slug'],
        value_field: '{{slug}}',
        display_fields: ['title', 'slug'],
        options_length: 25,
      },
    });
  });

  it('keeps bare child field mappings as YAML list items', () => {
    expect(
      buildField({
        label: 'Profile links',
        name: 'profile_links',
        widget: 'list',
        fields: [
          buildFieldMapping({ label: 'Label', name: 'label', widget: 'string' }),
          buildFieldMapping({ label: 'URL', name: 'url', widget: 'string' }),
        ],
      }),
    ).toContain(
      [
        '  fields:',
        '    - label: "Label"',
        '      name: "label"',
        '      widget: string',
        '    - label: "URL"',
        '      name: "url"',
        '      widget: string',
      ].join('\n'),
    );
  });

  it('builds schema fields and Decap collection wrappers', () => {
    const titleField = buildField({ label: 'Title', name: 'title', widget: 'string' });

    expect(buildSchemaField('../../../.astro/collections/home.schema.json')).toBe(
      [
        '- label: "Schema"',
        '  name: "$schema"',
        '  widget: hidden',
        '  default: "../../../.astro/collections/home.schema.json"',
      ].join('\n'),
    );

    const fileCollectionYaml = buildFileCollection({
      name: 'pages',
      label: 'Pages',
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'home',
          label: 'Home',
          file: 'src/content/home/site.json',
          mediaFolder: 'src/assets/home',
          publicFolder: '/assets/home',
          fields: [titleField],
        },
      ],
    });

    expect(fileCollectionYaml).toContain('  extension: json\n  format: json\n  files:\n    - name: "home"');
    expect(fileCollectionYaml).toContain('      media_folder: "src/assets/home"\n      public_folder: "/assets/home"');

    expect(
      buildFolderCollection({
        name: 'releases',
        label: 'Releases',
        folder: 'src/content/releases',
        create: true,
        delete: true,
        extension: 'md',
        format: 'frontmatter',
        identifierField: 'title',
        summary: '{{title}}',
        slug: '{{slug}}',
        fields: [titleField],
      }),
    ).toContain('  slug: "{{slug}}"\n  summary: "{{title}}"');
  });

  it('serializes editor-facing collection metadata, sort controls, views, previews, and deletion policy', () => {
    const [collection] = parse(
      buildFolderCollection({
        name: 'distro',
        label: 'Store Items — Distro & Merch',
        labelSingular: 'Store Item',
        description: 'Editorial Store Item content. Price and stock live elsewhere.',
        folder: 'src/content/distro',
        create: true,
        delete: false,
        extension: 'json',
        format: 'json',
        identifierField: 'title',
        summary: '{{title}} — {{group}}',
        sortableFields: ['title', 'group', 'order'],
        viewGroups: [{ label: 'Group', field: 'group' }],
        previewPath: 'store/{{slug}}',
        editorPreview: true,
        fields: [buildField({ label: 'Order', name: 'order', widget: 'number', valueType: 'int', min: 0 })],
      }),
    ) as Record<string, unknown>[];

    expect(collection).toMatchObject({
      name: 'distro',
      label: 'Store Items — Distro & Merch',
      label_singular: 'Store Item',
      description: 'Editorial Store Item content. Price and stock live elsewhere.',
      create: true,
      delete: false,
      sortable_fields: ['title', 'group', 'order'],
      view_groups: [{ label: 'Group', field: 'group' }],
      preview_path: 'store/{{slug}}',
      editor: { preview: true },
      fields: [{ value_type: 'int', min: 0 }],
    });
  });

  it('indents complete YAML blocks for parent sections', () => {
    expect(indentYamlBlock('collections:\n- name: "pages"', 2)).toBe('  collections:\n  - name: "pages"');
  });
});
