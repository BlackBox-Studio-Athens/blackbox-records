import { isCmsCollection, readEditorialBooleans, readTypedValues } from '@blackbox/content-model';

/**
 * A stored record in the form the editors and the write API expect: values saved before the
 * typed-value migration in their new shape, and native 0/1 flags as true/false.
 * Kept in its own module so the schemas load only when a record opens.
 */
export function editorData(collection: string, data: Record<string, unknown>) {
  const typed = readTypedValues(collection, data);
  // EmDash publishes only the saved keys, so a Distro save writes `group: null` to clear the legacy column.
  if (collection === 'distro' && data.group !== undefined && data.group !== null && typed.group === undefined)
    typed.group = null;
  return isCmsCollection(collection) ? readEditorialBooleans(collection, typed) : typed;
}
