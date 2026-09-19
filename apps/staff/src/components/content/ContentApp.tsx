import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, EyeOff, FileText, History, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Table, TableBody, TableRow, TableCell } from '../ui/table';
import CatalogSelling from '../items/CatalogSelling';
import FormatFilter, { formatLabel } from '../items/FormatFilter';
import WebsitePages from '../WebsitePages';
import { useDraftAutosave } from '../../hooks/use-draft-autosave';
import { readStaffQuery, useStaffRead } from '../../lib/staff-query';

import { Skeleton } from '../ui/skeleton';

import { Alert, AlertDescription } from '../ui/alert';
import { Tabs } from 'radix-ui';
import {
  Group as ResizablePanelGroup,
  Panel as ResizablePanel,
  Separator as ResizableHandle,
} from 'react-resizable-panels';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../ui/alert-dialog';

import MediaLibrary from './MediaLibrary';
import ContentFields, {
  contentSections,
  singletonContentSections,
  type ContentSection,
  type ContentData,
} from './ContentFields';
import ContentPreview from './ContentPreview';

import PublicationReviewFlow from './PublicationReviewFlow';
import PublicationHistory from './PublicationHistory';
import PublicationStatus from './PublicationStatus';
import { getContentValidation, type ContentValidation } from './content-validation';
import { readContentPublications, type ContentPublication } from '../../lib/backend/content-publication-api';
import {
  EditorialApiError,
  editorialRequest,
  editorialMediaUrl,
  editorialSlug,
  editorialWriteData,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

type Document = { item: EditorialRecord; _rev: string };
function contentSave(document: Document, data: ContentData) {
  if (!document._rev) throw new Error('Load the saved version before publishing.');
  // The saved slug and identity remain unchanged when the member renames a title.
  return { _rev: document._rev, data: editorialWriteData(data) };
}

export default function ContentApp({ backendBaseUrl: base }: { backendBaseUrl: string }) {
  const [focusedPath, setFocusedPath] = useState('');
  const [catalogTab, setCatalogTab] = useState<'details' | 'selling' | 'stock'>('details');
  const [landing, setLanding] = useState<'pages' | 'footer' | null>(null);
  const [collection, setCollection] = useState<ContentSection>('artists');
  const [items, setItems] = useState<EditorialRecord[]>([]);
  const listSequence = useRef(0);
  const [cursor, setCursor] = useState<string>();
  const [query, setQuery] = useState('');
  const [catalogArea, setCatalogArea] = useState('all');
  const [format, setFormat] = useState('');
  const [sort, setSort] = useState('title');
  const [pageCursors, setPageCursors] = useState<string[]>(['']);
  const pageCursor = useRef('');
  const browseKey = useRef('');
  const [media, setMedia] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const reloadFocus = useRef<HTMLElement | null>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const listFocus = useRef<HTMLElement | null>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  function updateUrl(section: ContentSection, id?: string, mediaView = false) {
    const params = new URLSearchParams({ collection: section });
    if (section === collection) {
      if (query) params.set('q', query);
      if (catalogArea !== 'all') params.set('area', catalogArea);
      if (format) params.set('format', format);
      if (sort !== 'title') params.set('sort', sort);
      if (pageCursor.current) params.set('cursor', pageCursor.current);
    }
    if (id) params.set('id', id);
    if (mediaView) params.set('view', 'media');
    const next = `${window.location.pathname}?${params}`;
    if (next !== window.location.pathname + window.location.search)
      window.history.pushState({ catalogPages: pageCursors }, '', next);
    window.dispatchEvent(new Event('staff:navigation'));
  }
  useEffect(() => {
    if (mobileEditor && !media) editorHeading.current?.focus();
  }, [mobileEditor, media]);
  const [document, setDocument] = useState<Document | null>(null);
  const [data, setData] = useState<ContentData>({});
  const [dirty, setDirty] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [confirmReload, setConfirmReload] = useState(false);
  const [busy, setIsBusy] = useState(false);
  const busyFocus = useRef<HTMLElement | null>(null);
  function setBusy(value: boolean) {
    if (value) busyFocus.current = window.document.activeElement as HTMLElement | null;
    setIsBusy(value);
  }
  useEffect(() => {
    if (busy) return;
    if (busyFocus.current?.isConnected && window.document.activeElement === window.document.body) {
      busyFocus.current.focus();
    }
    busyFocus.current = null;
  }, [busy]);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [desktopPreview, setDesktopPreview] = useState(false);
  const [previewScroll, setPreviewScroll] = useState({ key: '', x: 0, y: 0 });
  useEffect(() => {
    try {
      setDesktopPreview(localStorage.getItem('blackbox-content-preview') !== 'closed');
    } catch {
      /* Optional preference. */
    }
  }, []);
  function togglePreview() {
    if (desktopPreview) {
      const contentWindow = window.document.querySelector<HTMLIFrameElement>(
        'iframe[title="Private site appearance preview"]',
      )?.contentWindow;
      if (contentWindow) {
        setPreviewScroll({
          key: document ? `${collection}:${document.item.id || document.item.slug}` : '',
          x: contentWindow.scrollX,
          y: contentWindow.scrollY,
        });
      }
    }
    const next = !desktopPreview;
    setDesktopPreview(next);
    try {
      localStorage.setItem('blackbox-content-preview', next ? 'open' : 'closed');
    } catch {
      /* Optional preference. */
    }
  }
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const change = () => {
      setWide(media.matches);
      if (!media.matches) setPreview(false);
    };
    change();
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const [pendingNew, setPendingNew] = useState<ContentData | null>(null);
  const [publications, setPublications] = useState<ContentPublication[]>([]);
  const [publicationMessage, setPublicationMessage] = useState('');
  const [publicationStatusError, setPublicationStatusError] = useState('');
  const refreshedPublication = useRef('');
  const pendingKey = `blackbox-content-create:${base}`;
  const [publicationHistoryOpen, setPublicationHistoryOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [draftActionsOpen, setDraftActionsOpen] = useState(false);
  function openPublicationSurface() {
    setDraftActionsOpen(false);
    setTimeout(() => setPublicationHistoryOpen(true), 0);
  }
  const validation: ContentValidation = getContentValidation(collection, data);

  function focusFirstInvalid(result = validation) {
    const path = result.firstPath;
    const controls = [...window.document.querySelectorAll<HTMLElement>('[data-content-path]')];
    const target = path
      ? (controls.find((control) => control.dataset.contentPath === path) ??
        controls.find((control) => path.startsWith(`${control.dataset.contentPath}.`)))
      : controls[0];
    if (!target) return;
    let parent = target.parentElement;
    while (parent) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
      parent = parent.parentElement;
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'center' });
  }

  function requireValidContent(result = validation) {
    if (result.valid) return true;
    setValidationAttempt((attempt) => attempt + 1);
    setMessage('');
    requestAnimationFrame(() => focusFirstInvalid(result));
    return false;
  }

  async function publicationStatus() {
    try {
      const result = await readContentPublications(base);
      setPublications(result.items);
      setPublicationStatusError('');
      setPublicationMessage(result.items.length ? '' : 'No publication requests yet.');
      const latest = result.items[0];
      if (latest && latest.status !== 'pending' && latest.id !== refreshedPublication.current && document?.item.id) {
        const loaded = await editorialRequest<Document>(
          base,
          `content/${collection}/${encodeURIComponent(document.item.id)}`,
        );
        const summary = await editorialRequest<EditorialList<EditorialRecord>>(
          base,
          `blackbox/workspace?collection=${collection}&id=${encodeURIComponent(loaded.item.id)}`,
        );
        setDocument((current) =>
          current?.item.id === loaded.item.id
            ? {
                ...current,
                ...(JSON.stringify(editorialWriteData(current.item.data)) ===
                JSON.stringify(editorialWriteData(loaded.item.data))
                  ? { _rev: loaded._rev }
                  : {}),
                item: {
                  ...current.item,
                  publicationState: summary.items[0]?.publicationState,
                  selling: summary.items[0]?.selling,
                },
              }
            : current,
        );

        refreshedPublication.current = latest.id;
      }
    } catch {
      setPublicationStatusError('Publication status is unavailable. Check again before assuming a change is live.');
    }
  }
  async function list(section = collection, next = pageCursor.current, search = query) {
    const sequence = ++listSequence.current;
    if (!document) setBusy(true);
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (search.trim()) params.set('q', search.trim());
      if (next) params.set('cursor', next);
      const locationParams = new URLSearchParams(window.location.search);
      const initial = !ready;
      if (initial && locationParams.get('q')) params.set('q', locationParams.get('q')!);
      const areaValue = initial ? (locationParams.get('area') ?? 'all') : catalogArea;
      const formatValue = initial ? (locationParams.get('format') ?? '') : format;
      const sortValue = initial ? (locationParams.get('sort') ?? 'title') : sort;
      params.set('sort', sortValue);
      if (section === 'distro') {
        params.set('area', areaValue);
        if (formatValue) params.set('format', formatValue);
      }
      const page = await readStaffQuery(['catalog-page', base, section, params.toString()], () =>
        editorialRequest<EditorialList<EditorialRecord>>(base, `blackbox/workspace?collection=${section}&${params}`),
      );
      if (sequence !== listSequence.current) return null;
      setItems(page.items);
      pageCursor.current = next;
      const url = new URL(window.location.href);
      if (next) url.searchParams.set('cursor', next);
      else url.searchParams.delete('cursor');
      window.history.replaceState(window.history.state, '', url);
      setCursor(page.nextCursor);
      return page;
    } catch {
      setMessage('We could not load these entries. Try again.');
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setReady(true);
    const listParams = new URLSearchParams(window.location.search);
    setQuery(listParams.get('q') ?? '');
    setCatalogArea(listParams.get('area') ?? 'all');
    setFormat(listParams.get('format') ?? '');
    setSort(listParams.get('sort') ?? 'title');
    pageCursor.current = listParams.get('cursor') ?? '';
    if (Array.isArray(window.history.state?.catalogPages)) setPageCursors(window.history.state.catalogPages);
    browseKey.current = JSON.stringify([
      listParams.get('q') ?? '',
      listParams.get('area') ?? 'all',
      listParams.get('format') ?? '',
      listParams.get('sort') ?? 'title',
    ]);
    void publicationStatus();
    const pending = sessionStorage.getItem(pendingKey);
    if (pending) {
      try {
        const saved = JSON.parse(pending) as { collection: ContentSection; slug: string; data: ContentData };
        if (!['news', 'socials', 'artists'].includes(saved.collection)) throw new Error('Unsupported section');
        setCollection(saved.collection);
        setDocument({ item: { id: '', slug: saved.slug, data: saved.data }, _rev: '' });
        setData(saved.data);
        setPendingNew(saved.data);
        setDirty(true);
        setMobileEditor(true);
        setMessage('Check the last save before creating another entry.');
        void list(saved.collection);
      } catch {
        setMessage('The last save could not be read. Ask a label administrator for help.');
      }
    } else {
      const selected = new URLSearchParams(window.location.search);
      if (selected.has('history')) setPublicationHistoryOpen(true);
      if (window.location.pathname.startsWith('/items/')) {
        const variantId = selected.get('variantId');
        if (variantId) {
          void editorialRequest<EditorialList<EditorialRecord>>(
            base,
            `blackbox/workspace?variantId=${encodeURIComponent(variantId)}`,
          )
            .then((page) => {
              const item = page.items[0];
              if (!item) throw new Error('This catalog entry is unavailable.');
              window.location.replace(`/content/?collection=${item.collection}&id=${encodeURIComponent(item.id)}`);
            })
            .catch((error) => setMessage(error.message));
          return;
        }
        selected.set('collection', 'releases');
      }
      if (!selected.has('collection') && selected.get('view') !== 'media') {
        setLanding(selected.get('view') === 'footer' ? 'footer' : 'pages');
        return;
      }
      const mediaView = selected.get('view') === 'media';
      setMedia(mediaView);
      const section = selected.get('collection');
      const id = selected.get('id');
      if (selected.get('tab') === 'selling') setCatalogTab('selling');
      if (section && Object.hasOwn(contentSections, section)) {
        const contentSection = section as ContentSection;
        setCollection(contentSection);
        const listed = list(contentSection);
        if (contentSection === 'artists' && selected.get('new') === '1' && !id) {
          void create('artists');
          return;
        }
        if (id)
          void editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(id)}`)
            .then((loaded) => {
              void editorialRequest<EditorialList<EditorialRecord>>(
                base,
                `blackbox/workspace?collection=${section}&id=${encodeURIComponent(id)}`,
              )
                .then((page) =>
                  setDocument((current) =>
                    current?.item.id === id
                      ? {
                          ...current,
                          item: {
                            ...current.item,
                            selling: page.items[0]?.selling,
                            publicationState: page.items[0]?.publicationState,
                            collection: section,
                          },
                        }
                      : current,
                  ),
                )
                .catch(() => setMessage('Website status is unavailable. Reopen this entry to try again.'));
              setDocument(loaded);
              setData(loaded.item.data);
              setMobileEditor(true);
            })
            .catch(() => setMessage('The selected content could not be loaded. Search to try again.'));
        else if (!mediaView)
          void listed.then((page) => {
            openSingletonFromPage(contentSection, page);
          });
      } else void list();
    }
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function mayLeave() {
    if (!dirty) return true;
    reloadFocus.current = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    setConfirmReload(true);
    return false;
  }
  function requestDiscard(trigger: HTMLElement | null = window.document.activeElement as HTMLElement | null) {
    reloadFocus.current = trigger;
    setConfirmReload(true);
  }
  async function discardChanges() {
    const current = document;
    const focusTarget = reloadFocus.current ?? editorHeading.current;
    setConfirmReload(false);
    if (!current) return;
    if (!current.item.id) {
      try {
        sessionStorage.removeItem(pendingKey);
      } catch {
        /* Storage can be disabled. */
      }
      setPendingNew(null);
      setDocument(null);
      setData({});
      setDirty(false);
      setValidationAttempt(0);
      setConflict(false);
      setMobileEditor(false);
      updateUrl(collection);
      requestAnimationFrame(() => listHeading.current?.focus());
    } else {
      await open(current.item, true);
    }
    requestAnimationFrame(() => {
      if (focusTarget?.isConnected) focusTarget.focus();
      else listHeading.current?.focus();
      reloadFocus.current = null;
    });
  }
  async function open(item: EditorialRecord, replace = false, section = collection) {
    if (!replace && !(await autosave.flush())) {
      setConfirmReload(true);
      return;
    }
    if (!replace) listFocus.current = window.document.activeElement as HTMLElement;
    setBusy(true);
    setMessage('');
    try {
      const loaded = await editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(item.id)}`);
      setDocument({
        ...loaded,
        item: { ...loaded.item, selling: item.selling, publicationState: item.publicationState, collection: section },
      });
      setCatalogTab('details');
      setData(loaded.item.data);
      setDirty(false);
      setValidationAttempt(0);
      setConflict(false);
      setMobileEditor(true);
      updateUrl(section, loaded.item.id);
      editorHeading.current?.focus();
    } catch {
      setMessage('We could not load this entry. Try again.');
    } finally {
      setBusy(false);
    }
  }
  function openSingletonFromPage(section: ContentSection, page: EditorialList<EditorialRecord> | null) {
    if (!singletonContentSections.includes(section) || page?.items.length !== 1) return;
    const item = page.items[0];
    if (item) void open(item, true, section);
  }
  const currentDocument = useRef(document);
  currentDocument.current = document;
  const latestData = useRef(data);
  latestData.current = data;
  const autosave = useDraftAutosave({
    identity: `${collection}:${document?.item.slug || ''}`,
    value: data,
    dirty,
    enabled: !!document && !busy && !conflict && document.item.publicationState !== 'pending',
    async save(snapshot) {
      const current = currentDocument.current;
      if (!current) return;
      try {
        let result: Document;
        if (current.item.id) {
          result = await editorialRequest<Document>(
            base,
            `content/${collection}/${encodeURIComponent(current.item.id)}`,
            contentSave(current, snapshot),
            'PUT',
          );
        } else {
          const commandData = pendingNew ?? editorialWriteData(snapshot);
          sessionStorage.setItem(
            pendingKey,
            JSON.stringify({ collection, slug: current.item.slug, data: commandData }),
          );
          setPendingNew(commandData);
          try {
            result = await editorialRequest<Document>(base, `content/${collection}/${current.item.slug}`);
          } catch (error) {
            if (!(error instanceof EditorialApiError) || error.status !== 404) throw error;
            result = await editorialRequest<Document>(base, `content/${collection}`, {
              slug: current.item.slug,
              data: commandData,
            });
          }
          // Native creation has no revision yet; materialize the private revision for exact publication review.
          result = await editorialRequest<Document>(
            base,
            `content/${collection}/${encodeURIComponent(result.item.id)}`,
            { _rev: result._rev, data: editorialWriteData(snapshot) },
            'PUT',
          );
          sessionStorage.removeItem(pendingKey);
          setPendingNew(null);
        }
        currentDocument.current = result;
        result.item = {
          ...result.item,
          selling: current.item.selling,
          collection,
          publicationState:
            current.item.publicationState === 'published' || current.item.publicationState === 'changes'
              ? 'changes'
              : 'draft',
        };
        setDocument(result);
        setItems((previous) => [result.item, ...previous.filter((item) => item.id !== result.item.id)]);
        updateUrl(collection, result.item.id);
      } catch (error) {
        if (error instanceof EditorialApiError && error.status === 409) setConflict(true);
        throw error;
      }
    },
    saved(snapshot) {
      if (JSON.stringify(latestData.current) === JSON.stringify(snapshot)) setDirty(false);
    },
  });
  async function saveNew(event: React.FormEvent) {
    event.preventDefault();
    await autosave.flush();
  }
  useEffect(() => {
    const leave = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
      if (
        !link ||
        link.origin !== location.origin ||
        link.target ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.button !== 0 ||
        !dirty
      )
        return;
      event.preventDefault();
      void autosave.flush().then((saved) => {
        if (saved) location.assign(link.href);
        else setConfirmReload(true);
      });
    };
    window.document.addEventListener('click', leave, true);
    return () => window.document.removeEventListener('click', leave, true);
  }, [dirty, autosave.flush]);
  useEffect(() => {
    const followHistory = () => {
      void autosave.flush().then(async (saved) => {
        if (!saved) {
          setConfirmReload(true);
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const section = params.get('collection') as ContentSection;
        if (!section || !Object.hasOwn(contentSections, section)) {
          setLanding(params.get('view') === 'footer' ? 'footer' : 'pages');
          return;
        }
        setLanding(null);
        setCollection(section);
        const id = params.get('id');
        if (!id) {
          setDocument(null);
          setMobileEditor(false);
          requestAnimationFrame(() =>
            (listFocus.current?.isConnected ? listFocus.current : listHeading.current)?.focus(),
          );
          return;
        }
        try {
          const page = await editorialRequest<EditorialList<EditorialRecord>>(
            base,
            `blackbox/workspace?collection=${section}&id=${encodeURIComponent(id)}`,
          );
          if (page.items[0]) await open(page.items[0], true, section);
        } catch {
          setMessage('This entry could not be loaded. Your saved draft is retained.');
        }
      });
    };
    window.addEventListener('popstate', followHistory);
    return () => window.removeEventListener('popstate', followHistory);
  }, [autosave.flush, collection]);
  useStaffRead(['content', base, collection, query, catalogArea, format, sort], () => list(), {
    enabled: ready && !dirty && !media && !landing && !document && !busy,
  });
  useEffect(() => {
    if (!ready || dirty || landing || media) return;
    const key = JSON.stringify([query, catalogArea, format, sort]);
    if (key === browseKey.current) return;
    const timer = window.setTimeout(() => {
      browseKey.current = key;
      pageCursor.current = '';
      setPageCursors(['']);
      const url = new URL(window.location.href);
      for (const [key, value] of Object.entries({ q: query, area: catalogArea, format, sort })) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      url.searchParams.delete('cursor');
      window.history.replaceState(window.history.state, '', url);
      void list(collection, '');
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, catalogArea, format, sort]);
  useEffect(() => {
    if (ready)
      window.history.replaceState({ ...window.history.state, catalogPages: pageCursors }, '', window.location.href);
  }, [pageCursors, ready]);
  async function create(section = collection) {
    if (!mayLeave() || !['news', 'socials', 'artists'].includes(section)) return;
    // Start locally; incomplete editorial work is saved privately.
    setDocument({ item: { id: '', slug: editorialSlug(section, crypto.randomUUID()), data: {} }, _rev: '' });
    setData(
      section === 'artists'
        ? { title: '', genre: '', bio: '', image: null, image_alt: '', profile_links: [], videos: [] }
        : section === 'news'
          ? { title: '', date: '', summary: '', image: null, image_alt: '', body: [] }
          : { title: '', url: '', order: 0 },
    );
    setDirty(true);
    setValidationAttempt(0);
    setConflict(false);
    setMessage('');
    setMobileEditor(true);
    updateUrl(section);
  }
  async function remove() {
    if (!document?.item.id || busy || !['news', 'socials'].includes(collection)) return;
    setConfirmTrash(false);
    setBusy(true);
    try {
      await editorialRequest(
        base,
        `content/${collection}/${encodeURIComponent(document.item.id)}`,
        { _rev: document._rev, confirm: true },
        'DELETE',
      );
      setItems((items) => items.filter((item) => item.id !== document.item.id));
      setDocument(null);
      setDirty(false);
      setValidationAttempt(0);
      setMessage('Moved to trash. The public site has not changed.');
      setMobileEditor(false);
      updateUrl(collection);
      listHeading.current?.focus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not confirm the change.');
    } finally {
      setBusy(false);
    }
  }
  async function moveLink(index: number, direction: -1 | 1) {
    const ordered = [...items].sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0));
    const current = ordered[index];
    const adjacent = ordered[index + direction];
    if (!current || !adjacent || busy || cursor || query) return;
    [ordered[index], ordered[index + direction]] = [adjacent, current];
    const destinations = ordered
      .map((item, order) => ({ item, order }))
      .filter(({ item, order }) => Number(item.data.order) !== order);
    setBusy(true);
    setMessage('');
    try {
      for (const destination of destinations) {
        const saved = await editorialRequest<Document>(base, `content/${collection}/${destination.item.id}`);
        await editorialRequest<Document>(
          base,
          `content/${collection}/${destination.item.id}`,
          { _rev: saved._rev, data: { ...editorialWriteData(saved.item.data), order: destination.order } },
          'PUT',
        );
      }
      setMessage('Link order saved privately. Open Review website changes when you are ready to publish.');
    } catch {
      setMessage(
        'The ordering change was not completed. Some changes may be saved privately. Check the list before publishing.',
      );
    } finally {
      await list();
      setBusy(false);
    }
  }
  const canCreate = ['news', 'socials', 'artists'].includes(collection);

  const singleton = singletonContentSections.includes(collection);
  const title = String(data.title || data.label_name || contentSections[collection]);
  if (reviewing && document)
    return (
      <div className="cms-surface staff-page publication-editor">
        <PublicationReviewFlow
          base={base}
          individual
          records={[{ collection, recordId: document.item.id, expectedRevision: document._rev }]}
          onPublished={() => void publicationStatus()}
          onBack={() => {
            setReviewing(false);
            requestAnimationFrame(() => editorHeading.current?.focus());
          }}
        />
      </div>
    );
  if (landing)
    return (
      <>
        <WebsitePages footer={landing === 'footer'} />
        <div className="px-6">
          <PublicationStatus
            items={publications}
            statusError={publicationStatusError}
            message={publicationMessage}
            refresh={publicationStatus}
            open={publicationHistoryOpen}
            onOpenChange={setPublicationHistoryOpen}
            compact
          />
        </div>
      </>
    );
  return (
    <div className="cms-surface cms-workspace">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {media && (
          <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto max-w-6xl">
              <h1 className="text-2xl font-semibold">Images</h1>
              <MediaLibrary base={base} />
            </div>
          </section>
        )}
        <Tabs.Root
          value={preview ? 'preview' : 'edit'}
          onValueChange={(value) => setPreview(value === 'preview')}
          className={`cms-content-panes ${document && mobileEditor ? 'cms-editing' : ''} ${desktopPreview && catalogTab === 'details' ? '' : 'cms-preview-closed'}`}
          hidden={media}
        >
          {document && mobileEditor && (
            <Tabs.List className="cms-editor-tabs" aria-label="Content view">
              <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
              <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
            </Tabs.List>
          )}
          <section
            aria-label={contentSections[collection]}
            className={`cms-records ${mobileEditor ? 'cms-records-mobile-hidden' : ''}`}
          >
            <div className="grid gap-4 border-b border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <h1 ref={listHeading} tabIndex={-1} className="text-base font-semibold outline-none">
                  {contentSections[collection]}
                </h1>
                <Badge variant="secondary">
                  {items.length}
                  {cursor ? '+' : ''}
                </Badge>
              </div>
              <form
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy) void list();
                }}
              >
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <Search aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label={`Search ${contentSections[collection].toLowerCase()}`}
                    placeholder={`Search ${contentSections[collection].toLowerCase()}…`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </InputGroup>
              </form>
              {['artists', 'releases', 'distro', 'news'].includes(collection) && (
                <div className="flex flex-wrap gap-2">
                  {collection === 'distro' && (
                    <>
                      <select
                        aria-label="Catalog area"
                        className="min-h-11 border border-border bg-background p-2"
                        value={catalogArea}
                        onChange={(event) => setCatalogArea(event.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="distro">Distro</option>
                        <option value="merch">Merch</option>
                      </select>
                      <FormatFilter value={format} onChange={setFormat} />
                    </>
                  )}
                  <select
                    aria-label="Sort catalog"
                    className="min-h-11 border border-border bg-background p-2"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="title">Title A–Z</option>
                    <option value="updated">Recently edited</option>
                  </select>
                </div>
              )}
              {['releases', 'distro'].includes(collection) && (
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={`/items/new/?kind=${collection === 'releases' ? 'release' : 'distro'}`}>
                      Add {collection === 'releases' ? 'release' : 'distro'}
                    </a>
                  </Button>
                  {collection === 'distro' && (
                    <Button variant="outline" asChild>
                      <a href="/items/new/?kind=merch">Add merch</a>
                    </Button>
                  )}
                </div>
              )}
              {canCreate && (
                <Button type="button" disabled={!ready || busy || !!pendingNew} onClick={() => void create()}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add {collection === 'news' ? 'news' : collection === 'artists' ? 'artist' : 'social link'}
                </Button>
              )}
              {!mobileEditor && document && (
                <Button type="button" variant="secondary" className="md:hidden" onClick={() => setMobileEditor(true)}>
                  Return to draft
                </Button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!mobileEditor && message && (
                <Alert role={conflict ? 'alert' : 'status'} className="m-4 w-auto">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              {busy && !items.length ? (
                <div className="grid gap-3 p-4" role="status" aria-label="Loading content">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {(['navigation', 'socials'].includes(collection)
                      ? [...items].sort((a, b) => Number(a.data.order ?? 0) - Number(b.data.order ?? 0))
                      : items
                    ).map((item, index) => (
                      <TableRow key={item.id} data-state={document?.item.id === item.id ? 'selected' : undefined}>
                        <TableCell className="p-0">
                          <Button
                            type="button"
                            variant="ghost"
                            className="cms-entry-row h-auto min-h-16 w-full justify-start rounded-none px-4 py-3 text-left whitespace-normal"
                            disabled={!ready || busy || !!pendingNew}
                            aria-current={document?.item.id === item.id ? 'true' : undefined}
                            onClick={() => void open(item)}
                          >
                            {(() => {
                              const artwork = item.data.cover_image ?? item.data.image;
                              const src =
                                artwork && typeof artwork === 'object'
                                  ? editorialMediaUrl(
                                      artwork as Parameters<typeof editorialMediaUrl>[0],
                                      new URL(base || window.location.origin).origin,
                                    )
                                  : '';
                              return src ? (
                                <img src={src} alt="" className="size-12 shrink-0 object-cover" loading="lazy" />
                              ) : (
                                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              );
                            })()}
                            <span className="min-w-0 break-words">
                              {String(item.data.title ?? item.data.label_name ?? contentSections[collection])}
                              {typeof item.data.group === 'string' && (
                                <span className="block text-sm text-muted-foreground">
                                  {formatLabel(item.data.group)}
                                </span>
                              )}
                              {(item.artistTitle || typeof item.data.artist_or_label === 'string') && (
                                <span className="block text-sm text-muted-foreground">
                                  {item.artistTitle || String(item.data.artist_or_label)}
                                </span>
                              )}
                            </span>
                            <span className="cms-entry-summary ml-auto text-sm text-muted-foreground">
                              {item.publicationState === 'published'
                                ? 'On the website'
                                : item.publicationState === 'changes'
                                  ? 'Unpublished changes'
                                  : item.publicationState === 'pending'
                                    ? 'Updating website…'
                                    : 'Draft'}
                              {item.selling && (
                                <>
                                  {' '}
                                  · {item.selling.itemType}
                                  {item.selling.amountMinor !== null && (
                                    <>
                                      {' '}
                                      ·{' '}
                                      {new Intl.NumberFormat('en-GB', {
                                        style: 'currency',
                                        currency: item.selling.currencyCode || 'EUR',
                                      }).format(item.selling.amountMinor / 100)}
                                    </>
                                  )}{' '}
                                  ·{' '}
                                  {item.selling.onlineQuantity === null
                                    ? 'Online quantity unavailable'
                                    : `${item.selling.onlineQuantity} ${item.data.group === 'Clothes' ? 'units' : 'copies'} available to buy online`}
                                </>
                              )}
                            </span>
                          </Button>
                        </TableCell>
                        {['navigation', 'socials'].includes(collection) && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                variant="outline"
                                disabled={busy || !!cursor || !!query || index === 0}
                                onClick={() => void moveLink(index, -1)}
                                aria-label={`Move ${String(item.data.title)} up`}
                              >
                                Move up
                              </Button>
                              <Button
                                variant="outline"
                                disabled={busy || !!cursor || !!query || index === items.length - 1}
                                onClick={() => void moveLink(index, 1)}
                                aria-label={`Move ${String(item.data.title)} down`}
                              >
                                Move down
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!busy && !items.length && (
                <p className="p-6 text-sm text-muted-foreground">No matching content. Try another search.</p>
              )}
              {(cursor || pageCursor.current) && (
                <div className="p-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || !pageCursor.current}
                    onClick={() => {
                      const previous = pageCursors.slice(0, -1);
                      setPageCursors(previous.length ? previous : ['']);
                      void list(collection, previous.at(-1) ?? '');
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy || !cursor}
                    onClick={() => {
                      if (cursor) {
                        setPageCursors((pages) => [...pages, cursor]);
                        void list(collection, cursor);
                      }
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </section>
          <ResizablePanelGroup
            orientation="horizontal"
            className={`cms-editor-split ${preview ? 'is-preview' : 'is-edit'}`}
          >
            <ResizablePanel
              id="editor"
              defaultSize="50%"
              minSize={wide && desktopPreview ? '35%' : '0%'}
              className="cms-edit-panel"
            >
              <Tabs.Content value="edit" forceMount asChild>
                <section
                  aria-label="Content editor"
                  className={`cms-editor ${!mobileEditor ? 'cms-editor-mobile-hidden' : ''}`}
                >
                  {document ? (
                    <>
                      <header className="cms-editor-toolbar">
                        <div className="flex items-center justify-between gap-3">
                          <h1 ref={editorHeading} tabIndex={-1}>
                            {title}
                          </h1>
                          {!singleton && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Back to list"
                              onClick={() => {
                                void autosave.flush().then((saved) => {
                                  if (!saved) {
                                    setConfirmReload(true);
                                    return;
                                  }
                                  setMobileEditor(false);
                                  setDocument(null);
                                  updateUrl(collection);
                                  requestAnimationFrame(() =>
                                    (listFocus.current?.isConnected ? listFocus.current : listHeading.current)?.focus({
                                      preventScroll: true,
                                    }),
                                  );
                                });
                              }}
                            >
                              <ArrowLeft />
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p role="status" className="text-sm text-muted-foreground">
                            {autosave.saving
                              ? 'Saving…'
                              : autosave.error
                                ? 'Not saved'
                                : dirty
                                  ? 'Unsaved changes'
                                  : 'Changes saved'}{' '}
                            ·{' '}
                            {{
                              published: 'On the website',
                              changes: 'Unpublished changes',
                              pending: 'Updating website…',
                              draft: 'Draft',
                            }[document.item.publicationState!] ?? 'Website status unavailable'}
                          </p>
                          <div className="flex items-center gap-2">
                            {autosave.error && (
                              <Button variant="outline" onClick={() => void autosave.flush()}>
                                Retry save
                              </Button>
                            )}
                            {wide && (
                              <Button variant="outline" aria-expanded={desktopPreview} onClick={togglePreview}>
                                {desktopPreview ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}Preview
                              </Button>
                            )}
                            <Button
                              disabled={busy || conflict || autosave.saving}
                              onClick={() => {
                                if (!requireValidContent()) return;
                                void autosave
                                  .flush()
                                  .then((saved) => {
                                    const current = currentDocument.current;
                                    if (!saved || !current?.item.id) return;
                                    setReviewing(true);
                                  })
                                  .catch(() =>
                                    setMessage(
                                      'The review could not be opened. Your saved draft is safe. Allow session storage and retry.',
                                    ),
                                  );
                              }}
                            >
                              Review changes
                            </Button>
                            <DropdownMenu open={draftActionsOpen} onOpenChange={setDraftActionsOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="More draft actions">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="cms-surface" align="end">
                                <DropdownMenuItem onSelect={() => openPublicationSurface()}>
                                  <History />
                                  Publication history
                                </DropdownMenuItem>
                                {dirty && (
                                  <DropdownMenuItem onSelect={() => requestDiscard()}>
                                    Discard unsaved changes
                                  </DropdownMenuItem>
                                )}
                                {['news', 'socials'].includes(collection) && (
                                  <DropdownMenuItem
                                    disabled={!document.item.id || dirty}
                                    onSelect={() => setConfirmTrash(true)}
                                  >
                                    <Trash2 />
                                    Move to trash
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {autosave.error && (
                          <p role="alert" className="text-sm cms-state-error">
                            {autosave.error}
                          </p>
                        )}
                        {publicationHistoryOpen && (
                          <PublicationHistory
                            key={`${collection}/${document.item.id}`}
                            base={base}
                            collection={collection}
                            recordId={document.item.id}
                            initiallyOpen
                          />
                        )}
                      </header>
                      {['releases', 'distro'].includes(collection) && (
                        <div className="flex gap-2 border-b px-4" role="group" aria-label="Catalog details">
                          {(['details', 'selling', 'stock'] as const).map((section) => (
                            <Button
                              key={section}
                              variant={catalogTab === section ? 'secondary' : 'ghost'}
                              aria-pressed={catalogTab === section}
                              onClick={() => setCatalogTab(section)}
                            >
                              {section === 'details' ? 'Details' : section === 'selling' ? 'Selling' : 'Stock'}
                            </Button>
                          ))}
                        </div>
                      )}
                      {catalogTab !== 'details' && (
                        <CatalogSelling item={document.item} base={base} section={catalogTab} />
                      )}
                      <div className="cms-editor-body" hidden={catalogTab !== 'details'}>
                        {validationAttempt > 0 && !validation.valid && (
                          <Alert variant="destructive" role="alert" className="mb-6">
                            <AlertDescription>
                              Fix {validation.issues.length === 1 ? 'the highlighted field' : 'the highlighted fields'}{' '}
                              before publishing.
                            </AlertDescription>
                          </Alert>
                        )}
                        {message && (
                          <Alert
                            variant={conflict ? 'destructive' : 'default'}
                            role={conflict ? 'alert' : 'status'}
                            className="mb-6"
                          >
                            <AlertDescription className="whitespace-pre-wrap">{message}</AlertDescription>
                          </Alert>
                        )}
                        <form
                          id="content-editor-form"
                          noValidate
                          onSubmit={saveNew}
                          onFocusCapture={(event) =>
                            setFocusedPath(
                              (event.target as HTMLElement).closest<HTMLElement>('[data-content-path]')?.dataset
                                .contentPath ?? '',
                            )
                          }
                        >
                          <fieldset disabled={busy} className="cms-fields grid min-w-0 gap-6 @2xl:grid-cols-2">
                            <legend className="sr-only">{contentSections[collection]} details</legend>
                            <ContentFields
                              key={document.item.slug}
                              collection={collection}
                              data={data}
                              base={base}
                              disabled={busy}
                              validation={validation}
                              validationAttempt={validationAttempt}
                              onChange={(next) => {
                                setData(next);
                                setDirty(true);
                              }}
                            />
                          </fieldset>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-muted-foreground">Choose a title to edit.</div>
                  )}
                </section>
              </Tabs.Content>
            </ResizablePanel>
            <ResizableHandle
              disabled={!wide || !desktopPreview}
              className="cms-resize-handle"
              aria-label="Resize editor and preview"
            />
            <ResizablePanel
              id="preview"
              defaultSize="50%"
              minSize={wide && desktopPreview ? '25%' : '0%'}
              className="cms-preview-panel"
            >
              {document && mobileEditor && (
                <Tabs.Content value="preview" forceMount className="cms-preview-pane" id="content-preview-pane">
                  <ContentPreview
                    key={`${collection}:${document.item.id || document.item.slug}`}
                    collection={collection}
                    focusedPath={focusedPath}
                    id={document.item.id}
                    slug={document.item.slug}
                    data={data}
                    base={base}
                    restoreScroll={
                      previewScroll.key === `${collection}:${document.item.id || document.item.slug}`
                        ? previewScroll
                        : undefined
                    }
                    dirty={dirty}
                    valid={validation.valid}
                    active={!media && catalogTab === 'details' && (wide ? desktopPreview : preview)}
                  />
                </Tabs.Content>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </Tabs.Root>
      </div>
      <AlertDialog
        open={confirmReload}
        onOpenChange={(open) => {
          setConfirmReload(open);
          if (!open) {
            const focusTarget = reloadFocus.current ?? editorHeading.current;
            requestAnimationFrame(() => {
              if (focusTarget?.isConnected) focusTarget.focus();
              else editorHeading.current?.focus();
              reloadFocus.current = null;
            });
          }
        }}
      >
        <AlertDialogContent className="cms-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {document?.item.id ? 'Discard unsaved changes?' : 'Discard new content?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {document?.item.id
                ? 'Your unsaved edits will be replaced with the saved version.'
                : 'Your new content will be cleared and will not be saved.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => void discardChanges()}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmTrash} onOpenChange={setConfirmTrash}>
        <AlertDialogContent className="cms-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>Move {title} to trash?</AlertDialogTitle>
            <AlertDialogDescription>The public site will not change until publication.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep content</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Move to trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
