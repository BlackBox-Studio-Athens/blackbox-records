import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  editorialRequest,
  EditorialApiError,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';
import {
  readContentPublications,
  publishSavedContent,
  type ContentPublication,
  type SelectedPublicationRequest,
} from '../../lib/backend/content-publication-api';
import { readStaffQuery, useStaffRead } from '../../lib/staff-query';
import { contentSections, type ContentSection } from './ContentFields';
import { getContentValidation } from './content-validation';
import { readSelection, saveSelection, type PublicationSelectionItem } from './publication-selection';
import { usePublicationPolling } from './PublicationStatus';

type Saved = { item: EditorialRecord; _rev: string };
const key = (item: { collection?: string; id?: string; recordId?: string }) =>
  `${item.collection}/${item.recordId ?? item.id}`;
const editUrl = (item: { collection?: string; id?: string; recordId?: string }) =>
  `/content/?${new URLSearchParams({ collection: item.collection ?? '', id: item.recordId ?? item.id ?? '' })}`;
const title = (item: EditorialRecord) =>
  String(item.data.title || item.data.label_name || contentSections[item.collection as ContentSection] || 'Untitled');

function blockers(validation: ReturnType<typeof getContentValidation>) {
  return [
    ...new Set(
      validation.issues.map((issue) => {
        if (!/^(Invalid|Too small|Too big|Unrecognized)/.test(issue.message)) return issue.message;
        const path = (Array.isArray(issue.path) ? issue.path.join(' ') : issue.path)
          .replace(/[_.]/g, ' ')
          .replace(/\bgroup\b/g, 'format')
          .replace(/\bhero\b/g, 'opening section');
        return `Complete ${path || 'the required details'}.`;
      }),
    ),
  ].join(' ');
}

export default function WebsiteChanges({ base }: { base: string }) {
  const [items, setItems] = useState<EditorialRecord[]>([]);
  const [selection, setSelection] = useState<PublicationSelectionItem[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [cursor, setCursor] = useState('');
  const [pages, setPages] = useState<string[]>(['']);
  const [next, setNext] = useState<string>();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const sequence = useRef(0);
  const [error, setError] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<SelectedPublicationRequest | null>(null);
  const [publications, setPublications] = useState<ContentPublication[]>([]);
  const pendingKey = `blackbox-content-publication-v2:${base}`;
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const restorePosition = useRef(true);

  useEffect(() => {
    if (loading || !ready || !restorePosition.current) return;
    restorePosition.current = false;
    const saved = history.state?.reviewPosition;
    if (!saved || !root.current) return;
    const link = [...root.current.querySelectorAll<HTMLAnchorElement>('a')].find((item) => item.href === saved.href);
    link?.focus({ preventScroll: true });
    root.current.scrollTop = saved.scroll;
    window.scrollTo(0, saved.windowScroll);
  }, [loading, ready]);
  function select(value: PublicationSelectionItem[]) {
    try {
      saveSelection(base, value);
    } catch {
      setError('This browser cannot remember your selection. Allow session storage and retry.');
      return false;
    }
    setSelection(value);
    setReviewed(false);
    return true;
  }
  async function list() {
    const request = ++sequence.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'changes', scope, q: query });
      const found: EditorialRecord[] = [];
      let continuation = cursor || undefined;
      do {
        params.set('limit', String(25 - found.length));
        if (continuation) params.set('cursor', continuation);
        else params.delete('cursor');
        const result = await readStaffQuery(['website-changes', base, params.toString()], () =>
          editorialRequest<EditorialList<EditorialRecord>>(base, `blackbox/workspace?${params}`),
        );
        if (request !== sequence.current) return;
        found.push(...result.items);
        continuation = result.nextCursor;
      } while (continuation && found.length < 25);
      setItems(found);
      setNext(continuation);
      setError('');
    } catch (cause) {
      if (request !== sequence.current) return;
      if (cause instanceof EditorialApiError && [401, 403].includes(cause.status)) {
        setItems([]);
        setSelection([]);
        setReviewed(false);
      }
      setError('Website changes could not be loaded. Retry to continue.');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }
  async function status() {
    try {
      const result = await readContentPublications(base);
      setPublications(result.items);
      if (pending) {
        const operation = result.items.find((item) => item.id === pending.id);
        if (operation?.status === 'live') {
          localStorage.removeItem(pendingKey);
          setPending(null);
          select([]);
          setMessage('On the website.');
          await list();
        } else if (operation?.status === 'failed') {
          setMessage('The website update failed. Review the saved changes before trying again.');
        }
      }
    } catch {
      setError('Update not confirmed. Check status to continue.');
    }
  }
  const pendingState = publications.find((item) => item.id === pending?.id)?.status;
  const polling = usePublicationPolling(
    pendingState === 'failed' ? '' : (pending?.id ?? publications.find((item) => item.status === 'pending')?.id ?? ''),
    status,
  );
  useEffect(() => {
    const restore = () => {
      setReviewed(false);
      const params = new URLSearchParams(location.search);
      setQuery(params.get('q') ?? '');
      setScope(params.get('scope') ?? 'all');
      setCursor(params.get('cursor') ?? '');
      setPages(history.state?.reviewPages ?? ['']);
      restorePosition.current = true;
    };
    restore();
    try {
      const restored = readSelection(base);
      setSelection(restored);
      const stored = localStorage.getItem(pendingKey);
      if (stored) {
        const input = JSON.parse(stored) as SelectedPublicationRequest;
        const records = 'records' in input ? input.records : [input];
        if (
          typeof input.id !== 'string' ||
          !records.length ||
          records.length > 20 ||
          records.some(
            (item) =>
              typeof item.collection !== 'string' ||
              typeof item.recordId !== 'string' ||
              typeof item.expectedRevision !== 'string',
          )
        )
          throw new Error();
        setPending(input);
        setSelection(
          records.map((item) => ({
            ...item,
            title:
              restored.find((entry) => key(entry) === key(item))?.title ??
              contentSections[item.collection as ContentSection] ??
              item.recordId,
          })),
        );
      }
    } catch {
      setRecoveryError(
        'Saved review could not be restored. Ask a label administrator to check publication status before starting again.',
      );
    }
    setReady(true);
    window.addEventListener('popstate', restore);
    window.addEventListener('pageshow', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('pageshow', restore);
    };
  }, [base]);
  useEffect(() => {
    if (ready) void status();
  }, [ready, pending?.id]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => void list(), 300);
    return () => {
      clearTimeout(timer);
      sequence.current++;
    };
  }, [ready, query, scope, cursor]);
  useStaffRead(
    ['website-changes-return', base, query, scope, cursor],
    async () => {
      setReviewed(false);
      await list();
      await status();
    },
    { enabled: ready && !busy },
  );
  function browse(q: string, area: string, page = '', trail = ['']) {
    setQuery(q);
    setScope(area);
    setCursor(page);
    setPages(trail);
    setReviewed(false);
    const params = new URLSearchParams({ q, scope: area });
    if (page) params.set('cursor', page);
    history.pushState({ reviewPages: trail }, '', `/review/?${params}`);
  }
  async function add(entries: EditorialRecord[]) {
    if (lock.current || pending) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const fresh = entries
        .filter((item) => !selection.some((chosen) => key(chosen) === key(item)))
        .slice(0, 20 - selection.length);
      const saved = await Promise.all(
        fresh.map(async (item) => {
          const result = await editorialRequest<Saved>(
            base,
            `content/${item.collection}/${encodeURIComponent(item.id)}`,
          );
          if (!getContentValidation(item.collection as ContentSection, result.item.data).valid)
            throw new Error('An entry changed or needs more details. Finish editing it first.');
          return {
            collection: item.collection!,
            recordId: item.id,
            expectedRevision: result._rev,
            title: title({ ...result.item, collection: item.collection! }),
          };
        }),
      );
      select([...selection, ...saved]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Selection could not be checked.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function review() {
    if (lock.current || !selection.length || recoveryError) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const checked = await Promise.all(
        selection.map(async (item) => {
          const result = await editorialRequest<Saved>(
            base,
            `content/${item.collection}/${encodeURIComponent(item.recordId)}`,
          );
          const summary = await editorialRequest<EditorialList<EditorialRecord>>(
            base,
            `blackbox/workspace?${new URLSearchParams({ collection: item.collection, id: item.recordId })}`,
          );
          if (summary.items[0]?.publicationState === 'pending')
            throw new Error(`${item.title} is already updating the website. Check status.`);
          if (summary.items[0]?.publicationState === 'published')
            throw new Error(`${item.title} is already on the website. Remove it from this selection.`);
          const validation = getContentValidation(item.collection as ContentSection, result.item.data);
          if (!validation.valid)
            throw new Error(`${item.title}: ${blockers(validation)} Finish editing before publishing.`);
          return {
            ...item,
            expectedRevision: result._rev,
            title: title({ ...result.item, collection: item.collection! }),
          };
        }),
      );
      const changed = checked.some((item, index) => item.expectedRevision !== selection[index]?.expectedRevision);
      if (!select(checked)) return;
      setReviewed(!changed);
      setMessage(
        changed
          ? 'A selected entry changed. Check the updated selection, then review again.'
          : 'These saved versions will appear on the website. Newer edits stay private.',
      );
      requestAnimationFrame(() => heading.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review failed.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function publish() {
    if (lock.current || recoveryError || (!pending && !reviewed)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const input = pending ?? {
        id: crypto.randomUUID(),
        records: selection.map(({ title: _title, ...item }) => item),
      };
      localStorage.setItem(pendingKey, JSON.stringify(input));
      setPending(input);
      const result = await publishSavedContent(base, input);
      setPublications((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      setMessage(
        result.status === 'live'
          ? 'On the website.'
          : result.status === 'failed'
            ? 'The website update failed. Review the saved changes before trying again.'
            : 'Updating website…',
      );
      if (result.status === 'live') {
        localStorage.removeItem(pendingKey);
        setPending(null);
        select([]);
      }
      await list();
    } catch (cause) {
      if (cause instanceof EditorialApiError && [400, 409].includes(cause.status)) {
        localStorage.removeItem(pendingKey);
        setPending(null);
        setReviewed(false);
      }
      setError(cause instanceof Error ? cause.message : 'Update not confirmed. Check status before retrying.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      ref={root}
      className="staff-page website-changes"
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest('a');
        if (link)
          history.replaceState(
            {
              ...history.state,
              reviewPosition: { href: link.href, scroll: root.current?.scrollTop ?? 0, windowScroll: window.scrollY },
            },
            '',
            location.href,
          );
      }}
    >
      <h1>Review website changes</h1>
      <p>Choose the saved changes to put on the website. Price, stock and shop activation are handled separately.</p>
      {recoveryError && <p role="alert">{recoveryError}</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => void (pending ? status() : list())}>
            Retry
          </Button>
        </div>
      )}
      {(message || polling.paused) && <p role="status">{polling.paused ? 'Update not confirmed' : message}</p>}
      {pending ? (
        <section aria-label="Publication in progress">
          <h2>Website update</h2>
          <p>Your publication is retained. Check its status before starting another.</p>
          <Button variant="outline" disabled={busy || polling.checking} onClick={() => void polling.check()}>
            Check status
          </Button>
          {pendingState === undefined && (
            <Button disabled={busy} onClick={() => void publish()}>
              Retry publication
            </Button>
          )}
          {pendingState === 'failed' && (
            <Button
              disabled={busy}
              onClick={() => {
                localStorage.removeItem(pendingKey);
                setPending(null);
                setReviewed(false);
              }}
            >
              Review changes again
            </Button>
          )}
        </section>
      ) : (
        <>
          <section aria-label="Selected website changes">
            <h2 ref={heading} tabIndex={-1}>
              {reviewed ? 'Ready to publish' : `Selected changes (${selection.length}/20)`}
            </h2>
            {selection.length > 0 ? (
              <>
                <ul>
                  {selection.map((item) => (
                    <li key={key(item)}>
                      <a href={editUrl(item)}>{item.title}</a>
                      <span>{contentSections[item.collection as ContentSection]}</span>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => select(selection.filter((entry) => key(entry) !== key(item)))}
                        aria-label={`Remove ${item.title} from publication`}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button disabled={busy} onClick={() => void (reviewed ? publish() : review())}>
                  {busy
                    ? 'Checking…'
                    : reviewed
                      ? selection.length === 1
                        ? 'Publish change'
                        : `Publish selected changes (${selection.length})`
                      : 'Review selection'}
                </Button>
              </>
            ) : (
              <p>No changes selected. Other drafts will stay private.</p>
            )}
          </section>
          <div className="website-changes-toolbar">
            <label>
              Find a change
              <input type="search" value={query} onChange={(event) => browse(event.target.value, scope)} />
            </label>
            <label>
              Area
              <select value={scope} onChange={(event) => browse(query, event.target.value)}>
                <option value="all">Website and catalog</option>
                <option value="website">Website</option>
                <option value="catalog">Catalog</option>
              </select>
            </label>
            <Button
              variant="outline"
              disabled={busy || loading || selection.length === 20}
              onClick={() =>
                void add(
                  items.filter(
                    (item) =>
                      item.publicationState !== 'pending' &&
                      getContentValidation(item.collection as ContentSection, item.data).valid,
                  ),
                )
              }
            >
              Select ready changes on this page
            </Button>
          </div>
          {loading && <p role="status">Loading changes…</p>}
          <div aria-busy={loading} className="website-change-list">
            {items.map((item) => {
              const validation = getContentValidation(item.collection as ContentSection, item.data);
              const selected = selection.some((entry) => key(entry) === key(item));
              const updating = item.publicationState === 'pending';
              return (
                <article key={key(item)}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${title(item)} for publication`}
                    checked={selected}
                    disabled={
                      busy || loading || updating || !validation.valid || (!selected && selection.length === 20)
                    }
                    onChange={() =>
                      selected ? select(selection.filter((entry) => key(entry) !== key(item))) : void add([item])
                    }
                  />
                  <div>
                    <a href={editUrl(item)}>
                      <strong>{title(item)}</strong>
                    </a>
                    <p>
                      {contentSections[item.collection as ContentSection]} ·{' '}
                      {updating
                        ? 'Updating website…'
                        : item.publicationState === 'draft'
                          ? 'Draft'
                          : 'Unpublished changes'}
                    </p>
                    {!updating && <p>{validation.valid ? 'Ready for review' : blockers(validation)}</p>}
                    {!validation.valid && <a href={editUrl(item)}>Finish editing</a>}
                    {item.selling && (
                      <p>
                        Website details only. Price, stock and shop availability stay unchanged.{' '}
                        <a href={`${editUrl(item)}&tab=selling`}>Selling</a>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!loading && !items.length && (
            <p>
              {next
                ? 'No unpublished changes in this part of the catalog. Continue to check more.'
                : 'No more website changes to review.'}
            </p>
          )}
          <nav aria-label="Changes pages">
            <Button
              variant="outline"
              disabled={loading || pages.length < 2}
              onClick={() => browse(query, scope, pages.at(-2), pages.slice(0, -1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={loading || !next}
              onClick={() => browse(query, scope, next, [...pages, next!])}
            >
              Next
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
