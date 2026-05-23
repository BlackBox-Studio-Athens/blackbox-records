const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.resolve(repoRoot, 'openspec/specs/module-boundaries/module-boundaries.manifest.json');

const WALK_IGNORES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  '.astro',
  '.wrangler',
  '.vite',
  'coverage',
]);
const APPROVED_OPEN_TEMPORARY_MODULES = new Set([]);
const DEFAULT_DISALLOWED_MODULE_DIRECTORY_NAMES = ['ports', 'adapters'];
let cachedRepoFiles;

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegexSource(pattern) {
  const normalized = toPosixPath(pattern);
  let source = '';

  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized.startsWith('**/', index)) {
      source += '(?:.*/)?';
      index += 2;
      continue;
    }

    if (normalized.startsWith('**', index)) {
      source += '.*';
      index += 1;
      continue;
    }

    const character = normalized[index];
    source += character === '*' ? '[^/]*' : escapeRegex(character);
  }

  return source;
}

function globToRegExp(pattern) {
  return new RegExp(`^${globToRegexSource(pattern)}$`);
}

function dedupe(values) {
  return [...new Set(values)];
}

function flattenValues(record) {
  return Object.values(record ?? {}).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(relativePath) {
  return fs.existsSync(path.resolve(repoRoot, relativePath));
}

function loadModuleBoundariesManifest() {
  return readJson(manifestPath);
}

function sanitizeName(name) {
  return name.replace(/^@/, '').replace(/[^\w]+/g, '-');
}

function getModuleInternalType(moduleName) {
  return `module-${moduleName}-internal`;
}

function getModuleEntrypointType(moduleName) {
  return `module-${moduleName}-entrypoint`;
}

function getWorkspaceInternalType(workspaceName) {
  return `workspace-${sanitizeName(workspaceName)}-internal`;
}

function getWorkspaceExportType(workspaceName, exportName) {
  const normalizedName = exportName === '.' ? 'root' : exportName.replace(/^\.\//, '').replace(/[^\w]+/g, '-');
  return `workspace-${sanitizeName(workspaceName)}-${normalizedName}`;
}

function getModuleEntrypointFiles(moduleDefinition) {
  return dedupe([...(moduleDefinition.providedEntrypoints ?? []), ...flattenValues(moduleDefinition.namedInterfaces)]);
}

function getWorkspaceExportFiles(workspaceBoundary) {
  return dedupe(Object.values(workspaceBoundary.exports ?? {}));
}

function getModuleEntries(manifest) {
  return Object.entries(manifest.modules ?? {});
}

function getWorkspaceEntries(manifest) {
  return Object.entries(manifest.workspaceBoundaries ?? {});
}

function patternSpecificity(pattern) {
  const wildcardCount = (pattern.match(/\*/g) ?? []).length;
  return { wildcardCount, length: pattern.length };
}

function sortPatternsBySpecificity(patterns) {
  return [...patterns].sort((left, right) => {
    const leftSpecificity = patternSpecificity(left.pattern);
    const rightSpecificity = patternSpecificity(right.pattern);

    if (leftSpecificity.wildcardCount !== rightSpecificity.wildcardCount) {
      return leftSpecificity.wildcardCount - rightSpecificity.wildcardCount;
    }

    return rightSpecificity.length - leftSpecificity.length;
  });
}

function buildEslintBoundaryConfig(manifest = loadModuleBoundariesManifest()) {
  const descriptors = [];
  const files = [];

  for (const [workspaceName, workspaceBoundary] of getWorkspaceEntries(manifest)) {
    for (const [exportName, exportFile] of Object.entries(workspaceBoundary.exports ?? {})) {
      descriptors.push({
        type: getWorkspaceExportType(workspaceName, exportName),
        pattern: exportFile,
        mode: 'full',
      });
      files.push(exportFile);
    }

    for (const rootPattern of workspaceBoundary.ownedRoots ?? []) {
      descriptors.push({
        type: getWorkspaceInternalType(workspaceName),
        pattern: rootPattern,
        mode: 'full',
      });
      files.push(rootPattern);
    }
  }

  for (const [moduleName, moduleDefinition] of getModuleEntries(manifest)) {
    for (const entrypointFile of getModuleEntrypointFiles(moduleDefinition)) {
      descriptors.push({
        type: getModuleEntrypointType(moduleName),
        pattern: entrypointFile,
        mode: 'full',
      });
      files.push(entrypointFile);
    }

    for (const rootPattern of moduleDefinition.roots ?? []) {
      descriptors.push({
        type: getModuleInternalType(moduleName),
        pattern: rootPattern,
        mode: 'full',
      });
      files.push(rootPattern);
    }
  }

  const dependencyRules = [];

  for (const [workspaceName, workspaceBoundary] of getWorkspaceEntries(manifest)) {
    if (!(workspaceBoundary.ownedRoots ?? []).length) {
      continue;
    }

    const workspaceTypes = [
      getWorkspaceInternalType(workspaceName),
      ...Object.keys(workspaceBoundary.exports ?? {}).map((exportName) =>
        getWorkspaceExportType(workspaceName, exportName),
      ),
    ];

    dependencyRules.push({
      from: { type: workspaceTypes },
      allow: { to: { type: workspaceTypes } },
    });
  }

  for (const [moduleName, moduleDefinition] of getModuleEntries(manifest)) {
    const fromTypes = [getModuleInternalType(moduleName), getModuleEntrypointType(moduleName)];

    dependencyRules.push({
      from: { type: fromTypes },
      allow: { to: { type: fromTypes } },
    });

    for (const dependencyName of moduleDefinition.allowedDependencies ?? []) {
      dependencyRules.push({
        from: { type: fromTypes },
        allow: { to: { type: getModuleEntrypointType(dependencyName) } },
      });
    }

    for (const [workspaceName, exportNames] of Object.entries(moduleDefinition.allowedWorkspaceInterfaces ?? {})) {
      dependencyRules.push({
        from: { type: fromTypes },
        allow: {
          to: {
            type: (exportNames ?? []).map((exportName) => getWorkspaceExportType(workspaceName, exportName)),
          },
        },
      });
    }
  }

  return {
    files: dedupe(files),
    descriptors: sortPatternsBySpecificity(descriptors),
    dependencyRules,
  };
}

function buildUnionRegex(patterns) {
  if (!patterns.length) {
    return '^$';
  }

  return `^(?:${patterns.map(globToRegexSource).join('|')})$`;
}

function buildAllowedTargetPatterns(manifest, moduleName) {
  const moduleDefinition = manifest.modules[moduleName];
  const ownPatterns = dedupe([...(moduleDefinition.roots ?? []), ...getModuleEntrypointFiles(moduleDefinition)]);
  const dependencyPatterns = (moduleDefinition.allowedDependencies ?? []).flatMap((dependencyName) =>
    getModuleEntrypointFiles(manifest.modules[dependencyName]),
  );
  const workspacePatterns = Object.entries(moduleDefinition.allowedWorkspaceInterfaces ?? {}).flatMap(
    ([workspaceName, exportNames]) => {
      const workspaceBoundary = manifest.workspaceBoundaries[workspaceName];
      return (exportNames ?? []).map((exportName) => workspaceBoundary.exports[exportName]);
    },
  );

  return dedupe([...ownPatterns, ...dependencyPatterns, ...workspacePatterns]);
}

function buildDependencyCruiserConfig(manifest = loadModuleBoundariesManifest()) {
  const forbidden = [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ];

  for (const [moduleName, moduleDefinition] of getModuleEntries(manifest)) {
    forbidden.push({
      name: `module-${moduleName}-dependency-boundary`,
      severity: 'error',
      from: {
        path: buildUnionRegex(moduleDefinition.roots ?? []),
      },
      to: {
        path: '^(?:apps|packages)/',
        pathNot: buildUnionRegex(buildAllowedTargetPatterns(manifest, moduleName)),
      },
    });
  }

  const apiClientBoundary = manifest.workspaceBoundaries['@blackbox/api-client'];
  if (apiClientBoundary) {
    forbidden.push({
      name: 'api-client-export-only-access',
      severity: 'error',
      from: {
        pathNot: buildUnionRegex(apiClientBoundary.ownedRoots ?? []),
      },
      to: {
        path: '^packages/api-client/src/',
        pathNot: buildUnionRegex(getWorkspaceExportFiles(apiClientBoundary)),
      },
    });
  }

  return {
    forbidden,
    options: {
      tsConfig: {
        fileName: 'tsconfig.boundaries.json',
      },
      tsPreCompilationDeps: true,
      enhancedResolveOptions: {
        extensions: ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'],
      },
      includeOnly: '^(?:apps/web/src|apps/backend/src|packages/api-client/src)/.*\\.(?:ts|tsx)$',
      exclude: '^(?:apps/backend/src/generated|packages/api-client/src/generated)/',
    },
  };
}

function listRepoFiles() {
  if (cachedRepoFiles) {
    return cachedRepoFiles;
  }

  const files = [];

  function walk(currentDirectory) {
    const relativeDirectory = toPosixPath(path.relative(repoRoot, currentDirectory));

    if (relativeDirectory === 'openspec/changes/archive' || relativeDirectory.startsWith('openspec/changes/archive/')) {
      return;
    }

    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      if (entry.isDirectory() && WALK_IGNORES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = toPosixPath(path.relative(repoRoot, absolutePath));

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      files.push(relativePath);
    }
  }

  walk(repoRoot);
  cachedRepoFiles = files;
  return files;
}

function getOwnedEntries(manifest) {
  const moduleEntries = getModuleEntries(manifest).map(([moduleName, moduleDefinition]) => ({
    name: moduleName,
    kind: 'module',
    roots: moduleDefinition.roots ?? [],
    ownershipExceptions: moduleDefinition.ownershipExceptions ?? [],
    entrypoints: getModuleEntrypointFiles(moduleDefinition),
  }));

  const workspaceEntries = getWorkspaceEntries(manifest)
    .filter(([, workspaceBoundary]) => (workspaceBoundary.ownedRoots ?? []).length > 0)
    .map(([workspaceName, workspaceBoundary]) => ({
      name: workspaceName,
      kind: 'workspace',
      roots: workspaceBoundary.ownedRoots ?? [],
      ownershipExceptions: workspaceBoundary.ownershipExceptions ?? [],
      entrypoints: getWorkspaceExportFiles(workspaceBoundary),
    }));

  return [...moduleEntries, ...workspaceEntries];
}

function isPatternMatched(filePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(filePath));
}

function hasPathSegment(filePath, segmentName) {
  return toPosixPath(filePath).split('/').includes(segmentName);
}

function hasDisallowedModuleDirectory(filePath, directoryNames) {
  return directoryNames.some((directoryName) => hasPathSegment(filePath, directoryName));
}

function isModuleDirectoryExceptionApproved(manifest, moduleName, filePath) {
  const approvedExceptions = manifest.entrypointPolicy?.approvedModuleDirectoryNameExceptions?.[moduleName] ?? [];
  return isPatternMatched(filePath, approvedExceptions);
}

function validateManifest(manifest = loadModuleBoundariesManifest()) {
  const errors = [];
  const allFiles = listRepoFiles();
  const moduleNames = new Set(Object.keys(manifest.modules ?? {}));
  const workspaceNames = new Set(Object.keys(manifest.workspaceBoundaries ?? {}));
  const ownershipMap = new Map();

  for (const [workspaceName, workspaceBoundary] of getWorkspaceEntries(manifest)) {
    if (!fileExists(workspaceBoundary.packageJson)) {
      errors.push(
        `Workspace boundary ${workspaceName} references missing package.json: ${workspaceBoundary.packageJson}`,
      );
    }

    if (!fileExists(workspaceBoundary.packageRoot)) {
      errors.push(
        `Workspace boundary ${workspaceName} references missing package root: ${workspaceBoundary.packageRoot}`,
      );
    }

    for (const [exportName, exportFile] of Object.entries(workspaceBoundary.exports ?? {})) {
      if (!fileExists(exportFile)) {
        errors.push(`Workspace boundary ${workspaceName} export ${exportName} is missing: ${exportFile}`);
      }
    }

    if (workspaceBoundary.packageJson && fileExists(workspaceBoundary.packageJson) && workspaceBoundary.exports) {
      const packageJson = readJson(path.resolve(repoRoot, workspaceBoundary.packageJson));

      for (const [exportName, exportFile] of Object.entries(workspaceBoundary.exports)) {
        if (packageJson.exports?.[exportName] !== `./${exportFile.replace(/^packages\/api-client\//, '')}`) {
          errors.push(
            `Workspace boundary ${workspaceName} export ${exportName} does not match ${workspaceBoundary.packageJson}`,
          );
        }
      }
    }
  }

  for (const [moduleName, moduleDefinition] of getModuleEntries(manifest)) {
    for (const [interfaceName, interfaceFile] of Object.entries(moduleDefinition.namedInterfaces ?? {})) {
      if (interfaceName.endsWith('-spi') && !interfaceFile.endsWith('/spi.ts')) {
        errors.push(
          `Module ${moduleName} named SPI ${interfaceName} must target a spi.ts entrypoint: ${interfaceFile}`,
        );
      }
    }

    if (moduleDefinition.status === 'open-temporary') {
      if (!APPROVED_OPEN_TEMPORARY_MODULES.has(moduleName)) {
        errors.push(`Module ${moduleName} is open-temporary but is not in the approved open-temporary set`);
      }

      for (const metadataField of ['temporaryOpenReason', 'exitCriteria', 'forbiddenWhileOpen']) {
        const fieldValue = moduleDefinition[metadataField];
        const isValid =
          metadataField === 'temporaryOpenReason' ? isNonEmptyString(fieldValue) : isNonEmptyStringArray(fieldValue);

        if (!isValid) {
          errors.push(`Module ${moduleName} open-temporary metadata missing non-empty ${metadataField}`);
        }
      }
    }

    for (const dependencyName of moduleDefinition.allowedDependencies ?? []) {
      if (!moduleNames.has(dependencyName)) {
        errors.push(`Module ${moduleName} allows unknown module dependency: ${dependencyName}`);
      }
    }

    for (const [workspaceName, exportNames] of Object.entries(moduleDefinition.allowedWorkspaceInterfaces ?? {})) {
      if (!workspaceNames.has(workspaceName)) {
        errors.push(`Module ${moduleName} allows unknown workspace boundary: ${workspaceName}`);
        continue;
      }

      const workspaceBoundary = manifest.workspaceBoundaries[workspaceName];
      for (const exportName of exportNames ?? []) {
        if (!workspaceBoundary.exports?.[exportName]) {
          errors.push(`Module ${moduleName} allows unknown workspace export ${workspaceName}:${exportName}`);
        }
      }
    }

    for (const entrypointFile of getModuleEntrypointFiles(moduleDefinition)) {
      if (!fileExists(entrypointFile)) {
        errors.push(`Module ${moduleName} entrypoint is missing: ${entrypointFile}`);
      }
    }

    if (moduleName === 'platform-shared') {
      if (moduleDefinition.status !== 'closed') {
        errors.push('platform-shared must remain closed after Phase 12 closure');
      }

      if ((moduleDefinition.allowedDependencies ?? []).length > 0) {
        errors.push('platform-shared must not depend on business modules');
      }

      for (const entry of [...(moduleDefinition.roots ?? []), ...getModuleEntrypointFiles(moduleDefinition)]) {
        if (entry.startsWith('apps/backend/src/domain/commerce/')) {
          errors.push(`platform-shared must not own backend commerce domain code: ${entry}`);
        }

        if (entry.startsWith('apps/web/src/components/ui/') || entry === 'apps/web/src/lib/utils.ts') {
          errors.push(`platform-shared must not own frontend UI foundation code: ${entry}`);
        }

        if (entry.startsWith('apps/backend/src/interfaces/http/auth/')) {
          errors.push(`platform-shared must not own operator auth code: ${entry}`);
        }

        if (entry.startsWith('apps/backend/src/infrastructure/persistence/prisma/')) {
          errors.push(`platform-shared must not own backend persistence adapters: ${entry}`);
        }

        if (entry.startsWith('apps/backend/src/infrastructure/stripe/')) {
          errors.push(`platform-shared must not own Stripe integration code: ${entry}`);
        }
      }
    }
  }

  for (const ownedEntry of getOwnedEntries(manifest)) {
    for (const rootPattern of ownedEntry.roots) {
      const matches = allFiles.filter((filePath) => globToRegExp(rootPattern).test(filePath));
      const disallowedDirectoryNames =
        manifest.entrypointPolicy?.disallowedModuleDirectoryNames ?? DEFAULT_DISALLOWED_MODULE_DIRECTORY_NAMES;

      if (
        ownedEntry.kind === 'module' &&
        hasDisallowedModuleDirectory(rootPattern, disallowedDirectoryNames) &&
        !isModuleDirectoryExceptionApproved(manifest, ownedEntry.name, rootPattern)
      ) {
        errors.push(`Module ${ownedEntry.name} declares unapproved ports/adapters path: ${rootPattern}`);
      }

      if (matches.length === 0) {
        errors.push(`${ownedEntry.kind} ${ownedEntry.name} root pattern matched no files: ${rootPattern}`);
      }

      for (const filePath of matches) {
        if (
          ownedEntry.kind === 'module' &&
          hasDisallowedModuleDirectory(filePath, disallowedDirectoryNames) &&
          !isModuleDirectoryExceptionApproved(manifest, ownedEntry.name, filePath)
        ) {
          errors.push(`Module ${ownedEntry.name} contains unapproved ports/adapters file: ${filePath}`);
        }

        const owners = ownershipMap.get(filePath) ?? [];
        owners.push(ownedEntry);
        ownershipMap.set(filePath, owners);
      }
    }
  }

  for (const [filePath, owners] of ownershipMap.entries()) {
    if (owners.length <= 1) {
      continue;
    }

    const overlapAllowed = owners.some((owner) => isPatternMatched(filePath, owner.ownershipExceptions));
    if (!overlapAllowed) {
      errors.push(
        `Owned file has overlapping boundaries without an exception: ${filePath} (${owners.map((owner) => owner.name).join(', ')})`,
      );
    }
  }

  return errors;
}

module.exports = {
  repoRoot,
  manifestPath,
  loadModuleBoundariesManifest,
  buildEslintBoundaryConfig,
  buildDependencyCruiserConfig,
  validateManifest,
  getModuleEntrypointFiles,
  getWorkspaceExportFiles,
};
