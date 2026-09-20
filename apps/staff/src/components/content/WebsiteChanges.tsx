import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import {
  editorialRequest,
  EditorialApiError,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';
import { readStaffQuery, useStaffRead } from '../../lib/staff-query';
import { contentSections, type ContentSection } from '../../lib/content-sections';
import { getContentValidation } from './content-validation';
import {
  readSelection,
  saveSelection,
  restorePublication,
  type PublicationSelectionItem,
} from './publication-selection';
import PublicationReviewFlow, { PublicationSteps } from './PublicationReviewFlow';

const key = (item: { collection?: string; id?: string; recordId?: string }) =>
  `${item.collection}/${item.recordId ?? item.id}`;
const title = (item: EditorialRecord) =>
  String(item.data.title || item.data.label_name || contentSections[item.collection as ContentSection] || 'Untitled');

export default function WebsiteChanges({ base }: { base: string }) {
  const [items, setItems] = useState<EditorialRecord[]>([]);
  const [selection, setSelection] = useState<PublicationSelectionItem[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [pages, setPages] = useState<string[]>(['']);
  const [cursor, setCursor] = useState('');
  const [next, setNext] = useState<string>();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const sequence = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const restorePosition = useRef(true);
  function select(value: PublicationSelectionItem[]) {
    try {
      setSelection(saveSelection(base, value));
    } catch {
      setError('This browser cannot remember your selection. Allow session storage and retry.');
    }
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
    } catch (error) {
      if (request !== sequence.current) return;
      if (error instanceof EditorialApiError && [401, 403].includes(error.status)) {
        setItems([]);
        setSelection([]);
      }
      setError('Website changes could not be loaded. Retry to continue.');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(location.search);
      setQuery(params.get('q') ?? '');
      setScope(params.get('scope') ?? 'all');
      setCursor(params.get('cursor') ?? '');
      setPages(history.state?.reviewPages ?? ['']);
      restorePosition.current = true;
    };
    restore();
    try {
      setSelection(readSelection(base));
      if (restorePublication(base)) setReviewing(true);
    } catch {
      setError('Saved selection or publication could not be restored. Check publication history before continuing.');
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
    if (!ready || reviewing) return;
    const timer = setTimeout(() => void list(), 300);
    return () => {
      clearTimeout(timer);
      sequence.current++;
    };
  }, [ready, query, scope, cursor, reviewing]);
  useEffect(() => {
    if (loading || !ready || reviewing || !restorePosition.current) return;
    restorePosition.current = false;
    const saved = history.state?.reviewPosition;
    if (!saved || !root.current) return;
    [...root.current.querySelectorAll<HTMLAnchorElement>('a')]
      .find((link) => link.href === saved.href)
      ?.focus({ preventScroll: true });
    root.current.scrollTop = saved.scroll;
    window.scrollTo(0, saved.windowScroll);
  }, [loading, ready, reviewing]);
  useStaffRead(['website-changes-return', base, query, scope, cursor], list, { enabled: ready && !reviewing });
  function browse(q: string, area: string, page = '', trail = ['']) {
    setQuery(q);
    setScope(area);
    setCursor(page);
    setPages(trail);
    const params = new URLSearchParams({ q, scope: area });
    if (page) params.set('cursor', page);
    history.pushState({ reviewPages: trail }, '', `/review/?${params}`);
  }
  function add(entries: EditorialRecord[]) {
    select([
      ...selection,
      ...entries
        .filter((item) => !selection.some((chosen) => key(chosen) === key(item)))
        .slice(0, 20 - selection.length)
        .map((item) => ({
          collection: item.collection!,
          recordId: item.id,
          expectedRevision: 'review-required',
          title: title(item),
        })),
    ]);
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
      {reviewing ? (
        <PublicationReviewFlow
          base={base}
          records={selection}
          onReviewed={(review) => select(review.entries)}
          onPublished={(published) =>
            select(selection.filter((entry) => !published.some((record) => key(record) === key(entry))))
          }
          onBack={() => {
            setReviewing(false);
            requestAnimationFrame(() => heading.current?.focus());
          }}
        />
      ) : (
        <>
          <header className="publication-heading">
            <div>
              <h1 ref={heading} tabIndex={-1}>
                Review website changes
              </h1>
              <p className="text-muted-foreground">
                Choose which saved changes to publish together. Other drafts stay private.
              </p>
            </div>
          </header>
          <PublicationSteps step={1} />
          {error && (
            <div role="alert" className="publication-issues">
              <p>{error}</p>
              <Button variant="outline" onClick={() => void list()}>
                Retry
              </Button>
            </div>
          )}
          <div className="website-changes-toolbar">
            <label>
              Find a change
              <Input type="search" value={query} onChange={(event) => browse(event.target.value, scope)} />
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
              disabled={loading || selection.length === 20}
              onClick={() =>
                add(
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
          {selection.length > 0 && (
            <details className="publication-selected">
              <summary>{selection.length} selected across pages</summary>
              <ul>
                {selection.map((entry) => (
                  <li key={key(entry)}>
                    {entry.title}
                    <Button
                      variant="ghost"
                      aria-label={`Remove ${entry.title} from publication`}
                      onClick={() => select(selection.filter((item) => key(item) !== key(entry)))}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {loading && (
            <div role="status">
              <span>Loading changes…</span>
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          <div aria-busy={loading} className="website-change-list">
            {items.map((item) => {
              const validation = getContentValidation(item.collection as ContentSection, item.data);
              const selected = selection.some((entry) => key(entry) === key(item));
              const updating = item.publicationState === 'pending';
              const href = `/content/?${new URLSearchParams({ collection: item.collection!, id: item.id })}`;
              return (
                <article key={key(item)}>
                  <Checkbox
                    aria-label={`Select ${title(item)} for publication`}
                    checked={selected}
                    disabled={loading || updating || !validation.valid || (!selected && selection.length === 20)}
                    onCheckedChange={() =>
                      selected ? select(selection.filter((entry) => key(entry) !== key(item))) : add([item])
                    }
                  />
                  <div>
                    <a href={href}>
                      <strong>{title(item)}</strong>
                    </a>
                    <p>
                      {contentSections[item.collection as ContentSection]} ·{' '}
                      {updating
                        ? 'Updating website…'
                        : item.publicationState === 'draft'
                          ? 'New entry'
                          : 'Unpublished changes'}
                    </p>
                    {!updating && (
                      <p className={validation.valid ? 'text-muted-foreground' : 'cms-state-warning'}>
                        {validation.valid ? 'Ready for review' : 'Needs details before publishing'}
                      </p>
                    )}
                    {!validation.valid && <a href={href}>Finish editing</a>}
                    {!validation.valid && (
                      <ul>
                        {validation.issues.map((issue, index) => (
                          <li key={index}>{issue.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!loading && !items.length && (
            <p>{query ? 'No changes match this search.' : 'No more website changes to review.'}</p>
          )}
          <nav aria-label="Changes pages" className="flex gap-2">
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
          <footer className="publication-action-bar">
            <div>
              <strong>{selection.length}/20 changes selected</strong>
              <p className="text-sm text-muted-foreground">Review the differences before publishing.</p>
            </div>
            <Button disabled={!selection.length} onClick={() => setReviewing(true)}>
              Review selected changes
            </Button>
          </footer>
        </>
      )}
    </div>
  );
}
