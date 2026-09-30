import { useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Trash2, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { staffPages, writeStaffLocation } from '../../lib/staff-navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TextureButton } from '../ui/texture-button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  editorialRequest,
  EditorialApiError,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';
import { readStaffQuery, useStaffRead } from '../../lib/staff-query';
import { contentSections, type ContentSection } from '../../lib/content-sections';
import { scrollWithLenis } from '../../lib/lenis-scroll';
import { describePrice, formatEuro } from '../../lib/item-commerce';
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
const canDiscardSavedChanges = (item: EditorialRecord) =>
  Boolean(
    item.collection &&
    !item.selling &&
    ((item.liveRevisionId && item.draftRevisionId && item.publicationState === 'changes') ||
      (item.publicationState === 'draft' &&
        !item.liveRevisionId &&
        ['artists', 'releases', 'news', 'socials'].includes(item.collection))),
  );
type CurrentEditorialDocument = { item: EditorialRecord; _rev: string };
type DiscardCandidate = { document: CurrentEditorialDocument; record: EditorialRecord };

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
  const [priceDraftsUnavailable, setPriceDraftsUnavailable] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [discardCandidates, setDiscardCandidates] = useState<DiscardCandidate[]>([]);
  const [discardBusyKey, setDiscardBusyKey] = useState('');
  const discardBusy = useRef(false);
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
      let draftsUnavailable = false;
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
        draftsUnavailable ||= !!result.priceDraftsUnavailable;
        continuation = result.nextCursor;
      } while (continuation && found.length < 25);
      setItems(found);
      setPriceDraftsUnavailable(draftsUnavailable);
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

  async function prepareDiscard(entries: PublicationSelectionItem[] | 'all') {
    if (discardBusy.current || discardCandidates.length) return;
    discardBusy.current = true;
    setDiscardBusyKey('preparing');
    try {
      let selected = entries;
      if (selected === 'all') {
        selected = [];
        let continuation: string | undefined;
        const seen = new Set<string>();
        do {
          const params = new URLSearchParams({ view: 'changes', scope: 'all', limit: '25' });
          if (continuation) params.set('cursor', continuation);
          const page = await editorialRequest<EditorialList<EditorialRecord>>(base, `blackbox/workspace?${params}`);
          selected.push(
            ...page.items.map((item) => ({
              collection: item.collection!,
              recordId: item.id,
              expectedRevision: 'review-required',
              title: title(item),
            })),
          );
          continuation = page.nextCursor;
          if (selected.length > 100 || seen.size >= 100 || (continuation && seen.has(continuation)))
            throw new Error('Too many changes for one discard. Select up to 20 changes at a time.');
          if (continuation) seen.add(continuation);
        } while (continuation);
      }
      if (!selected.length) {
        setError('There are no changes to discard.');
        return;
      }
      const candidates: DiscardCandidate[] = [];
      for (const entry of selected) {
        const [document, workspace] = await Promise.all([
          editorialRequest<CurrentEditorialDocument>(
            base,
            `content/${entry.collection}/${encodeURIComponent(entry.recordId)}`,
          ),
          editorialRequest<EditorialList<EditorialRecord>>(
            base,
            `blackbox/workspace?collection=${encodeURIComponent(entry.collection)}&id=${encodeURIComponent(entry.recordId)}`,
          ),
        ]);
        const current = workspace.items[0];
        if (!current || !canDiscardSavedChanges(current))
          throw new Error(
            `${entry.title || 'This entry'} cannot be discarded while publishing or linked to selling. Deselect it and retry.`,
          );
        candidates.push({ document, record: current });
      }
      // Remove unpublished releases before their artists; retain each exact reviewed revision.
      candidates.sort((a, b) => Number(a.record.collection === 'artists') - Number(b.record.collection === 'artists'));
      setError('');
      setDiscardCandidates(candidates);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'We could not load the latest saved versions. Retry.');
    } finally {
      discardBusy.current = false;
      setDiscardBusyKey('');
    }
  }

  async function discardSavedChanges() {
    if (!discardCandidates.length || discardBusy.current) return;
    discardBusy.current = true;
    setDiscardBusyKey('discarding');
    const discarded = new Set<string>();
    try {
      for (const candidate of discardCandidates) {
        const collection = candidate.record.collection!;
        const existing = Boolean(candidate.record.liveRevisionId);
        await editorialRequest(
          base,
          `content/${collection}/${encodeURIComponent(candidate.record.id)}${existing ? '/discard-draft' : ''}`,
          { _rev: candidate.document._rev, ...(!existing ? { confirm: true } : {}) },
          existing ? 'POST' : 'DELETE',
        );
        discarded.add(key(candidate.record));
      }
    } catch (error) {
      setError(
        error instanceof EditorialApiError && error.status === 409
          ? `${discarded.size} changes discarded. The next saved version changed; remaining changes were kept.`
          : `${discarded.size} changes discarded. We could not discard the next entry; remaining changes were kept.`,
      );
    } finally {
      setDiscardCandidates([]);
      select(selection.filter((entry) => !discarded.has(key(entry))));
      // Preserve failure feedback while updating the surviving records.
      sequence.current++;
      discardBusy.current = false;
      setDiscardBusyKey('');
      setItems((current) => current.filter((entry) => !discarded.has(key(entry))));
    }
  }

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(location.search);
      setQuery(params.get('q') ?? '');
      setScope(params.get('scope') ?? 'all');
      setCursor(params.get('cursor') ?? '');
      setPages(staffPages(params.get('cursor') ?? ''));
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
    scrollWithLenis(root.current, saved.scroll, { immediate: true });
    scrollWithLenis(null, saved.windowScroll, { immediate: true });
  }, [loading, ready, reviewing]);
  useStaffRead(['website-changes-return', base, query, scope, cursor], list, { enabled: ready && !reviewing });

  function browse(q: string, area: string, page = '', trail = ['']) {
    setQuery(q);
    setScope(area);
    setCursor(page);
    setPages(trail);
    const params = new URLSearchParams({ q, scope: area });
    if (page) params.set('cursor', page);
    writeStaffLocation(`/review/?${params}`, { push: true, pages: trail });
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
      data-staff-scroll
      data-lenis-scroll-root
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
          onPublished={(published) => {
            select(selection.filter((entry) => !published.some((record) => key(record) === key(entry))));
          }}
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
              <Button variant="outline" disabled={Boolean(discardBusyKey)} onClick={() => void list()}>
                <RefreshCw aria-hidden="true" />
                Retry
              </Button>
            </div>
          )}
          <div className="website-changes-toolbar">
            <label>
              Find a change
              <Input
                type="search"
                maxLength={200}
                value={query}
                disabled={Boolean(discardBusyKey)}
                onChange={(event) => browse(event.target.value, scope)}
              />
            </label>
            <label>
              Area
              <select
                value={scope}
                disabled={Boolean(discardBusyKey)}
                onChange={(event) => browse(query, event.target.value)}
              >
                <option value="all">Website and catalog</option>
                <option value="website">Website</option>
                <option value="catalog">Catalog</option>
              </select>
            </label>
            <Button
              variant="outline"
              disabled={loading || Boolean(discardBusyKey) || selection.length === 20}
              onClick={() =>
                add(
                  items.filter(
                    (item) =>
                      item.publicationState !== 'pending' &&
                      item.publicationState !== 'published' &&
                      getContentValidation(item.collection as ContentSection, item.data).valid,
                  ),
                )
              }
            >
              <CheckCheck aria-hidden="true" />
              Select ready changes on this page
            </Button>
            <Button
              variant="outline"
              disabled={loading || Boolean(discardBusyKey)}
              onClick={() => void prepareDiscard('all')}
            >
              <Trash2 aria-hidden="true" />
              Discard all changes
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
                      disabled={Boolean(discardBusyKey)}
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
          {priceDraftsUnavailable && (
            <p role="status" className="cms-state-warning">
              Price drafts could not be checked. Items with only a price change may be missing; open an item to see its
              price.
            </p>
          )}
          <div aria-busy={loading} className="website-change-list">
            {items.map((item) => {
              const validation = getContentValidation(item.collection as ContentSection, item.data);
              const selected = selection.some((entry) => key(entry) === key(item));
              const updating = item.publicationState === 'pending';
              // Price drafts publish from the item's own review, which applies the price command.
              const priceOnly = item.publicationState === 'published' && !!item.priceDraft;
              const href = `/content/?${new URLSearchParams({ collection: item.collection!, id: item.id })}`;
              return (
                <article key={key(item)}>
                  <Checkbox
                    aria-label={`Select ${title(item)} for publication`}
                    checked={selected}
                    disabled={
                      loading ||
                      Boolean(discardBusyKey) ||
                      updating ||
                      priceOnly ||
                      (!selected && selection.length === 20)
                    }
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
                        : priceOnly
                          ? 'Price change only'
                          : item.publicationState === 'draft'
                            ? 'New entry'
                            : 'Unpublished changes'}
                    </p>
                    {item.priceDraft && (
                      <p className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="cms-state-warning border-current">
                          Price not live yet
                        </Badge>
                        <span>
                          {typeof item.selling?.amountMinor === 'number' &&
                            `${formatEuro(item.selling.amountMinor)} → `}
                          {describePrice(item.priceDraft.price)}
                        </span>
                        <a href={`${href}&tab=selling`}>Publish from the item</a>
                      </p>
                    )}
                    {!updating && !priceOnly && (
                      <p className={validation.valid ? 'text-muted-foreground' : 'cms-state-warning'}>
                        {validation.valid ? 'Ready for review' : 'Needs details before publishing'}
                      </p>
                    )}
                    {!validation.valid && <a href={href}>Finish editing</a>}
                    {canDiscardSavedChanges(item) && (
                      <Button
                        variant="outline"
                        disabled={loading || Boolean(discardBusyKey)}
                        onClick={() =>
                          void prepareDiscard([
                            {
                              collection: item.collection!,
                              recordId: item.id,
                              expectedRevision: 'review-required',
                              title: title(item),
                            },
                          ])
                        }
                      >
                        {discardBusyKey === key(item) ? 'Loading saved version…' : 'Discard saved changes'}
                      </Button>
                    )}
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
              disabled={loading || Boolean(discardBusyKey) || pages.length < 2}
              onClick={() => browse(query, scope, pages.at(-2), pages.slice(0, -1))}
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={loading || Boolean(discardBusyKey) || !next}
              onClick={() => browse(query, scope, next, [...pages, next!])}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
          <footer className="publication-action-bar">
            <div>
              <strong>{selection.length}/20 changes selected</strong>
              <p className="text-sm text-muted-foreground">Review the differences before publishing.</p>
            </div>
            <Button
              variant="outline"
              disabled={!selection.length || Boolean(discardBusyKey)}
              onClick={() => void prepareDiscard(selection)}
            >
              <Trash2 aria-hidden="true" />
              Discard selected changes
            </Button>
            <TextureButton disabled={!selection.length || Boolean(discardBusyKey)} onClick={() => setReviewing(true)}>
              <ClipboardCheck aria-hidden="true" />
              Review selected changes
            </TextureButton>
          </footer>
        </>
      )}
      <AlertDialog
        open={discardCandidates.length > 0}
        onOpenChange={(open) => {
          if (!open && !discardBusy.current) setDiscardCandidates([]);
        }}
      >
        <AlertDialogContent className="cms-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Discard {discardCandidates.length} {discardCandidates.length === 1 ? 'change' : 'changes'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Published entries return to their live version. New entries move to trash. The public site stays
              unchanged.
            </AlertDialogDescription>
            <ul className="max-h-60 overflow-y-auto text-sm">
              {discardCandidates.map(({ record }) => (
                <li key={key(record)}>
                  {title(record)} · {record.liveRevisionId ? 'Restore live version' : 'Move new draft to trash'}
                </li>
              ))}
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(discardBusyKey)}>Keep saved changes</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(discardBusyKey)}
              onClick={(event) => {
                event.preventDefault();
                void discardSavedChanges();
              }}
            >
              {discardBusyKey ? 'Discarding…' : 'Discard changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
