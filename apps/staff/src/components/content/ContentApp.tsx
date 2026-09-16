import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { ButtonGroup } from '../ui/button-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Table, TableBody, TableRow, TableCell } from '../ui/table';
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs } from 'radix-ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
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
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import ContentNavigation from './ContentNavigation';
import MediaLibrary from './MediaLibrary';
import ContentFields, {
  contentSections,
  singletonContentSections,
  type ContentSection,
  type ContentData,
} from './ContentFields';
import ContentPreview from './ContentPreview';
import ContentSelector from './ContentSelector';
import PublicationStatus from './PublicationStatus';
import { getContentValidation, type ContentValidation } from './content-validation';
import {
  readContentPublications,
  publishSavedContent,
  type ContentPublication,
  type SelectedPublicationRequest,
  type SelectedPublicationRecord,
} from '../../lib/backend/content-publication-api';
import {
  EditorialApiError,
  editorialRequest,
  editorialSlug,
  editorialWriteData,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

type Document = { item: EditorialRecord; _rev: string };
function contentSave(document: Document, data: ContentData) {
  if (!document._rev) throw new Error('Load the saved version before saving.');
  // The saved slug and identity remain unchanged when the member renames a title.
  return { _rev: document._rev, data: editorialWriteData(data) };
}

export default function ContentApp({ backendBaseUrl: base }: { backendBaseUrl: string }) {
  const [collection, setCollection] = useState<ContentSection>('artists');
  const [items, setItems] = useState<EditorialRecord[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [query, setQuery] = useState('');
  const [media, setMedia] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const discardTrigger = useRef<HTMLButtonElement>(null);
  const reloadFocus = useRef<HTMLElement | null>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  function updateUrl(section: ContentSection, id?: string, mediaView = false) {
    const params = new URLSearchParams({ collection: section });
    if (id) params.set('id', id);
    if (mediaView) params.set('view', 'media');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
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
      setDesktopPreview(localStorage.getItem('blackbox-content-preview') === 'open');
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
    const media = window.matchMedia('(min-width: 1100px)');
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
  const [requestingPublication, setRequestingPublication] = useState(false);
  const [pendingPublication, setPendingPublication] = useState<SelectedPublicationRequest | null>(null);
  const refreshedPublication = useRef('');
  const pendingKey = `blackbox-content-create:${base}`;
  const publicationKey = `blackbox-content-publication-v2:${base}`;
  const selectionKey = `blackbox-content-publication-selection:${base}`;
  const [publicationSelection, setPublicationSelection] = useState<(SelectedPublicationRecord & { title: string })[]>(
    [],
  );
  function retainSelection(items: (SelectedPublicationRecord & { title: string })[]) {
    try {
      localStorage.setItem(selectionKey, JSON.stringify(items));
    } catch {
      setMessage('Selection could not be saved in this browser.');
      return;
    }
    setPublicationSelection(items);
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
        setDocument((current) => (current?.item.id === loaded.item.id ? loaded : current));
        refreshedPublication.current = latest.id;
      }
    } catch {
      setPublicationStatusError('Publication status is unavailable. Check again before assuming a change is live.');
    }
  }
  async function publish(records?: SelectedPublicationRecord[]) {
    if (busy || dirty || conflict || (!records && (!document?.item.id || !requireValidContent()))) return;
    setBusy(true);
    setRequestingPublication(true);
    setPublicationMessage('Requesting publication…');
    try {
      let input = pendingPublication;
      if (!input) {
        input = {
          id: crypto.randomUUID(),
          records: records ?? [{ collection, recordId: document!.item.id, expectedRevision: document!._rev }],
        };
        localStorage.setItem(publicationKey, JSON.stringify(input));
        setPendingPublication(input);
      }
      const accepted = await publishSavedContent(base, input);
      localStorage.removeItem(publicationKey);
      setPendingPublication(null);
      const included = 'records' in input ? input.records : [input];
      retainSelection(
        publicationSelection.filter(
          (record) =>
            !included.some(
              (item) =>
                item.collection === record.collection &&
                item.recordId === record.recordId &&
                item.expectedRevision === record.expectedRevision,
            ),
        ),
      );
      setPublications((items) => [accepted, ...items.filter((item) => item.id !== accepted.id)].slice(0, 10));
      await publicationStatus();
      setPublicationMessage(
        accepted.status === 'live'
          ? 'Publication is live on fresh public page loads.'
          : accepted.status === 'failed'
            ? 'Publication failed. Select Publish changes to try again.'
            : 'Publication requested. Wait for Live before checking a fresh public page.',
      );
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 409].includes(error.status)) {
        localStorage.removeItem(publicationKey);
        setPendingPublication(null);
        setConflict(error.status === 409);
      }
      setPublicationMessage(error instanceof Error ? error.message : 'Publication could not be confirmed.');
    } finally {
      setRequestingPublication(false);
      setBusy(false);
    }
  }

  async function list(section = collection, next?: string, search = query) {
    setBusy(true);
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (search.trim()) params.set('q', search.trim());
      if (next) params.set('cursor', next);
      const page = await editorialRequest<EditorialList<EditorialRecord>>(base, `content/${section}?${params}`);
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
      return page;
    } catch {
      setMessage('We could not load the content. Select Search to try again.');
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setReady(true);
    let publication: string | null = null;
    try {
      publication = localStorage.getItem(publicationKey);
    } catch {
      // Storage can be disabled. Read authoritative publication history below; writes still retain their recovery guard.
    }
    if (publication) {
      try {
        const input = JSON.parse(publication) as SelectedPublicationRequest;
        const records = 'records' in input ? input.records : [input];
        if (
          typeof input.id !== 'string' ||
          !Array.isArray(records) ||
          !records.length ||
          records.length > 20 ||
          records.some(
            (record) =>
              typeof record.collection !== 'string' ||
              typeof record.recordId !== 'string' ||
              typeof record.expectedRevision !== 'string',
          )
        )
          throw new Error();
        setPendingPublication(input);
      } catch {
        setPublicationMessage('The last publication request could not be read. Ask a label administrator for help.');
      }
    }
    try {
      const selected = JSON.parse(localStorage.getItem(selectionKey) ?? '[]') as (SelectedPublicationRecord & {
        title: string;
      })[];
      if (
        Array.isArray(selected) &&
        selected.length <= 20 &&
        selected.every(
          (item) =>
            typeof item.title === 'string' &&
            typeof item.collection === 'string' &&
            typeof item.recordId === 'string' &&
            typeof item.expectedRevision === 'string',
        )
      )
        setPublicationSelection(selected);
    } catch {
      setMessage('The publication selection could not be restored. Select the saved records again.');
    }
    void publicationStatus();
    const pending = sessionStorage.getItem(pendingKey);
    if (pending) {
      try {
        const saved = JSON.parse(pending) as { collection: ContentSection; slug: string; data: ContentData };
        if (!['news', 'socials'].includes(saved.collection)) throw new Error('Unsupported section');
        setCollection(saved.collection);
        setDocument({ item: { id: '', slug: saved.slug, data: saved.data }, _rev: '' });
        setData(saved.data);
        setPendingNew(saved.data);
        setMobileEditor(true);
        setMessage('Check the last save before creating another record.');
        void list(saved.collection);
      } catch {
        setMessage('The last save could not be read. Ask a label administrator for help.');
      }
    } else {
      const selected = new URLSearchParams(window.location.search);
      const mediaView = selected.get('view') === 'media';
      setMedia(mediaView);
      const section = selected.get('collection');
      const id = selected.get('id');
      if (section && Object.hasOwn(contentSections, section)) {
        const contentSection = section as ContentSection;
        setCollection(contentSection);
        const listed = list(contentSection);
        if (id)
          void editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(id)}`)
            .then((loaded) => {
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
  function requestDiscard(trigger: HTMLElement | null = discardTrigger.current) {
    reloadFocus.current = trigger;
    setConfirmReload(true);
  }
  async function discardChanges() {
    const current = document;
    const focusTarget = reloadFocus.current ?? discardTrigger.current;
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
    if (!replace && !mayLeave()) return;
    setBusy(true);
    setMessage('');
    try {
      const loaded = await editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(item.id)}`);
      setDocument(loaded);
      setData(loaded.item.data);
      setDirty(false);
      setValidationAttempt(0);
      setConflict(false);
      setMobileEditor(true);
      updateUrl(section, loaded.item.id);
      editorHeading.current?.focus();
    } catch {
      setMessage('We could not load this record. Try again.');
    } finally {
      setBusy(false);
    }
  }
  function openSingletonFromPage(section: ContentSection, page: EditorialList<EditorialRecord> | null) {
    if (!singletonContentSections.includes(section) || page?.items.length !== 1) return;
    const item = page.items[0];
    if (item) void open(item, true, section);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!document || busy || conflict) return;
    if (!requireValidContent()) return;
    setBusy(true);
    setMessage('');
    try {
      const saved = await editorialRequest<Document>(
        base,
        `content/${collection}/${encodeURIComponent(document.item.id)}`,
        contentSave(document, data),
        'PUT',
      );
      setDocument(saved);
      setData(saved.item.data);
      setDirty(false);
      setValidationAttempt(0);
      setItems((items) => items.map((item) => (item.id === saved.item.id ? saved.item : item)));
      setMessage('');
    } catch (error) {
      setConflict(error instanceof EditorialApiError && error.status === 409);
      setMessage(error instanceof Error ? error.message : 'We could not confirm the save. Your text is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if (!mayLeave() || !['news', 'socials'].includes(collection)) return;
    // Start locally. The server receives the first write only after the form is valid.
    setDocument({ item: { id: '', slug: editorialSlug(collection, crypto.randomUUID()), data: {} }, _rev: '' });
    setData(
      collection === 'news'
        ? { title: '', date: '', summary: '', image: null, image_alt: '', body: [] }
        : { title: '', url: '', order: 0 },
    );
    setDirty(false);
    setValidationAttempt(0);
    setConflict(false);
    setMessage('');
    setMobileEditor(true);
    updateUrl(collection);
  }
  async function saveNew(event: React.FormEvent) {
    if (document?.item.id) return save(event);
    event.preventDefault();
    if (!document || busy) return;
    if (!requireValidContent()) return;
    setBusy(true);
    setMessage('');
    try {
      const commandData = pendingNew ?? editorialWriteData(data);
      sessionStorage.setItem(pendingKey, JSON.stringify({ collection, slug: document.item.slug, data: commandData }));
      setPendingNew(commandData);
      let saved: Document;
      try {
        saved = await editorialRequest<Document>(base, `content/${collection}/${document.item.slug}`);
      } catch (error) {
        if (!(error instanceof EditorialApiError) || error.status !== 404) throw error;
        saved = await editorialRequest<Document>(base, `content/${collection}`, {
          slug: document.item.slug,
          data: commandData,
        });
      }
      sessionStorage.removeItem(pendingKey);
      setPendingNew(null);
      setDocument(saved);
      setData(saved.item.data);
      setItems((items) => [saved.item, ...items.filter((item) => item.id !== saved.item.id)]);
      setDirty(false);
      setValidationAttempt(0);
      setMessage('Draft created. The public site has not changed.');
      updateUrl(collection, saved.item.id);
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 422].includes(error.status)) {
        sessionStorage.removeItem(pendingKey);
        setPendingNew(null);
      }
      setMessage(error instanceof Error ? error.message : 'We could not confirm the save. Your text is still here.');
    } finally {
      setBusy(false);
    }
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
  function selectCollection(section: ContentSection) {
    if (section === collection) {
      setMedia(false);
      if (!document && singletonContentSections.includes(section)) {
        setQuery('');
        setItems([]);
        setCursor(undefined);
        updateUrl(collection);
        void list(section, undefined, '').then((page) => openSingletonFromPage(section, page));
      } else updateUrl(collection, document?.item.id);
      return;
    }
    if (!mayLeave()) {
      setMedia(false);
      return;
    }
    setCollection(section);
    setMedia(false);
    setQuery('');
    setDocument(null);
    setItems([]);
    setCursor(undefined);
    setDirty(false);
    setValidationAttempt(0);
    setMobileEditor(false);
    setMessage('');
    updateUrl(section);
    void list(section, undefined, '').then((page) => openSingletonFromPage(section, page));
  }
  const canCreate = ['news', 'socials'].includes(collection);
  const canPublish = !['releases', 'distro'].includes(collection);
  const singleton = singletonContentSections.includes(collection);
  const title = String(data.title || data.label_name || contentSections[collection]);
  return (
    <SidebarProvider
      className="cms-surface cms-workspace"
      style={{ '--sidebar-width': '220px' } as React.CSSProperties}
    >
      <ContentNavigation
        collection={collection}
        media={media}
        disabled={!ready || busy || !!pendingNew}
        onCollection={selectCollection}
        onMedia={() => {
          if (!mayLeave()) return;
          setMedia(true);
          updateUrl(collection, document?.item.id, true);
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="cms-workspace-bar flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <SidebarTrigger className="size-11 shrink-0" />
          <Separator orientation="vertical" className="h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Content</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{media ? 'Images' : contentSections[collection]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {publicationSelection.length > 0 && (
            <details className="relative ml-auto">
              <summary className="cursor-pointer text-sm">
                Selected for publication ({publicationSelection.length})
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-72 max-w-[85vw] rounded-md border border-border bg-background p-4 shadow-lg">
                <p className="mb-3 text-sm text-muted-foreground">
                  These saved versions will go live together. Add a record again after editing it.
                </p>
                <ul className="mb-3 space-y-2">
                  {publicationSelection.map((record) => (
                    <li
                      key={`${record.collection}/${record.recordId}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>{record.title}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove ${record.title} from publication`}
                        disabled={busy}
                        onClick={() => retainSelection(publicationSelection.filter((item) => item !== record))}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  disabled={busy || dirty || conflict}
                  onClick={() => void publish(publicationSelection.map(({ title: _title, ...record }) => record))}
                >
                  {pendingPublication
                    ? 'Retry publication request'
                    : `Publish selected (${publicationSelection.length})`}
                </Button>
              </div>
            </details>
          )}
          <div className="ml-auto">
            <PublicationStatus
              items={publications}
              requesting={requestingPublication}
              statusError={publicationStatusError}
              message={publicationMessage}
              refresh={publicationStatus}
            />
          </div>
          {media && document && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto"
              aria-label="Back to draft"
              onClick={() => {
                setMedia(false);
                updateUrl(collection, document.item.id);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to draft</span>
            </Button>
          )}
        </div>
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
          className={`cms-content-panes ${document && mobileEditor ? 'cms-editing' : ''} ${desktopPreview ? '' : 'cms-preview-closed'}`}
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
                <Button type="submit" variant="outline" disabled={!ready || busy}>
                  Search
                </Button>
              </form>
              {canCreate && (
                <Button type="button" disabled={!ready || busy || !!pendingNew} onClick={() => void create()}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add {collection === 'news' ? 'news' : 'social link'}
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
                <Alert role={conflict ? 'alert' : 'status'} className="m-4 w-auto md:hidden">
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
                    {items.map((item) => (
                      <TableRow key={item.id} data-state={document?.item.id === item.id ? 'selected' : undefined}>
                        <TableCell className="p-0">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto min-h-16 w-full justify-start rounded-none px-4 py-3 text-left whitespace-normal"
                            disabled={!ready || busy || !!pendingNew}
                            aria-current={document?.item.id === item.id ? 'true' : undefined}
                            onClick={() => void open(item)}
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="min-w-0 break-words">
                              {String(item.data.title ?? item.data.label_name ?? contentSections[collection])}
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!busy && !items.length && (
                <p className="p-6 text-sm text-muted-foreground">No matching content. Try another search.</p>
              )}
              {cursor && (
                <div className="p-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void list(collection, cursor)}
                  >
                    Show more
                  </Button>
                </div>
              )}
            </div>
          </section>
          <Tabs.Content value="edit" forceMount asChild>
            <section
              aria-label="Content editor"
              className={`cms-editor ${!mobileEditor ? 'cms-editor-mobile-hidden' : ''}`}
            >
              {document ? (
                <>
                  <header className="cms-editor-toolbar">
                    <div className="flex min-w-0 items-center gap-2">
                      {singleton ? (
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold" aria-hidden="true">
                          {title}
                        </span>
                      ) : (
                        <>
                          <ContentSelector
                            title={title}
                            section={contentSections[collection]}
                            items={items}
                            selected={document.item.id}
                            query={query}
                            disabled={busy || !!pendingNew}
                            more={!!cursor}
                            onQuery={(query) => {
                              setQuery(query);
                              setItems([]);
                              setCursor(undefined);
                            }}
                            onSearch={() => void list()}
                            onMore={() => void list(collection, cursor)}
                            onSelect={open}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label="Back to records"
                            title="Back to records"
                            onClick={() => {
                              if (!mayLeave()) return;
                              setMobileEditor(false);
                              requestAnimationFrame(() => listHeading.current?.focus());
                            }}
                          >
                            <ArrowLeft className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 ref={editorHeading} tabIndex={-1} className="sr-only">
                        {title}
                      </h2>
                      <p
                        role="status"
                        className={`mt-1 text-xs ${dirty ? 'cms-state-warning' : 'text-muted-foreground'}`}
                      >
                        {busy && dirty ? 'Saving…' : dirty ? 'Unsaved changes' : 'Draft saved'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {wide && (
                        <Button
                          type="button"
                          variant={desktopPreview ? 'secondary' : 'outline'}
                          aria-expanded={desktopPreview}
                          aria-controls="content-preview-pane"
                          onClick={togglePreview}
                        >
                          {desktopPreview ? (
                            <EyeOff className="size-4" aria-hidden="true" />
                          ) : (
                            <Eye className="size-4" aria-hidden="true" />
                          )}
                          {desktopPreview ? 'Hide preview' : 'Show preview'}
                        </Button>
                      )}
                      <Button
                        ref={discardTrigger}
                        type="button"
                        variant="outline"
                        className="px-3"
                        disabled={!dirty || busy || !!pendingNew}
                        onClick={() => requestDiscard()}
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Discard changes
                      </Button>
                      <ButtonGroup aria-label="Draft actions">
                        <Button type="submit" className="px-3" form="content-editor-form" disabled={busy || conflict}>
                          {busy ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden="true" />}
                          {pendingNew ? 'Check last save' : 'Save draft'}
                        </Button>
                      </ButtonGroup>
                      {canPublish && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            busy ||
                            dirty ||
                            conflict ||
                            !validation.valid ||
                            !document.item.id ||
                            publicationSelection.length >= 20
                          }
                          onClick={() =>
                            retainSelection([
                              ...publicationSelection.filter(
                                (record) => record.collection !== collection || record.recordId !== document.item.id,
                              ),
                              { collection, recordId: document.item.id, expectedRevision: document._rev, title },
                            ])
                          }
                        >
                          Add to publication
                        </Button>
                      )}
                      {canPublish && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={dirty || conflict || !validation.valid ? 0 : undefined}>
                              <Button
                                type="button"
                                variant="outline"
                                className="px-3"
                                disabled={busy || dirty || conflict || !validation.valid || !document.item.id}
                                onClick={() => void publish()}
                              >
                                <Send className="size-4" aria-hidden="true" />
                                {pendingPublication ? 'Retry publication request' : 'Publish changes'}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {!validation.valid
                              ? 'Fix the highlighted fields before publishing.'
                              : dirty || conflict
                                ? 'Save your draft before requesting publication.'
                                : 'Publish this saved revision to the website.'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="More draft actions"
                            title="More draft actions"
                            disabled={busy || !!pendingNew}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="cms-surface" align="end">
                          {canCreate && (
                            <DropdownMenuItem
                              disabled={!document.item.id || dirty}
                              onSelect={() => setConfirmTrash(true)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Move to trash
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>
                  <div className="cms-editor-body">
                    {validationAttempt > 0 && !validation.valid && (
                      <Alert variant="destructive" role="alert" className="mb-6">
                        <AlertDescription>
                          Fix {validation.issues.length === 1 ? 'the highlighted field' : 'the highlighted fields'}{' '}
                          before saving.
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
                    {canPublish && (dirty || conflict) && (
                      <p className="mb-4 text-sm cms-state-warning">
                        {conflict
                          ? 'Reload the saved version to resolve the conflict before publishing.'
                          : 'Save your draft before publishing changes.'}
                      </p>
                    )}
                    {!canPublish && (
                      <p className="mb-6 text-sm text-muted-foreground">
                        Save editorial changes here. Publish linked items from{' '}
                        <a href="/items/" className="underline underline-offset-4">
                          Items
                        </a>
                        .
                      </p>
                    )}
                    <form id="content-editor-form" noValidate onSubmit={saveNew}>
                      <fieldset
                        disabled={busy || !!pendingNew}
                        className="cms-fields grid min-w-0 gap-6 @2xl:grid-cols-2"
                      >
                        <legend className="sr-only">{contentSections[collection]} details</legend>
                        <ContentFields
                          key={`${document.item.id || document.item.slug}:${document._rev}`}
                          collection={collection}
                          data={data}
                          base={base}
                          disabled={busy || !!pendingNew}
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
                <div className="grid flex-1 place-content-center gap-3 p-8 text-center">
                  <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                  <h2 className="text-xl font-semibold">Select content to edit</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Choose a record from {contentSections[collection].toLowerCase()} to edit its draft.
                  </p>
                  {message && (
                    <Alert role="status">
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </section>
          </Tabs.Content>
          {document && mobileEditor && (
            <Tabs.Content value="preview" forceMount className="cms-preview-pane" id="content-preview-pane">
              <ContentPreview
                key={`${collection}:${document.item.id || document.item.slug}`}
                collection={collection}
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
                active={!media && (wide ? desktopPreview : preview)}
              />
            </Tabs.Content>
          )}
        </Tabs.Root>
      </div>
      <AlertDialog
        open={confirmReload}
        onOpenChange={(open) => {
          setConfirmReload(open);
          if (!open) {
            const focusTarget = reloadFocus.current ?? discardTrigger.current;
            requestAnimationFrame(() => {
              if (focusTarget?.isConnected) focusTarget.focus();
              else discardTrigger.current?.focus();
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
    </SidebarProvider>
  );
}
