export type DecapSelectOption = {
  label: string;
  value: string;
};

export type BaseFieldConfig = {
  label: string;
  name: string;
  widget: string;
  hint?: string;
  required?: boolean;
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
  collapsed?: boolean;
  summary?: string;
  fields?: string[];
  field?: string;
  types?: ListTypeConfig[];
  typeKey?: string;
  options?: DecapSelectOption[];
};

type FileEntryConfig = {
  name: string;
  label: string;
  file: string;
  mediaFolder?: string;
  publicFolder?: string;
  fields: string[];
};

export type FileCollectionConfig = {
  name: string;
  label: string;
  create: boolean;
  delete: boolean;
  extension: string;
  format: string;
  files: FileEntryConfig[];
};

export type FolderCollectionConfig = {
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

export function buildFieldMapping(config: BaseFieldConfig): string {
  const lines = [
    `label: ${escapeYamlScalar(config.label)}`,
    `name: ${escapeYamlScalar(config.name)}`,
    `widget: ${config.widget}`,
  ];

  if (config.required === false) {
    lines.push('required: false');
  }

  if (config.hint) {
    lines.push(`hint: ${escapeYamlScalar(config.hint)}`);
  }

  if (config.extras?.length) {
    lines.push(...config.extras);
  }

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

  if (config.required === false) {
    lines.push('  required: false');
  }

  if (config.hint) {
    lines.push(`  hint: ${escapeYamlScalar(config.hint)}`);
  }

  if (config.collapsed) {
    lines.push('  collapsed: true');
  }

  if (config.summary) {
    lines.push(`  summary: ${escapeYamlScalar(config.summary)}`);
  }

  if (config.extras?.length) {
    lines.push(...config.extras.map((extra) => `  ${extra}`));
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
  const lines = [
    `- name: ${escapeYamlScalar(config.name)}`,
    `  label: ${escapeYamlScalar(config.label)}`,
    `  create: ${config.create}`,
    `  delete: ${config.delete}`,
    `  extension: ${config.extension}`,
    `  format: ${config.format}`,
    '  files:',
  ];

  lines.push(...config.files.map((file) => indentYamlBlock(buildFileEntry(file), 4)));

  return lines.join('\n');
}

export function buildFolderCollection(config: FolderCollectionConfig): string {
  const lines = [
    `- name: ${escapeYamlScalar(config.name)}`,
    `  label: ${escapeYamlScalar(config.label)}`,
    `  folder: ${escapeYamlScalar(config.folder)}`,
    `  create: ${config.create}`,
    `  delete: ${config.delete}`,
    `  extension: ${config.extension}`,
    `  format: ${config.format}`,
    `  identifier_field: ${escapeYamlScalar(config.identifierField)}`,
  ];

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
