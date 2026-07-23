export type DecapSelectOption = {
  label: string;
  value: string;
};

export type DecapPattern = {
  message: string;
  value: string;
};

export type DecapRelationConfig = {
  collection: string;
  displayFields: string[];
  optionsLength?: number;
  searchFields: string[];
  valueField: string;
};

export type DecapViewGroup = {
  field: string;
  label: string;
};

export type BaseFieldConfig = {
  label: string;
  name: string;
  widget: string;
  hint?: string;
  required?: boolean;
  defaultValue?: boolean | number | string;
  labelSingular?: string;
  max?: number;
  min?: number;
  pattern?: DecapPattern;
  relation?: DecapRelationConfig;
  valueType?: 'float' | 'int';
  extras?: string[];
};

type ListTypeConfig = {
  label: string;
  name: string;
  summary?: string;
  collapsed?: boolean;
  fields: string[];
};

export type BlockFieldConfig = BaseFieldConfig & {
  allowAdd?: boolean;
  allowRemove?: boolean;
  allowReorder?: boolean;
  collapsed?: boolean;
  summary?: string;
  fields?: string[];
  field?: string;
  types?: ListTypeConfig[];
  typeKey?: string;
  options?: DecapSelectOption[];
};

type CollectionPresentationConfig = {
  description?: string;
  editorPreview?: boolean;
  labelSingular?: string;
  previewPath?: string;
  sortableFields?: string[];
  viewGroups?: DecapViewGroup[];
};

type FileEntryConfig = {
  name: string;
  label: string;
  file: string;
  mediaFolder?: string;
  publicFolder?: string;
  fields: string[];
};

export type FileCollectionConfig = CollectionPresentationConfig & {
  name: string;
  label: string;
  create: boolean;
  delete: boolean;
  extension: string;
  format: string;
  files: FileEntryConfig[];
};

export type FolderCollectionConfig = CollectionPresentationConfig & {
  name: string;
  label: string;
  folder: string;
  create: boolean;
  delete: boolean;
  extension: string;
  format: string;
  identifierField: string;
  summary: string;
  fields: string[];
  mediaFolder?: string;
  publicFolder?: string;
  slug?: string;
};

export function escapeYamlScalar(value: string): string {
  return JSON.stringify(value);
}

function serializeYamlValue(value: boolean | number | string): string {
  return typeof value === 'string' ? escapeYamlScalar(value) : String(value);
}

function serializeYamlList(values: string[]): string {
  return `[${values.map(escapeYamlScalar).join(', ')}]`;
}

export function indentYamlBlock(value: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

function ensureYamlListItem(value: string): string {
  if (value.trimStart().startsWith('- ')) {
    return value;
  }

  const [firstLine = '', ...remainingLines] = value.split('\n');
  return [`- ${firstLine}`, ...remainingLines.map((line) => `  ${line}`)].join('\n');
}

function indentYamlListItem(value: string, spaces: number): string {
  return indentYamlBlock(ensureYamlListItem(value), spaces);
}

function buildArtistOptionsYaml(options: DecapSelectOption[], indentSpaces = 4): string {
  return options
    .map(
      (option) =>
        `${' '.repeat(indentSpaces)}- { label: ${escapeYamlScalar(option.label)}, value: ${escapeYamlScalar(option.value)} }`,
    )
    .join('\n');
}

function appendBaseFieldOptions(lines: string[], config: BaseFieldConfig, indent = ''): void {
  if (config.required !== undefined) {
    lines.push(`${indent}required: ${config.required}`);
  }

  if (config.hint) {
    lines.push(`${indent}hint: ${escapeYamlScalar(config.hint)}`);
  }

  if (config.labelSingular) {
    lines.push(`${indent}label_singular: ${escapeYamlScalar(config.labelSingular)}`);
  }

  if (config.defaultValue !== undefined) {
    lines.push(`${indent}default: ${serializeYamlValue(config.defaultValue)}`);
  }

  if (config.valueType) {
    lines.push(`${indent}value_type: ${config.valueType}`);
  }

  if (config.min !== undefined) {
    lines.push(`${indent}min: ${config.min}`);
  }

  if (config.max !== undefined) {
    lines.push(`${indent}max: ${config.max}`);
  }

  if (config.pattern) {
    lines.push(
      `${indent}pattern: [${escapeYamlScalar(config.pattern.value)}, ${escapeYamlScalar(config.pattern.message)}]`,
    );
  }

  if (config.relation) {
    lines.push(`${indent}collection: ${escapeYamlScalar(config.relation.collection)}`);
    lines.push(`${indent}search_fields: ${serializeYamlList(config.relation.searchFields)}`);
    lines.push(`${indent}value_field: ${escapeYamlScalar(config.relation.valueField)}`);
    lines.push(`${indent}display_fields: ${serializeYamlList(config.relation.displayFields)}`);
    if (config.relation.optionsLength !== undefined) {
      lines.push(`${indent}options_length: ${config.relation.optionsLength}`);
    }
  }

  if (config.extras?.length) {
    lines.push(...config.extras.map((extra) => `${indent}${extra}`));
  }
}

function appendCollectionPresentation(lines: string[], config: CollectionPresentationConfig, indent = '  '): void {
  if (config.description) {
    lines.push(`${indent}description: ${escapeYamlScalar(config.description)}`);
  }

  if (config.labelSingular) {
    lines.push(`${indent}label_singular: ${escapeYamlScalar(config.labelSingular)}`);
  }

  if (config.sortableFields?.length) {
    lines.push(`${indent}sortable_fields: ${serializeYamlList(config.sortableFields)}`);
  }

  if (config.viewGroups?.length) {
    lines.push(`${indent}view_groups:`);
    for (const viewGroup of config.viewGroups) {
      lines.push(`${indent}  - label: ${escapeYamlScalar(viewGroup.label)}`);
      lines.push(`${indent}    field: ${escapeYamlScalar(viewGroup.field)}`);
    }
  }

  if (config.previewPath) {
    lines.push(`${indent}preview_path: ${escapeYamlScalar(config.previewPath)}`);
  }

  if (config.editorPreview !== undefined) {
    lines.push(`${indent}editor:`);
    lines.push(`${indent}  preview: ${config.editorPreview}`);
  }
}

export function buildFieldMapping(config: BaseFieldConfig): string {
  const lines = [
    `label: ${escapeYamlScalar(config.label)}`,
    `name: ${escapeYamlScalar(config.name)}`,
    `widget: ${config.widget}`,
  ];

  appendBaseFieldOptions(lines, config);

  return lines.join('\n');
}

function buildListType(config: ListTypeConfig): string {
  const lines = [
    `- label: ${escapeYamlScalar(config.label)}`,
    `  name: ${escapeYamlScalar(config.name)}`,
    '  widget: object',
  ];

  if (config.collapsed ?? true) {
    lines.push('  collapsed: true');
  }

  if (config.summary) {
    lines.push(`  summary: ${escapeYamlScalar(config.summary)}`);
  }

  lines.push('  fields:');
  lines.push(...config.fields.map((field) => indentYamlListItem(field, 4)));

  return lines.join('\n');
}

export function buildField(config: BlockFieldConfig): string {
  const lines = [
    `- label: ${escapeYamlScalar(config.label)}`,
    `  name: ${escapeYamlScalar(config.name)}`,
    `  widget: ${config.widget}`,
  ];

  appendBaseFieldOptions(lines, config, '  ');

  if (config.collapsed !== undefined) {
    lines.push(`  collapsed: ${config.collapsed}`);
  }

  if (config.summary) {
    lines.push(`  summary: ${escapeYamlScalar(config.summary)}`);
  }

  if (config.allowAdd !== undefined) {
    lines.push(`  allow_add: ${config.allowAdd}`);
  }

  if (config.allowRemove !== undefined) {
    lines.push(`  allow_remove: ${config.allowRemove}`);
  }

  if (config.allowReorder !== undefined) {
    lines.push(`  allow_reorder: ${config.allowReorder}`);
  }

  if (config.options?.length) {
    lines.push('  options:');
    lines.push(buildArtistOptionsYaml(config.options, 4));
  }

  if (config.types?.length) {
    lines.push(`  typeKey: ${escapeYamlScalar(config.typeKey || 'type')}`);
    lines.push('  types:');
    lines.push(...config.types.map((type) => indentYamlBlock(buildListType(type), 4)));
  }

  if (config.field) {
    lines.push('  field:');
    lines.push(indentYamlBlock(config.field, 4));
  }

  if (config.fields?.length) {
    lines.push('  fields:');
    lines.push(...config.fields.map((field) => indentYamlListItem(field, 4)));
  }

  return lines.join('\n');
}

export function buildSchemaField(schemaPath: string): string {
  return buildField({
    label: 'Schema',
    name: '$schema',
    widget: 'hidden',
    extras: [`default: ${escapeYamlScalar(schemaPath)}`],
  });
}

function buildFileEntry(config: FileEntryConfig): string {
  const lines = [
    `- name: ${escapeYamlScalar(config.name)}`,
    `  label: ${escapeYamlScalar(config.label)}`,
    `  file: ${escapeYamlScalar(config.file)}`,
  ];

  if (config.mediaFolder) {
    lines.push(`  media_folder: ${escapeYamlScalar(config.mediaFolder)}`);
  }

  if (config.publicFolder) {
    lines.push(`  public_folder: ${escapeYamlScalar(config.publicFolder)}`);
  }

  lines.push('  fields:');
  lines.push(...config.fields.map((field) => indentYamlListItem(field, 4)));

  return lines.join('\n');
}

export function buildFileCollection(config: FileCollectionConfig): string {
  const lines = [`- name: ${escapeYamlScalar(config.name)}`, `  label: ${escapeYamlScalar(config.label)}`];

  appendCollectionPresentation(lines, config);
  lines.push(`  create: ${config.create}`);
  lines.push(`  delete: ${config.delete}`);
  lines.push(`  extension: ${config.extension}`);
  lines.push(`  format: ${config.format}`);
  lines.push('  files:');

  lines.push(...config.files.map((file) => indentYamlBlock(buildFileEntry(file), 4)));

  return lines.join('\n');
}

export function buildFolderCollection(config: FolderCollectionConfig): string {
  const lines = [`- name: ${escapeYamlScalar(config.name)}`, `  label: ${escapeYamlScalar(config.label)}`];

  appendCollectionPresentation(lines, config);
  lines.push(`  folder: ${escapeYamlScalar(config.folder)}`);
  lines.push(`  create: ${config.create}`);
  lines.push(`  delete: ${config.delete}`);
  lines.push(`  extension: ${config.extension}`);
  lines.push(`  format: ${config.format}`);
  lines.push(`  identifier_field: ${escapeYamlScalar(config.identifierField)}`);

  if (config.slug) {
    lines.push(`  slug: ${escapeYamlScalar(config.slug)}`);
  }

  if (config.mediaFolder) {
    lines.push(`  media_folder: ${escapeYamlScalar(config.mediaFolder)}`);
  }

  if (config.publicFolder) {
    lines.push(`  public_folder: ${escapeYamlScalar(config.publicFolder)}`);
  }

  lines.push(`  summary: ${escapeYamlScalar(config.summary)}`);
  lines.push('  fields:');
  lines.push(...config.fields.map((field) => indentYamlListItem(field, 4)));

  return lines.join('\n');
}
