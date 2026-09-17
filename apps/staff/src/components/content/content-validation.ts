import { getCmsContentIssues, type CmsCollection, type CmsContentIssue } from '@blackbox/content-model';
import { editorialWriteData } from '../../lib/backend/editorial-api';

export type ContentValidation = {
  valid: boolean;
  issues: CmsContentIssue[];
  byPath: Record<string, string[]>;
  firstPath?: string | undefined;
};

function contentPath(path: string | Array<string | number>): string {
  return Array.isArray(path) ? path.join('.') : path;
}

export function getContentValidation(collection: CmsCollection, data: Record<string, unknown>): ContentValidation {
  const issues = getCmsContentIssues(collection, editorialWriteData(data));
  const byPath: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = contentPath(issue.path);
    (byPath[key] ??= []).push(issue.message);
  }
  return {
    valid: issues.length === 0,
    issues,
    byPath,
    firstPath: issues[0] ? contentPath(issues[0].path) : undefined,
  };
}

export function contentFieldErrors(validation: ContentValidation, path: string): string[] {
  const prefix = path ? `${path}.` : '';
  return validation.issues
    .filter((issue) => {
      const issuePath = contentPath(issue.path);
      return issuePath === path || (prefix !== '' && issuePath.startsWith(prefix));
    })
    .map((issue) => issue.message);
}
