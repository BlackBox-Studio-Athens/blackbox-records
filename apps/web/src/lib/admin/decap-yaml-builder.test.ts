import { describe, expect, it } from 'vitest';

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

    expect(fileCollectionYaml).toContain('  format: json\n  files:\n    - name: "home"');
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

  it('indents complete YAML blocks for parent sections', () => {
    expect(indentYamlBlock('collections:\n- name: "pages"', 2)).toBe('  collections:\n  - name: "pages"');
  });
});
