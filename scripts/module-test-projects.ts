import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { TestProjectInlineConfiguration } from 'vitest/node';

const workspace = path.resolve(import.meta.dirname, '..');

interface ModuleProject {
  name: string;
  directory: string;
  targets: { test?: { command?: string } };
}

/** Native Vitest discovery follows Nx roots; dependency-only targets reuse integration suites. */
export function moduleTestProjects(
  app: string,
  base: TestProjectInlineConfiguration,
  runtime: 'node' | 'worker' | 'request' = 'node',
) {
  const root = path.join(workspace, 'apps', app);
  const definitions = [...globSync(`apps/${app}/{src,test}/**/project.json`, { cwd: workspace })].map((file) => ({
    directory: path.dirname(file).replaceAll('\\', '/'),
    ...(JSON.parse(readFileSync(path.join(workspace, file), 'utf8')) as Omit<ModuleProject, 'directory'>),
  }));
  return definitions
    .filter((project) => project.targets.test?.command)
    .map((project) => {
      const relative = (file: string) => path.relative(root, path.join(workspace, file)).replaceAll('\\', '/');
      const exclude = definitions
        .filter((child) => child.directory.startsWith(`${project.directory}/`))
        .map((child) => relative(child.directory) + '/**');
      const suffix = runtime === 'node' ? '' : `.${runtime}`;
      return {
        ...base,
        root,
        test: {
          ...base.test,
          name: project.name + (runtime === 'node' ? '' : `:${runtime}`),
          include: [relative(project.directory) + '/**/*' + suffix + '.{test,spec}.{ts,tsx}'],
          exclude: [
            ...exclude,
            ...(runtime === 'node' ? ['**/*.worker.{test,spec}.{ts,tsx}', '**/*.request.{test,spec}.{ts,tsx}'] : []),
          ],
          maxWorkers: 1,
        },
      };
    });
}
